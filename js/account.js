window.Account = (function () {
  const me = { user: null, branding: null, quote: null, mode: 'guest', client: null };

  const FALLBACK_BRAND = {
    appName: 'HardWorkIQ',
    shortName: 'HardWorkIQ',
    tagline: 'Hard work shows up on the field.',
    sport: 'football',
    emailDomain: (window.HWIQ_CONFIG && window.HWIQ_CONFIG.defaultDomain) || 'maldencatholic.org',
    logoUrl: 'icons/hardworkiq.png',
    colors: {
      ink: '#101b23', ink2: '#182935', ink3: '#25404f', chalk: '#f1f4ee',
      marker: '#f2c230', turf: '#2f6b46', turfDark: '#27593b', line: '#365467', muted: '#93a9b7'
    }
  };

  function client() {
    if (me.client) return me.client;
    const cfg = window.HWIQ_CONFIG;
    if (!window.supabase || !cfg) throw new Error('Supabase is not loaded.');
    me.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    return me.client;
  }

  function applyBranding(b) {
    const brand = Object.assign({}, FALLBACK_BRAND, b || {});
    brand.colors = Object.assign({}, FALLBACK_BRAND.colors, (b && b.colors) || {});
    me.branding = brand;
    const r = document.documentElement.style;
    const map = {
      ink: '--ink', ink2: '--ink-2', ink3: '--ink-3', chalk: '--chalk',
      marker: '--marker', turf: '--turf', turfDark: '--turf-dark',
      line: '--line', muted: '--muted'
    };
    Object.keys(map).forEach(k => { if (brand.colors[k]) r.setProperty(map[k], brand.colors[k]); });
    if (brand.colors.ink) {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', brand.colors.ink);
    }
    if (brand.appName) document.title = brand.appName;
    const apple = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (apple && brand.shortName) apple.setAttribute('content', brand.shortName);
    document.querySelectorAll('[data-brand-name]').forEach(n => { n.textContent = brand.appName; });
    document.querySelectorAll('[data-brand-tag]').forEach(n => { n.textContent = brand.tagline; });
    document.querySelectorAll('img[data-brand-logo]').forEach(n => { n.src = brand.logoUrl || FALLBACK_BRAND.logoUrl; });
    return brand;
  }

  async function loadBranding() {
    try {
      const { data, error } = await client().from('branding').select('*').eq('id', 1).maybeSingle();
      if (error || !data) return applyBranding(FALLBACK_BRAND);
      return applyBranding({
        appName: data.app_name,
        shortName: data.short_name,
        tagline: data.tagline,
        sport: data.sport,
        emailDomain: data.email_domain,
        logoUrl: data.logo_url,
        colors: data.colors
      });
    } catch (e) {
      return applyBranding(FALLBACK_BRAND);
    }
  }

  async function loadMe() {
    const { data: sess } = await client().auth.getSession();
    const uid = sess && sess.session && sess.session.user;
    if (!uid) { me.user = null; me.mode = 'login'; return null; }
    const { data: profile } = await client().from('profiles').select('*').eq('id', uid.id).maybeSingle();
    const { data: score } = await client().from('scores').select('*').eq('user_id', uid.id).maybeSingle();
    me.user = {
      id: uid.id,
      email: uid.email,
      username: (profile && profile.username) || 'Player',
      role: (profile && profile.role) || (String(uid.email).toLowerCase() === window.HWIQ_CONFIG.superEmail ? 'super' : 'player'),
      points: (score && score.points) || 0,
      currentStreak: (score && score.current_streak) || 0,
      bestStreak: (score && score.best_streak) || 0,
      cleanPlays: (score && score.clean_plays) || 0,
      reps: (score && score.reps) || 0,
      sessions: (score && score.sessions) || 0,
      studied: (score && score.studied) || 0
    };
    me.mode = 'auth';
    return me.user;
  }

  async function boot(kind) {
    applyBranding(FALLBACK_BRAND);
    me.quote = window.pickQuote && window.pickQuote('football');
    try {
      await loadBranding();
      me.quote = window.pickQuote(me.branding.sport);
      await loadMe();
    } catch (e) {
      me.mode = 'guest';
    }
    if (kind === 'login' && me.mode === 'auth') {
      location.href = 'index.html';
      return false;
    }
    if ((kind === 'app' || kind === 'admin') && me.mode !== 'auth') {
      location.href = 'login.html';
      return false;
    }
    if (kind === 'admin' && me.user && me.user.role !== 'super') {
      location.href = 'index.html';
      return false;
    }
    return true;
  }

  function domainOk(email) {
    const want = ((me.branding && me.branding.emailDomain) || window.HWIQ_CONFIG.defaultDomain).replace(/^@/, '').toLowerCase();
    const e = String(email || '').trim().toLowerCase();
    if (e === window.HWIQ_CONFIG.superEmail) return true;
    return e.endsWith('@' + want);
  }

  async function register(email, password, username) {
    const bad = window.checkUsername(username);
    if (bad) throw new Error(bad);
    const e = String(email || '').trim().toLowerCase();
    if (!domainOk(e))
      throw new Error('Use your school email ending in @' + ((me.branding && me.branding.emailDomain) || window.HWIQ_CONFIG.defaultDomain) + '.');
    if (String(password || '').length < 8) throw new Error('Password needs at least 8 characters.');
    const { data, error } = await client().auth.signUp({
      email: e,
      password: password,
      options: { data: { username: username } }
    });
    if (error) throw new Error(error.message);
    if (data.user && !data.session)
      throw new Error('Check your email to confirm the account, then sign in.');
    await loadMe();
    return me.user;
  }

  async function login(email, password) {
    const { error } = await client().auth.signInWithPassword({
      email: String(email || '').trim().toLowerCase(),
      password: password
    });
    if (error) throw new Error(error.message);
    await loadMe();
    return me.user;
  }

  async function logout() {
    try { await client().auth.signOut(); } catch (e) {}
    me.user = null;
    location.href = 'login.html';
  }

  async function event(type, payload) {
    if (me.mode !== 'auth') return null;
    const p = payload || {};
    const { data, error } = await client().rpc('award_event', {
      p_type: type,
      p_play_id: p.playId || '',
      p_play_name: p.playName || 'Play',
      p_pass: !!p.pass,
      p_hint: !!p.hint,
      p_skipped: !!p.skipped,
      p_clean: Number(p.clean) || 0,
      p_total: Number(p.total) || 0
    });
    if (error) throw new Error(error.message);
    if (data && data.me) me.user = Object.assign({}, me.user, data.me);
    else await loadMe();
    return data;
  }

  async function board() {
    const { data, error } = await client().from('leaderboard').select('*').order('points', { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    const rows = (data || []).map((r, i) => Object.assign({}, r, { rank: i + 1 }));
    const mine = rows.find(r => me.user && r.user_id === me.user.id);
    return { rows: rows, me: mine || me.user };
  }

  async function saveBranding(patch) {
    const { data, error } = await client().from('branding').update({
      app_name: patch.appName,
      short_name: patch.shortName,
      tagline: patch.tagline,
      sport: patch.sport,
      email_domain: String(patch.emailDomain || '').replace(/^@/, '').toLowerCase(),
      logo_url: patch.logoUrl,
      colors: patch.colors,
      updated_at: new Date().toISOString()
    }).eq('id', 1).select().single();
    if (error) throw new Error(error.message);
    return applyBranding({
      appName: data.app_name,
      shortName: data.short_name,
      tagline: data.tagline,
      sport: data.sport,
      emailDomain: data.email_domain,
      logoUrl: data.logo_url,
      colors: data.colors
    });
  }

  async function listUsers() {
    const { data, error } = await client().rpc('admin_list_users');
    if (error) throw new Error(error.message);
    return data || [];
  }

  async function removeUser(id) {
    const { error } = await client().rpc('admin_delete_user', { p_id: id });
    if (error) throw new Error(error.message);
  }

  return {
    me: me,
    fallback: FALLBACK_BRAND,
    client: client,
    applyBranding: applyBranding,
    loadBranding: loadBranding,
    boot: boot,
    register: register,
    login: login,
    logout: logout,
    event: event,
    board: board,
    saveBranding: saveBranding,
    listUsers: listUsers,
    removeUser: removeUser,
    domainOk: domainOk
  };
})();
