-- HardWorkIQ schema. Paste into Supabase SQL Editor and run once.
-- Project: ewdoqyixsioeymfrvfyw

create extension if not exists pgcrypto;

create table if not exists public.branding (
  id int primary key default 1,
  app_name text not null default 'HardWorkIQ',
  short_name text not null default 'HardWorkIQ',
  tagline text not null default 'Hard work shows up on the field.',
  sport text not null default 'football',
  email_domain text not null default 'maldencatholic.org',
  logo_url text not null default 'icons/hardworkiq.png',
  colors jsonb not null default '{
    "ink":"#101b23","ink2":"#182935","ink3":"#25404f","chalk":"#f1f4ee",
    "marker":"#f2c230","turf":"#2f6b46","turfDark":"#27593b","line":"#365467","muted":"#93a9b7"
  }'::jsonb,
  updated_at timestamptz not null default now(),
  constraint one_row check (id = 1)
);

insert into public.branding (id) values (1) on conflict (id) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  username text not null unique,
  role text not null default 'player' check (role in ('player','super')),
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  points int not null default 0,
  current_streak int not null default 0,
  best_streak int not null default 0,
  clean_plays int not null default 0,
  reps int not null default 0,
  sessions int not null default 0,
  studied int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.play_stats (
  user_id uuid not null references public.profiles(id) on delete cascade,
  play_id text not null,
  views int not null default 0,
  clean int not null default 0,
  learned boolean not null default false,
  primary key (user_id, play_id)
);

create or replace view public.leaderboard
  with (security_invoker = true)
  as
  select s.user_id, p.username, s.points, s.current_streak as current_streak,
         s.best_streak as best_streak, s.clean_plays, s.reps, s.sessions, s.studied
  from public.scores s
  join public.profiles p on p.id = s.user_id;

create or replace function public.is_super()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'super' or lower(email) = 'jdonovan151@gmail.com')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
  domain text;
  role text := 'player';
