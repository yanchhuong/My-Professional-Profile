/*!
 * talent-engine.js: shared questions, archetypes and scoring for the Talent Discovery Quiz.
 * Used by the AX chat widget (jarvis-widget.js), which runs the quiz inside the chat.
 * Scoring is fixed and transparent: each talent area is the sum of its five 1-5 answers.
 * Everything is stored only in this browser (localStorage).
 */
(function () {
  'use strict';
  if (window.TalentEngine) return;

  // ---------- Content ----------
  var CATS = [
    { name: 'Analytical & Logical Intelligence', short: 'Analytical',
      about: 'You analyze information, understand complicated situations, spot patterns, and solve problems logically.',
      value: 'Teams rely on this to make sound decisions and fix problems at the root instead of the surface.',
      indicators: ['Analytical thinking', 'Critical thinking', 'Logical reasoning', 'Problem-solving', 'Pattern recognition', 'Numerical intelligence'],
      step: 'Pick one recurring problem at work and write down its root cause using the 5 Whys.',
      q: ['I naturally analyze situations before making important decisions.',
          'I enjoy solving complicated problems that require logical thinking.',
          'I can identify the root cause of a problem rather than just treating its symptoms.',
          'I notice patterns, details, and connections that other people may overlook.',
          'I enjoy working with data, numbers, evidence, and facts to reach conclusions.'] },
    { name: 'Creativity & Innovation', short: 'Creativity',
      about: 'You generate original ideas, imagine new possibilities, and create new solutions.',
      value: 'New products, better services and fresh approaches start with people who think this way.',
      indicators: ['Creative thinking', 'Innovation', 'Imagination', 'Idea generation', 'Product innovation', 'Design thinking'],
      step: 'Write ten ideas to improve one product you use every day, without judging any of them.',
      q: ['I frequently come up with new ideas that others have not considered.',
          'I enjoy creating something new rather than simply following existing methods.',
          'I can imagine different possibilities when facing a difficult situation.',
          'I naturally think about how existing products or services could be improved.',
          'I enjoy experimenting with new concepts, designs, and approaches.'] },
    { name: 'Leadership & Management', short: 'Leadership',
      about: 'You guide people, set direction, organize responsibilities, and drive a group toward shared goals.',
      value: 'Groups move faster and stay focused when someone gives clear direction and takes responsibility.',
      indicators: ['Leadership', 'Team management', 'Strategic planning', 'Decision leadership', 'Delegation', 'Vision setting'],
      step: 'Volunteer to coordinate one small team task from start to finish, including the follow-up.',
      q: ['People naturally look to me when a group needs direction.',
          'I feel comfortable taking responsibility for important decisions.',
          'I can organize people and resources to achieve a common objective.',
          'I enjoy motivating others to achieve goals.',
          'I can remain responsible and decisive when a team faces difficulties.'] },
    { name: 'Communication & Social Intelligence', short: 'Communication',
      about: 'You communicate clearly, understand people, influence others, and build strong relationships.',
      value: 'Good ideas only create value when people understand them and agree to act on them.',
      indicators: ['Communication', 'Public speaking', 'Persuasion', 'Negotiation', 'Networking', 'Active listening'],
      step: 'Explain one complex topic from your work to a friend in two minutes, then ask what was unclear.',
      q: ['I can explain complicated ideas in ways that other people understand.',
          'I enjoy meeting new people and building professional relationships.',
          'I can persuade people through communication and logical arguments.',
          'I listen carefully and try to understand different perspectives.',
          'I feel comfortable speaking in front of groups or presenting ideas.'] },
    { name: 'Business & Entrepreneurship', short: 'Business',
      about: 'You recognize opportunities, understand markets, and see how ideas can become profitable products or services.',
      value: 'This turns problems into products people pay for, and keeps work connected to real customer needs.',
      indicators: ['Entrepreneurship', 'Business development', 'Opportunity recognition', 'Sales', 'Marketing', 'Commercial thinking'],
      step: 'Pick one everyday problem and sketch who would pay to solve it, and why.',
      q: ['I naturally notice business opportunities when observing problems in everyday life.',
          'I enjoy thinking about how to turn an idea into a profitable product or service.',
          'I can recognize what customers need and what makes them willing to pay.',
          'I enjoy developing business strategies and exploring new markets.',
          'I am comfortable taking calculated risks when pursuing business opportunities.'] },
    { name: 'Technical & Digital Intelligence', short: 'Technical',
      about: 'You understand technology, build systems, solve technical problems, and use digital tools well.',
      value: 'Almost every business process can be made faster and more reliable by someone who connects the right tools.',
      indicators: ['Programming', 'Software architecture', 'Artificial intelligence', 'Automation', 'System integration', 'Technical troubleshooting'],
      step: 'Automate one repetitive task with a spreadsheet formula or a no-code tool.',
      q: ['I enjoy understanding how technology, software, or technical systems work.',
          'I naturally look for ways to automate repetitive work using technology.',
          'I enjoy designing or developing systems that solve real-world problems.',
          'I can quickly understand unfamiliar technical tools or software.',
          'I enjoy connecting different technologies to create a more powerful solution.'] },
    { name: 'Operational & Execution Intelligence', short: 'Execution',
      about: 'You organize work, improve processes, manage resources, and consistently turn plans into results.',
      value: 'Plans only matter when they are delivered. This is the talent that makes things actually happen.',
      indicators: ['Execution', 'Process improvement', 'Project management', 'Organization', 'Quality control', 'Resource management'],
      step: 'Plan next week as a simple checklist, then review on Friday what got done and why.',
      q: ['I am good at turning plans and ideas into practical actions.',
          'I naturally notice inefficient processes and find ways to improve them.',
          'I can manage multiple responsibilities while keeping work organized.',
          'I pay attention to details and care about the quality of my work.',
          'I enjoy creating structured processes that help work run smoothly.'] },
    { name: 'Emotional & Personal Intelligence', short: 'Emotional',
      about: 'You understand yourself, manage your emotions, stay resilient, and keep yourself motivated.',
      value: 'Calm, self-aware people make better decisions under pressure and keep going when results are slow.',
      indicators: ['Emotional intelligence', 'Self-awareness', 'Resilience', 'Self-discipline', 'Adaptability', 'Growth mindset'],
      step: 'After a stressful moment, write two lines: what you felt, and what you did next.',
      q: ['I understand my own emotions and how they influence my decisions.',
          'I can remain calm when facing pressure or unexpected difficulties.',
          'I can maintain motivation even when results take a long time.',
          'I am willing to accept criticism and use it to improve myself.',
          'I can adapt my behavior when circumstances change.'] },
    { name: 'Learning & Knowledge Intelligence', short: 'Learning',
      about: 'You learn new concepts quickly, research deeply, and apply knowledge across different fields.',
      value: 'Fast learners adapt to new tools and industries, and connect ideas others keep separate.',
      indicators: ['Fast learning', 'Research', 'Curiosity', 'Knowledge application', 'Teaching ability', 'Cross-disciplinary thinking'],
      step: 'Spend 20 minutes a day for two weeks on a topic outside your field, then explain it to someone.',
      q: ['I enjoy learning new subjects even when they are outside my profession.',
          'I can understand new concepts relatively quickly.',
          'I naturally research topics deeply before forming an opinion.',
          'I enjoy sharing knowledge and explaining what I have learned.',
          'I can connect knowledge from different subjects to solve problems.'] },
    { name: 'Artistic & Creative Expression', short: 'Artistic',
      about: 'You express ideas, emotions, and stories through visual, written, musical, or video work.',
      value: 'Content that looks good and tells a story is what gets attention and makes people remember.',
      indicators: ['Graphic design', 'Visual design', 'Writing', 'Storytelling', 'Photography', 'Videography', 'Artistic creativity'],
      step: 'Recreate a poster or design you admire, then make your own version of it.',
      q: ['I have a strong interest in creating visual content, designs, or artwork.',
          'I can recognize attractive colors, layouts, compositions, and visual styles.',
          'I enjoy expressing ideas through writing, storytelling, music, or video.',
          'I can imagine how a visual or creative concept should look before it is created.',
          'I enjoy creating content that captures people\u2019s attention and emotions.'] },
    { name: 'Practical & Spatial Intelligence', short: 'Practical',
      about: 'You understand physical spaces, objects, structures, and movement, and solve hands-on problems.',
      value: 'Building, fixing and arranging things in the real world needs people who can see how pieces fit.',
      indicators: ['Spatial awareness', 'Mechanical ability', 'Physical coordination', 'Construction skills', 'Craftsmanship', 'Navigation'],
      step: 'Fix, build or assemble one small physical thing with your hands this month.',
      q: ['I can visualize how objects, spaces, or structures fit together.',
          'I enjoy building, repairing, assembling, or improving physical things.',
          'I can understand maps, layouts, physical arrangements, or spatial relationships easily.',
          'I am good at coordinating physical activities or working with my hands.',
          'I enjoy finding practical solutions to real-world physical challenges.'] },
    { name: 'Social Impact & Human Development', short: 'Social impact',
      about: 'You help others grow, build communities, support people, and create positive change.',
      value: 'Teams and communities grow stronger around people who develop others and bring them together.',
      indicators: ['Mentoring', 'Coaching', 'Empathy', 'Community building', 'Conflict resolution', 'Human development'],
      step: 'Offer one hour to help someone learn something you are good at.',
      q: ['I feel motivated when I help other people develop their abilities.',
          'I naturally recognize when someone needs support or encouragement.',
          'I enjoy bringing people together around a shared purpose.',
          'I can help people resolve disagreements and understand each other.',
          'I want my work to create a positive impact beyond personal success.'] }
  ];

  // Archetypes: each is the average of three talent areas (indexes into CATS).
  var ARCHETYPES = [
    { name: 'Visionary', cats: [1, 4, 8], desc: 'You see future possibilities and opportunities before others do.',
      careers: ['Product strategist', 'Innovation lead', 'Startup founder'], roles: ['Founder', 'Business Strategist', 'Technology Innovator'] },
    { name: 'Architect', cats: [0, 5, 6], desc: 'You design complex systems and structures that work reliably.',
      careers: ['Solution architect', 'Systems engineer', 'Technical lead'], roles: ['Technology Innovator', 'Co-founder', 'Consultant'] },
    { name: 'Inventor', cats: [1, 5, 0], desc: 'You create new products and solutions by combining ideas with technology.',
      careers: ['Product engineer', 'R&D specialist', 'Prototype developer'], roles: ['Technology Innovator', 'Founder', 'Product Manager'] },
    { name: 'Strategist', cats: [0, 2, 4], desc: 'You develop plans and long-term direction from careful analysis.',
      careers: ['Business strategist', 'Management consultant', 'Product manager'], roles: ['Business Strategist', 'Consultant', 'Co-founder'] },
    { name: 'Entrepreneur', cats: [4, 1, 2], desc: 'You turn opportunities into businesses and lead people to build them.',
      careers: ['Founder', 'Business developer', 'Venture builder'], roles: ['Founder', 'Co-founder', 'Sales & Marketing Leader'] },
    { name: 'Leader', cats: [2, 3, 7], desc: 'You guide and inspire people, and keep them steady when things get hard.',
      careers: ['Team lead', 'Department head', 'Program manager'], roles: ['Co-founder', 'Operations Manager', 'Business Strategist'] },
    { name: 'Influencer', cats: [3, 1, 9], desc: 'You connect with people and move them with ideas, stories, and content.',
      careers: ['Marketing lead', 'Brand strategist', 'Content creator'], roles: ['Sales & Marketing Leader', 'Creative Director', 'Founder'] },
    { name: 'Analyst', cats: [0, 8, 6], desc: 'You find patterns, research deeply, and turn information into insight.',
      careers: ['Business analyst', 'Data analyst', 'Researcher'], roles: ['Consultant', 'Business Strategist', 'Product Manager'] },
    { name: 'Creator', cats: [9, 1, 8], desc: 'You produce original work and content that people notice.',
      careers: ['Designer', 'Content producer', 'Creative director'], roles: ['Creative Director', 'Founder', 'Sales & Marketing Leader'] },
    { name: 'Operator', cats: [6, 0, 7], desc: 'You make operations run smoothly, efficiently, and with quality.',
      careers: ['Operations manager', 'Project manager', 'Quality lead'], roles: ['Operations Manager', 'Co-founder', 'Consultant'] },
    { name: 'Connector', cats: [3, 11, 7], desc: 'You build relationships and communities that bring people together.',
      careers: ['Partnerships manager', 'Community manager', 'People and HR partner'], roles: ['Sales & Marketing Leader', 'Co-founder', 'Consultant'] },
    { name: 'Educator', cats: [8, 3, 11], desc: 'You develop other people\u2019s knowledge and help them grow.',
      careers: ['Trainer', 'Teacher', 'Learning designer'], roles: ['Consultant', 'Founder', 'Product Manager'] },
    { name: 'Negotiator', cats: [3, 4, 7], desc: 'You build agreements and resolve differences in ways people accept.',
      careers: ['Sales lead', 'Account manager', 'Partnerships and procurement'], roles: ['Sales & Marketing Leader', 'Business Strategist', 'Co-founder'] },
    { name: 'Executor', cats: [2, 6, 7], desc: 'You turn plans into measurable results with discipline and follow-through.',
      careers: ['Delivery manager', 'Project lead', 'Chief of staff'], roles: ['Operations Manager', 'Co-founder', 'Product Manager'] },
    { name: 'Builder', cats: [10, 5, 6], desc: 'You turn ideas into working things, physical or technical, with your own hands.',
      careers: ['Engineer', 'Product maker', 'Field technical lead'], roles: ['Technology Innovator', 'Co-founder', 'Operations Manager'] }
  ];

  var LEADERSHIP = [
    { name: 'Strategic leadership', cats: [0, 2, 4] },
    { name: 'People leadership', cats: [2, 3, 7] },
    { name: 'Creative leadership', cats: [1, 2, 9] },
    { name: 'Operational leadership', cats: [2, 6] },
    { name: 'Entrepreneurial leadership', cats: [2, 4, 1] }
  ];

  var SCALE = [
    { v: 1, label: 'Strongly disagree', hint: 'Not natural for me' },
    { v: 2, label: 'Disagree', hint: 'I rarely do this' },
    { v: 3, label: 'Neutral', hint: 'Sometimes' },
    { v: 4, label: 'Agree', hint: 'I often do this' },
    { v: 5, label: 'Strongly agree', hint: 'A natural strength' }
  ];

  function level(score) {
    if (score >= 22) return 'Exceptional indicator';
    if (score >= 18) return 'Strong indicator';
    if (score >= 14) return 'Developing indicator';
    if (score >= 10) return 'Limited indicator';
    return 'Low indicator';
  }

  // Flat list of the 60 questions, in order
  var QUESTIONS = [];
  CATS.forEach(function (c, ci) { c.q.forEach(function (t, qi) { QUESTIONS.push({ text: t, cat: ci, n: ci * 5 + qi + 1 }); }); });
  var TOTAL = QUESTIONS.length;


  // ---------- Storage (this browser only) ----------
  var KEY = 'talentQuiz.v1';
  var HISTORY_KEY = 'talentQuiz.history.v1';
  var SUMMARY_KEY = 'talentQuiz.summary.v1';

  function blank() { return { answers: new Array(TOTAL).fill(0), index: 0, completedAt: null }; }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.answers) && s.answers.length === TOTAL) return s;
    } catch (e) {}
    return blank();
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function answeredCount(s) { return s.answers.filter(function (a) { return a > 0; }).length; }
  function firstUnanswered(s) { return s.answers.findIndex(function (a) { return !a; }); }
  function isComplete(s) { return answeredCount(s) === TOTAL; }

  // ---------- Scoring (no AI involved) ----------
  function compute(answers) {
    var cats = CATS.map(function (c, ci) {
      var a = answers.slice(ci * 5, ci * 5 + 5);
      var score = a.reduce(function (sum, x) { return sum + x; }, 0);
      return { i: ci, name: c.name, short: c.short, score: score, level: level(score), answers: a };
    });
    // Equal scores share the same rank
    cats.forEach(function (c) { c.rank = 1 + cats.filter(function (o) { return o.score > c.score; }).length; });
    var arch = ARCHETYPES.map(function (a) {
      var avg = a.cats.reduce(function (sum, ci) { return sum + cats[ci].score; }, 0) / a.cats.length;
      return { a: a, score: Math.round(avg * 10) / 10 };
    }).sort(function (x, y) { return y.score - x.score; });
    return { cats: cats, arch: arch };
  }

  // Marks the quiz complete, keeps a short history and a summary AX can use (only if the visitor allows it).
  function complete(s) {
    if (!s.completedAt) s.completedAt = new Date().toISOString();
    save(s);
    var r = compute(s.answers);
    var scores = r.cats.map(function (c) { return c.score; });
    try {
      var hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      var last = hist[hist.length - 1];
      if (!last || last.at !== s.completedAt) {
        hist.push({ at: s.completedAt, scores: scores });
        localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(-20)));
      }
      var prev = getSummary();
      localStorage.setItem(SUMMARY_KEY, JSON.stringify({
        at: s.completedAt,
        scores: scores,
        archetypes: [r.arch[0].a.name, r.arch[1].a.name],
        shared: !!(prev && prev.at === s.completedAt && prev.shared)
      }));
    } catch (e) {}
    return r;
  }
  function getSummary() { try { return JSON.parse(localStorage.getItem(SUMMARY_KEY)) || null; } catch (e) { return null; } }
  function setShared(on) {
    var sm = getSummary();
    if (!sm) return;
    sm.shared = !!on;
    try { localStorage.setItem(SUMMARY_KEY, JSON.stringify(sm)); } catch (e) {}
  }

  // A short, plain summary of a result (used in the chat).
  function summaryText(r) {
    var top = r.cats.filter(function (c) { return c.rank <= 5; })
      .sort(function (a, b) { return a.rank - b.rank || a.i - b.i; })
      .map(function (c) { return c.short + ' ' + c.score; });
    var p = r.arch[0], s = r.arch[1];
    return 'Your primary talent archetype is ' + p.a.name + ': ' + p.a.desc.charAt(0).toLowerCase() + p.a.desc.slice(1)
      + '\n' + (p.score === s.score ? 'Equally strong: ' : 'Close behind: ') + s.a.name + '.'
      + '\nYour top talents (out of 25): ' + top.join(', ') + '.'
      + '\nThis is a self-assessment, not a diagnosis.';
  }

  window.TalentEngine = {
    CATS: CATS, ARCHETYPES: ARCHETYPES, LEADERSHIP: LEADERSHIP, SCALE: SCALE, QUESTIONS: QUESTIONS, TOTAL: TOTAL,
    level: level, blank: blank, load: load, save: save, answeredCount: answeredCount, firstUnanswered: firstUnanswered,
    isComplete: isComplete, compute: compute, complete: complete, getSummary: getSummary, setShared: setShared,
    summaryText: summaryText, SUMMARY_KEY: SUMMARY_KEY
  };
})();
