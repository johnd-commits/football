(function () {
  const BLOCKED = ['anal','anus','arse','asshole','bastard','bitch','blowjob','bollock','boner','boob','clit','cock','coon','crap','cum','cunt','dick','dildo','dyke','fag','faggot','fck','fcuk','felch','fuck','fuk','gaysex','goddamn','homo','horny','jackoff','jerkoff','jizz','kike','labia','molest','nazi','nigg','nutsack','orgasm','penis','phuck','piss','porn','prick','pube','pussy','queer','rape','rapist','rectum','retard','scrotum','semen','sex','shit','slut','smut','spunk','suck','tits','titt','turd','twat','vagina','wank','whore','xxx'];
  const EXACT = ['ass','hell','damn','sex','tit','hoe','std','cum','fag'];
  const RESERVED = ['admin','owner','official','system','root','mod','staff','coachmc','hardworkiq'];
  function fold(s) {
    return String(s || '').toLowerCase()
      .replace(/0/g,'o').replace(/1/g,'i').replace(/3/g,'e')
      .replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t')
      .replace(/8/g,'b').replace(/@/g,'a').replace(/\$/g,'s')
      .replace(/!/g,'i').replace(/\+/g,'t')
      .replace(/[^a-z]/g,'');
  }
  window.checkUsername = function (raw) {
    const cfg = window.HWIQ_CONFIG || { usernameMin: 3, usernameMax: 10 };
    const name = String(raw || '').trim();
    if (name.length < cfg.usernameMin || name.length > cfg.usernameMax)
      return 'Usernames must be ' + cfg.usernameMin + '–' + cfg.usernameMax + ' characters.';
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name))
      return 'Start with a letter. Use only letters, numbers, and underscore.';
    const n = fold(name);
    if (!n || RESERVED.indexOf(n) >= 0 || EXACT.indexOf(n) >= 0)
      return 'That name is not allowed. Pick something you would wear on a jersey.';
    for (let i = 0; i < BLOCKED.length; i++) if (n.indexOf(BLOCKED[i]) >= 0)
      return 'That name is not allowed. Pick something you would wear on a jersey.';
    return null;
  };
})();
