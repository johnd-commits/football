/* HardWorkIQ study / progress helpers — school-first, not a clone of any other product. */
window.HWIQ = (function () {
  const SITS = [
    { id: 'all', label: 'All situations' },
    { id: '1st10', label: '1st & 10' },
    { id: '2ndlong', label: '2nd & long' },
    { id: '3rdshort', label: '3rd & short' },
    { id: '3rdlong', label: '3rd & long' },
    { id: 'redzone', label: 'Red zone' },
    { id: 'goalline', label: 'Goal line' },
    { id: 'twomin', label: '2-minute' }
  ];
  const BALL = [
    { id: 'ownEZ', label: 'Own EZ', yards: 0 },
    { id: 'own20', label: 'Own 20', yards: 20 },
    { id: 'own40', label: 'Own 40', yards: 40 },
    { id: 'mid', label: '50', yards: 50 },
    { id: 'opp40', label: 'Opp 40', yards: 60 },
    { id: 'opp20', label: 'Opp 20', yards: 80 },
    { id: 'oppEZ', label: 'Opp EZ', yards: 100 }
  ];
  const SKILLS = [
    { id: 'rookie', label: 'Rookie', hint: 'Learning · 4 yd', tol: 4 },
    { id: 'varsity', label: 'Varsity', hint: 'Normal · 3 yd', tol: 3 },
    { id: 'starter', label: 'Starter', hint: 'Game speed · 2 yd', tol: 2 }
  ];

  function conceptOf(play) {
    const t = String((play && play.type) || '').toLowerCase();
    const n = String((play && play.name) || '').toLowerCase();
    const notes = String((play && play.notes) || '').toLowerCase();
    const blob = t + ' ' + n + ' ' + notes;
    if (/blitz|rush|pressure/.test(blob)) return 'Blitz';
    if (/zone|cover|buzz|robber/.test(blob)) return 'Coverage';
    if (/man/.test(blob)) return 'Man';
    if (/screen/.test(blob)) return 'Screen';
    if (/rpo/.test(blob)) return 'RPO';
    if (/play.?action|pa /.test(blob)) return 'Play action';
    if (/run|power|dive|toss|sweep/.test(blob)) return 'Run';
    if (/pass|slant|flat|vertical|post|corner|out|dig|curl|hitch/.test(blob)) return 'Pass';
    return play && play.side === 'def' ? 'Defense' : 'Offense';
  }

  function situationsOf(play) {
    const blob = (String(play.name || '') + ' ' + String(play.notes || '') + ' ' + String(play.type || '')).toLowerCase();
    const out = [];
    if (/goal.?line|gl /.test(blob)) out.push('goalline');
    if (/red.?zone|rz /.test(blob)) out.push('redzone');
    if (/2.?min|two.?minute|hurry/.test(blob)) out.push('twomin');
    if (/3rd.?short|and.?1|and.?2/.test(blob)) out.push('3rdshort');
    if (/3rd.?long|and.?8|and.?9|and.?10|and.?11/.test(blob)) out.push('3rdlong');
    if (/2nd.?long/.test(blob)) out.push('2ndlong');
    if (/1st.?&.?10|first.?and.?10/.test(blob)) out.push('1st10');
    if (!out.length) out.push('1st10');
    return out;
  }

  function formationOf(play) {
    if (!play || !play.players) return '';
    if (play.formation) return play.formation;
    const off = play.players.filter(p => p.side === 'off' && !p.scout);
    const wr = off.filter(p => /^(X|Z|SL|WR|X2|F)$/i.test(p.label || p.id || '')).length;
    const te = off.filter(p => /^(TE|H|Y)$/i.test(p.label || p.id || '')).length;
    if (play.side === 'def') {
      const n = play.players.filter(p => p.side === 'def' && !p.scout).length;
      return n ? (n + '-man look') : 'Defense';
    }
    if (wr >= 3) return 'Shotgun ' + wr + 'WR';
    if (wr === 2 && te) return '2WR · TE';
    if (wr === 2) return '2WR';
    return 'Base';
  }

  function matchesSearch(play, q) {
    if (!q) return true;
    const s = q.trim().toLowerCase();
    if (!s) return true;
    const hay = [play.name, play.type, play.notes, play.folder, conceptOf(play), formationOf(play)]
      .join(' ').toLowerCase();
    return hay.indexOf(s) >= 0;
  }

  function related(plays, play, limit) {
    if (!play) return [];
    const c = conceptOf(play);
    const f = folderOfSafe(play);
    return plays.filter(p => p.id !== play.id && (conceptOf(p) === c || folderOfSafe(p) === f))
      .slice(0, limit || 4);
  }

  function folderOfSafe(p) { return (p && p.folder) || 'My plays'; }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function bumpDayStreak(state) {
    const today = todayKey();
    if (state.lastDay === today) return state.dayStreak || 0;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yKey = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate();
    state.dayStreak = state.lastDay === yKey ? (state.dayStreak || 0) + 1 : 1;
    state.lastDay = today;
    return state.dayStreak;
  }

  function quizFor(play, pos) {
    const jobs = (play.players || []).filter(p => {
      if (!pos || p.scout) return false;
      const id = String(p.id || '').toUpperCase();
      return pos.labels.some(l => l.toUpperCase() === id);
    }).filter(p => (p.route && p.route.length > 1) || p.block);
    const labels = jobs.map(j => j.label);
    const correct = labels[0] || (play.players.find(p => !p.scout && p.side === (pos && pos.side)) || {}).label || '?';
    const pool = (play.players || []).filter(p => !p.scout).map(p => p.label);
    const opts = [correct];
    pool.forEach(l => { if (opts.indexOf(l) < 0 && opts.length < 4) opts.push(l); });
    while (opts.length < 3) opts.push(['X', 'M', 'Z', 'FS'][opts.length]);
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = opts[i]; opts[i] = opts[j]; opts[j] = t;
    }
    return {
      prompt: 'On <b>' + play.name + '</b>, which label is your assignment?',
      correct: correct,
      options: opts,
      hint: play.notes || play.type || ''
    };
  }

  return {
    SITS: SITS, BALL: BALL, SKILLS: SKILLS,
    conceptOf: conceptOf, situationsOf: situationsOf, formationOf: formationOf,
    matchesSearch: matchesSearch, related: related, bumpDayStreak: bumpDayStreak,
    todayKey: todayKey, quizFor: quizFor
  };
})();