begin
  uname := coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), 'P' || substr(replace(new.id::text, '-', ''), 1, 9));
  select email_domain into domain from public.branding where id = 1;
  if domain is null then domain := 'maldencatholic.org'; end if;
  if lower(new.email) = 'jdonovan151@gmail.com' then
    role := 'super';
  elsif split_part(lower(new.email), '@', 2) <> lower(domain) then
    raise exception 'Use your school email ending in @%', domain;
  end if;
  insert into public.profiles (id, email, username, role)
    values (new.id, lower(new.email), uname, role);
  insert into public.scores (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_super()
returns trigger
language plpgsql
as $$
begin
  if old.email = 'jdonovan151@gmail.com' or old.role = 'super' then
    raise exception 'The owner account can never be removed';
  end if;
  return old;
end;
$$;

drop trigger if exists protect_super on public.profiles;
create trigger protect_super
  before delete on public.profiles
  for each row execute function public.protect_super();

create or replace function public.award_event(
  p_type text,
  p_play_id text default '',
  p_play_name text default 'Play',
  p_pass boolean default false,
  p_hint boolean default false,
  p_skipped boolean default false,
  p_clean int default 0,
  p_total int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  sc public.scores%rowtype;
  st public.play_stats%rowtype;
  pts int := 0;
  reason text := '';
  extra int := 0;
  learned boolean := false;
  streak_bonus int := 0;
  me jsonb;
begin
  if uid is null then raise exception 'Sign in first.'; end if;
  insert into public.scores (user_id) values (uid) on conflict (user_id) do nothing;
  select * into sc from public.scores where user_id = uid for update;

  if p_type = 'study_view' then
    insert into public.play_stats (user_id, play_id) values (uid, p_play_id)
      on conflict (user_id, play_id) do nothing;
    update public.play_stats set views = views + 1
      where user_id = uid and play_id = p_play_id
      returning * into st;
    if st.views = 1 then
      pts := 20; reason := 'First look at ' || p_play_name;
      update public.scores set studied = studied + 1, points = points + pts, updated_at = now() where user_id = uid;
    else
      pts := 5; reason := 'Reviewed ' || p_play_name;
      update public.scores set points = points + pts, updated_at = now() where user_id = uid;
    end if;

  elsif p_type = 'study_run' then
    pts := 15; reason := 'Ran ' || p_play_name;
    update public.scores set points = points + pts, updated_at = now() where user_id = uid;

  elsif p_type = 'practice_rep' then
    update public.scores set reps = reps + 1 where user_id = uid;
    if p_skipped then
      update public.scores set current_streak = 0, updated_at = now() where user_id = uid;
      pts := 0; reason := 'Skipped — streak reset';
    elsif not p_pass then
      update public.scores set current_streak = 0, points = points + 5, updated_at = now() where user_id = uid;
      pts := 5; reason := 'Rep in the book. Streak reset.';
    elsif p_hint then
      update public.scores set current_streak = 0, points = points + 20, updated_at = now() where user_id = uid;
      pts := 20; reason := 'Got it with a hint. Streak reset.';
    else
      if p_play_id <> '' then
        insert into public.play_stats (user_id, play_id) values (uid, p_play_id)
          on conflict (user_id, play_id) do nothing;
        update public.play_stats set clean = clean + 1
          where user_id = uid and play_id = p_play_id
          returning * into st;
        if st.learned = false and st.clean >= 3 then
          update public.play_stats set learned = true where user_id = uid and play_id = p_play_id;
          extra := 100; learned := true;
        end if;
      end if;
      update public.scores
        set current_streak = current_streak + 1,
            clean_plays = clean_plays + 1,
            best_streak = greatest(best_streak, current_streak + 1),
            points = points + 50 + ((current_streak) * 10) + extra,
            updated_at = now()
        where user_id = uid
        returning * into sc;
      streak_bonus := (sc.current_streak - 1) * 10;
      pts := 50 + streak_bonus + extra;
      reason := 'CLEAN +50';
      if streak_bonus > 0 then reason := reason || ' · streak x' || sc.current_streak || ' +' || streak_bonus; end if;
      if learned then reason := reason || ' · Mastered +100'; end if;
    end if;

  elsif p_type = 'session_done' then
    pts := 30; reason := 'Session complete +30';
    if p_total > 0 and p_clean = p_total then
      pts := 105; reason := 'Perfect session +105';
    elsif p_total > 0 and (p_clean::numeric / p_total) >= 0.8 then
      pts := 70; reason := 'Hot session +70';
    end if;
    update public.scores set sessions = sessions + 1, points = points + pts, updated_at = now() where user_id = uid;
  else
    raise exception 'Unknown event';
  end if;

  select * into sc from public.scores where user_id = uid;
  select jsonb_build_object(
    'id', p.id, 'email', p.email, 'username', p.username, 'role', p.role,
    'points', sc.points, 'currentStreak', sc.current_streak, 'bestStreak', sc.best_streak,
    'cleanPlays', sc.clean_plays, 'reps', sc.reps, 'sessions', sc.sessions, 'studied', sc.studied
  ) into me
  from public.profiles p where p.id = uid;

  return jsonb_build_object('points', pts, 'reason', reason, 'total', sc.points, 'streak', sc.current_streak, 'bestStreak', sc.best_streak, 'learned', learned, 'me', me);
end;
$$;

create or replace function public.admin_list_users()
returns table (
  id uuid, email text, username text, role text, created_at timestamptz,
  points int, best_streak int, current_streak int, locked boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super() then raise exception 'Owner access only.'; end if;
  return query
    select p.id, p.email, p.username, p.role, p.created_at,
           coalesce(s.points,0), coalesce(s.best_streak,0), coalesce(s.current_streak,0),
           (p.role = 'super' or lower(p.email) = 'jdonovan151@gmail.com')
    from public.profiles p
    left join public.scores s on s.user_id = p.id
    order by p.created_at;
end;
$$;

create or replace function public.admin_delete_user(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  em text;
  r text;
begin
  if not public.is_super() then raise exception 'Owner access only.'; end if;
  select email, role into em, r from public.profiles where id = p_id;
  if em is null then raise exception 'No such player.'; end if;
  if r = 'super' or lower(em) = 'jdonovan151@gmail.com' then
    raise exception 'The owner account can never be removed';
  end if;
  delete from public.profiles where id = p_id;
end;
$$;

alter table public.branding enable row level security;
alter table public.profiles enable row level security;
alter table public.scores enable row level security;
alter table public.play_stats enable row level security;

drop policy if exists branding_read on public.branding;
create policy branding_read on public.branding for select using (true);
drop policy if exists branding_update on public.branding;
create policy branding_update on public.branding for update to authenticated
  using (public.is_super()) with check (public.is_super());

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists scores_read on public.scores;
create policy scores_read on public.scores for select to authenticated using (true);

drop policy if exists play_stats_own on public.play_stats;
create policy play_stats_own on public.play_stats for select to authenticated using (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on public.branding to anon, authenticated;
grant select on public.leaderboard to authenticated;
grant select on public.profiles, public.scores to authenticated;
grant execute on function public.award_event to authenticated;
grant execute on function public.admin_list_users to authenticated;
grant execute on function public.admin_delete_user to authenticated;
