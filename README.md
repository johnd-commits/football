# HardWorkIQ

Phone-first play trainer for high school teams. Load the playbook, then run each assignment with a finger. Accounts, points, and the leaderboard live in Supabase.

**Live app:** https://football-iota-two.vercel.app/

## First-time Supabase setup

1. Open the [SQL Editor](https://supabase.com/dashboard/project/ewdoqyixsioeymfrvfyw/sql) for project `ewdoqyixsioeymfrvfyw`.
2. Paste and run `supabase/schema.sql`.
3. Auth → Providers → Email: turn **off** “Confirm email” so kids can sign in immediately with `@maldencatholic.org`.
4. Register once with **jdonovan151@gmail.com**. That account is the owner and can never be deleted.
5. Everyone else must use a `@maldencatholic.org` address and a 3–10 character jersey name.

Optional CLI (not required for Vercel):

```
npx supabase login
npx supabase init
npx supabase link --project-ref ewdoqyixsioeymfrvfyw
```

The database password stays in Supabase. Do not put it in the app.

## What it does

- **Practice** — trace your assignment. Clean reps (no hints) build a streak and points.
- **Study** — watch the play, then run it for bonus points.
- **Plays** — draw formations, type routes, upload cards.
- **Leaderboard** — tap your name in the header.
- **Admin** — owner-only white label (name, colors, logo, sport, school email domain).

Jersey names are 3–10 characters. Lewd or swear names are blocked.
