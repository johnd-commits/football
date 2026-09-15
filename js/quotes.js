window.HWIQ_QUOTES = {
  football: [
    { text: 'Winners never quit and quitters never win.', author: 'Vince Lombardi', note: 'Green Bay Packers' },
    { text: 'The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack of will.', author: 'Vince Lombardi', note: 'Green Bay Packers' },
    { text: 'Don\'t give up at halftime. Concentrate on winning the second half.', author: 'Bear Bryant', note: 'Alabama' },
    { text: 'Those who stay will be champions.', author: 'Bo Schembechler', note: 'Michigan' },
    { text: 'The score takes care of itself.', author: 'Bill Walsh', note: 'San Francisco 49ers' },
    { text: 'Do your job.', author: 'Bill Belichick', note: 'New England Patriots' },
    { text: 'Don\'t waste a season. Don\'t waste an opportunity.', author: 'Nick Saban', note: 'Alabama' },
    { text: 'You play how you practice.', author: 'Urban Meyer', note: 'Ohio State / Florida' },
    { text: 'Today I will do what others won\'t, so tomorrow I can accomplish what others can\'t.', author: 'Jerry Rice', note: 'San Francisco 49ers' },
    { text: 'I want to be remembered as the guy who gave his all whenever he was on the field.', author: 'Walter Payton', note: 'Chicago Bears' },
    { text: 'Winners make a habit of manufacturing their own luck.', author: 'Joe Montana', note: 'San Francisco 49ers' },
    { text: 'Effort is between you and you.', author: 'Ray Lewis', note: 'Baltimore Ravens' },
    { text: 'Success isn\'t owned. It\'s leased. And rent is due every day.', author: 'J.J. Watt', note: 'Houston Texans' },
    { text: 'You can\'t lose confidence in yourself, or you\'ve lost already.', author: 'Tim Tebow', note: 'Florida / Denver Broncos' },
    { text: 'Setting a goal is not the main thing. It is deciding how you will go about achieving it and staying with that plan.', author: 'Tom Landry', note: 'Dallas Cowboys' },
    { text: 'I always believed that when you follow your heart, you never go wrong.', author: 'Drew Brees', note: 'New Orleans Saints' },
    { text: 'Coaching is a profession of love. You can\'t coach people unless you love them.', author: 'Eddie Robinson', note: 'Grambling State' }
  ],
  lacrosse: [{ text: 'Play hard, play fair, play together.', author: 'Johns Hopkins tradition', note: 'Lacrosse' }],
  volleyball: [{ text: 'A champion is afraid of losing. Everyone else is afraid of winning.', author: 'Billie Jean King', note: 'Competitor\'s mindset' }],
  basketball: [{ text: 'Discipline is doing what you don\'t want to do when you don\'t want to do it.', author: 'Nick Saban', note: 'Process' }],
  soccer: [{ text: 'The more difficult the victory, the greater the happiness in winning.', author: 'Pelé', note: 'Brazil' }],
  hockey: [{ text: 'You miss 100% of the shots you don\'t take.', author: 'Wayne Gretzky', note: 'NHL' }],
  baseball: [{ text: 'Every strike brings me closer to the next home run.', author: 'Babe Ruth', note: 'Yankees' }],
  softball: [{ text: 'It\'s not whether you get knocked down, it\'s whether you get up.', author: 'Vince Lombardi', note: 'Champions' }],
  other: []
};
window.pickQuote = function (sport) {
  const id = String(sport || 'football').toLowerCase();
  const pool = (window.HWIQ_QUOTES[id] && window.HWIQ_QUOTES[id].length) ? window.HWIQ_QUOTES[id] : window.HWIQ_QUOTES.football;
  return pool[Math.floor(Math.random() * pool.length)];
};
