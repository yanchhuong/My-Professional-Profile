/*!
 * ax-report.js: shows the full AI talent report inside the AX chat.
 * Works with the live jarvis-widget.js without changing it. Load it after the widget:
 *   <script src="/jarvis-widget.js" ... defer></script>
 *   <script src="/js/ax-report.js" defer></script>
 *
 * After a visitor finishes the talent quiz in the chat, a "My full report" button appears
 * next to "Discuss my results". Only the 12 calculated scores are sent to write the report.
 * The report is saved in this browser, so it is written only once per quiz result.
 *
 * Optional: data-endpoint="https://ai-ax.app.n8n.cloud/webhook/talent-report"
 */
(function () {
  'use strict';
  if (window.__axReport) return;
  window.__axReport = true;

  var tag = document.currentScript;
  var ds = (tag && tag.dataset) || {};
  var ENDPOINT = ds.endpoint || 'https://ai-ax.app.n8n.cloud/webhook/talent-report';
  var SUMMARY_KEY = 'talentQuiz.summary.v1';
  var REPORT_KEY = 'talentQuiz.report.v1';
  var KM = (document.documentElement.lang || '').toLowerCase().indexOf('km') === 0;

  // Labels of the widget's "Discuss my results" button (English and Khmer) to find the result message
  var DISCUSS_LABELS = ['Discuss my results', '\u1796\u17b7\u1797\u17b6\u1780\u17d2\u179f\u17b6\u179b\u1791\u17d2\u1792\u1795\u179b\u179a\u1794\u179f\u17cb\u1781\u17d2\u1789\u17bb\u17c6'];
  var AREAS = ['Analytical', 'Creativity', 'Leadership', 'Communication', 'Business', 'Technical', 'Execution', 'Emotional', 'Learning', 'Artistic', 'Practical', 'Social impact'];

  var T = {
    button: KM ? '\u179a\u1794\u17b6\u1799\u1780\u17b6\u179a\u178e\u17cd\u1796\u17c1\u1789\u179b\u17c1\u1789' : 'My full report',
    show: KM ? '\u1798\u17be\u179b\u179a\u1794\u17b6\u1799\u1780\u17b6\u179a\u178e\u17cd' : 'Show my full report',
    writing: 'Writing your full report',
    steps: ['Reading your 12 scores', 'Explaining your strengths', 'Matching careers and roles', 'Planning your next 30 days, 90 days and year'],
    note: 'Takes about 40 seconds. Only your 12 scores are sent; your answers stay in this browser.',
    retry: 'Try again',
    noResult: 'Finish the talent quiz first, then I can write your report.',
    timeout: 'Writing took too long. Please try again.',
    network: 'Could not connect. Check your internet connection and try again.',
    failed: 'The report could not be written right now. Please try again in a minute.',
    sub: 'Written by AI from your 12 scores. The scores themselves are calculated, not written by AI. A self-assessment, not a diagnosis.',
    kmNote: KM ? '\u179a\u1794\u17b6\u1799\u1780\u17b6\u179a\u178e\u17cd\u1793\u17c1\u17c7\u1787\u17b6\u1797\u17b6\u179f\u17b6\u17a2\u1784\u17cb\u1782\u17d2\u179b\u17c1\u179f\u17d4' : '',
    scores: 'Your 12 scores',
    strengths: 'Your natural strengths',
    hidden: 'Hidden potential',
    leadership: 'Leadership potential',
    careers: 'Careers and business roles',
    careerDirections: 'Career directions',
    roles: 'Roles in a business or startup',
    development: 'Where to grow',
    roadmap: 'Your roadmap',
    d30: 'Next 30 days', d90: 'Next 90 days', y1: 'Over the next year',
    use: 'Ways to use it', practice: 'Practice', resources: 'Learning resources', project: 'A small project to try'
  };

  var CSS = [
    '.axr-card { flex: none; align-self: stretch; max-width: 100%; background: #FFFFFF; border: 1px solid var(--jv-line, #E5D6C0); border-radius: 16px; padding: 14px 14px 6px; white-space: normal; font-size: 14px; line-height: 1.5; color: var(--jv-text, #2B2622); }',
    '.axr-card p { margin: 0 0 8px; }',
    '.axr-h { font-weight: 700; font-size: 16px; line-height: 1.3; margin: 0 0 6px; }',
    '.axr-sub { font-size: 12px; color: var(--jv-muted, #75695D); margin: 0 0 10px; }',
    '.axr-card details { border-top: 1px solid var(--jv-line, #E5D6C0); padding: 9px 0; }',
    '.axr-card summary { cursor: pointer; font-weight: 600; list-style: none; display: flex; justify-content: space-between; gap: 8px; }',
    '.axr-card summary::-webkit-details-marker { display: none; }',
    '.axr-card summary::after { content: "+"; color: var(--jv-muted, #75695D); font-weight: 400; }',
    '.axr-card details[open] summary::after { content: "\\2013"; }',
    '.axr-card summary:focus-visible { outline: 2px solid var(--jv-focus, #2F6F86); outline-offset: 2px; }',
    '.axr-card h5 { margin: 12px 0 2px; font-size: 14px; }',
    '.axr-card ul, .axr-card ol { margin: 4px 0 6px; padding-left: 18px; }',
    '.axr-card li { margin: 3px 0; }',
    '.axr-k { font-size: 12px; font-weight: 600; color: var(--jv-muted, #75695D); margin: 8px 0 2px; }',
    '.axr-muted { color: var(--jv-muted, #75695D); }',
    '.axr-row { display: grid; grid-template-columns: 96px 1fr 22px; gap: 8px; align-items: center; font-size: 12px; margin: 4px 0; }',
    '.axr-track { height: 6px; background: var(--jv-bot, #F3E8D7); border-radius: 999px; overflow: hidden; }',
    '.axr-fill { display: block; height: 100%; background: var(--jv-focus, #2F6F86); border-radius: 999px; }',
    '.axr-row b { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }',
    '.axr-state { flex: none; align-self: flex-start; max-width: 92%; background: var(--jv-bot, #F3E8D7); border-radius: 16px; border-bottom-left-radius: 5px; padding: 10px 14px; white-space: normal; }',
    '.axr-state .axr-k { margin-top: 4px; font-weight: 400; }',
    '.axr-error { color: var(--jv-error, #9A3B2E); font-weight: 600; }',
    '.axr-close { margin: 4px 0 8px; font-weight: 600; }'
  ].join('\n');

  // ---------- Storage ----------
  function summary() {
    try {
      var s = JSON.parse(localStorage.getItem(SUMMARY_KEY));
      if (s && Array.isArray(s.scores) && s.scores.length === 12) return s;
    } catch (e) {}
    return null;
  }
  function cachedReport(sm) {
    if (!sm) return null;
    try {
      var c = JSON.parse(localStorage.getItem(REPORT_KEY));
      if (c && c.at === sm.at && c.data && c.data.report) return c.data;
    } catch (e) {}
    return null;
  }

  // ---------- DOM helpers ----------
  function el(tagName, attrs, kids) {
    var n = document.createElement(tagName);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null && c !== '') n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function list(items, ordered) { return el(ordered ? 'ol' : 'ul', {}, (items || []).map(function (t) { return el('li', { text: t }); })); }
  function section(title, kids, open) {
    var d = el('details', open ? { open: '' } : {}, [el('summary', { text: title })].concat(kids));
    return d;
  }

  // ---------- Report card ----------
  function buildCard(d, sm) {
    var r = d.report;
    r.summary = r.summary || {}; // a report without a summary block still renders
    var card = el('div', { class: 'axr-card', 'data-axr': 'card' });
    card.appendChild(el('p', { class: 'axr-h', text: r.summary.headline }));
    card.appendChild(el('p', { class: 'axr-sub', text: T.sub + (T.kmNote ? ' ' + T.kmNote : '') }));
    if (r.summary.overview) card.appendChild(el('p', { text: r.summary.overview }));
    if (r.summary.working_style) card.appendChild(el('p', { text: r.summary.working_style }));

    if (sm) {
      var order = sm.scores.map(function (s, i) { return { s: s, i: i }; }).sort(function (a, b) { return b.s - a.s || a.i - b.i; });
      card.appendChild(section(T.scores, order.map(function (x) {
        return el('div', { class: 'axr-row' }, [
          el('span', { text: AREAS[x.i] }),
          el('span', { class: 'axr-track', 'aria-hidden': 'true' }, [el('span', { class: 'axr-fill', style: 'width:' + Math.round(x.s / 25 * 100) + '%' })]),
          el('b', { text: String(x.s) })
        ]);
      }), false));
    }

    if (r.strengths && r.strengths.length) {
      card.appendChild(section(T.strengths, r.strengths.map(function (x) {
        return el('div', {}, [
          el('h5', { text: x.area }),
          el('p', { text: x.meaning }),
          el('p', { class: 'axr-muted', text: x.why }),
          el('p', { text: x.value }),
          x.examples && x.examples.length ? el('div', {}, [el('p', { class: 'axr-k', text: T.use }), list(x.examples)]) : null
        ]);
      }), true));
    }

    if (r.hidden_potential && r.hidden_potential.length) {
      card.appendChild(section(T.hidden, r.hidden_potential.map(function (x) {
        return el('div', {}, [el('h5', { text: x.area }), el('p', { text: x.insight })]);
      }), false));
    }

    if (r.leadership && (r.leadership.overview || (r.leadership.styles || []).length)) {
      card.appendChild(section(T.leadership, [
        r.leadership.overview ? el('p', { text: r.leadership.overview }) : null,
        el('ul', {}, (r.leadership.styles || []).map(function (x) { return el('li', {}, [el('strong', { text: x.name + ': ' }), x.comment]); }))
      ], false));
    }

    card.appendChild(section(T.careers, [
      el('p', { class: 'axr-k', text: T.careerDirections }),
      el('ul', {}, (r.careers || []).map(function (x) { return el('li', {}, [el('strong', { text: x.title }), x.why ? ': ' + x.why : '']); })),
      el('p', { class: 'axr-k', text: T.roles }),
      el('ul', {}, (r.business_roles || []).map(function (x) { return el('li', {}, [el('strong', { text: x.role }), x.why ? ': ' + x.why : '']); }))
    ], false));

    if (r.development && r.development.length) {
      card.appendChild(section(T.development, r.development.map(function (x) {
        return el('div', {}, [
          el('h5', { text: x.area }),
          x.why_it_matters ? el('p', { text: x.why_it_matters }) : null,
          x.skills && x.skills.length ? el('p', { class: 'axr-muted', text: x.skills.join(' \u00b7 ') }) : null,
          x.exercises && x.exercises.length ? el('div', {}, [el('p', { class: 'axr-k', text: T.practice }), list(x.exercises)]) : null,
          x.resources && x.resources.length ? el('div', {}, [el('p', { class: 'axr-k', text: T.resources }), list(x.resources)]) : null,
          x.project ? el('div', {}, [el('p', { class: 'axr-k', text: T.project }), el('p', { text: x.project })]) : null
        ]);
      }), false));
    }

    if (r.roadmap) {
      card.appendChild(section(T.roadmap, [
        el('p', { class: 'axr-k', text: T.d30 }), list(r.roadmap.days_30, true),
        el('p', { class: 'axr-k', text: T.d90 }), list(r.roadmap.days_90, true),
        el('p', { class: 'axr-k', text: T.y1 }), list(r.roadmap.year_1, true)
      ], true));
    }

    if (r.closing) card.appendChild(el('p', { class: 'axr-close', text: r.closing }));
    return card;
  }

  // ---------- Hooking into the widget ----------
  var host = null, shadow = null, observer = null, styled = false;
  var job = { el: null, running: false, at: null, ticker: null };

  function logEl() { return shadow && shadow.querySelector('.log'); }
  function isResultMsg(m) {
    var acts = m.querySelector('.actions');
    if (!acts) return false;
    return Array.prototype.some.call(acts.querySelectorAll('button'), function (b) {
      return DISCUSS_LABELS.indexOf((b.textContent || '').trim()) >= 0;
    });
  }
  function resultMessages(log) {
    return Array.prototype.filter.call(log.querySelectorAll('.msg'), function (m) { return !m.hasAttribute('data-axr') && isResultMsg(m); });
  }
  function scrollTo(node) {
    var log = logEl();
    if (log && node && node.parentNode) log.scrollTop = Math.max(0, log.scrollTop + node.getBoundingClientRect().top - log.getBoundingClientRect().top - 12);
  }

  function scan() {
    var log = logEl();
    if (!log) return;
    var results = resultMessages(log);
    var sm = summary();
    var cached = cachedReport(sm);
    results.forEach(function (m) {
      var acts = m.querySelector('.actions');
      var btn = acts.querySelector('.axr-btn');
      if (!btn) {
        btn = el('button', { class: 'act primary axr-btn', type: 'button' });
        btn.addEventListener('click', onReportClick);
        acts.insertBefore(btn, acts.firstChild);
      }
      var label = cached ? T.show : T.button;
      if (btn.textContent !== label) btn.textContent = label;
    });
    // Keep the report card (or the progress message) under the latest result after the chat re-renders
    var last = results[results.length - 1];
    if (job.el && !log.contains(job.el) && last) last.after(job.el);
  }

  function onReportClick() {
    var sm = summary();
    var log = logEl();
    if (!log) return;
    var results = resultMessages(log);
    var last = results[results.length - 1];
    if (!sm) { showState(last, T.noResult, true); return; }
    var cached = cachedReport(sm);
    if (cached) {
      if (!job.el || job.at !== sm.at || job.el.getAttribute('data-axr') !== 'card') {
        place(last, buildCard(cached, sm), sm.at);
      }
      scrollTo(job.el);
      return;
    }
    if (job.running) { scrollTo(job.el); return; }
    writeReport(sm, last);
  }

  function place(after, node, at) {
    if (job.el && job.el.parentNode) job.el.remove();
    job.el = node;
    job.at = at;
    if (after) after.after(node);
    else { var log = logEl(); if (log) log.appendChild(node); }
  }

  function showState(after, text, isError, retry) {
    var box = el('div', { class: 'msg axr-state', 'data-axr': 'state', role: 'status' }, [
      el('span', { class: isError ? 'axr-error' : '', text: text })
    ]);
    if (retry) {
      var b = el('button', { class: 'act', type: 'button', text: T.retry, style: 'margin-top:8px' });
      b.addEventListener('click', onReportClick);
      box.appendChild(el('div', {}, [b]));
    }
    place(after, box, null);
    scrollTo(box);
    return box;
  }

  function writeReport(sm, after) {
    job.running = true;
    var box = showState(after, T.writing + '\u2026', false);
    var stepEl = el('p', { class: 'axr-k', text: T.steps[0] + '\u2026' });
    box.appendChild(stepEl);
    box.appendChild(el('p', { class: 'axr-k', text: T.note }));
    var step = 0;
    job.ticker = setInterval(function () { step = Math.min(step + 1, T.steps.length - 1); stepEl.textContent = T.steps[step] + '\u2026'; }, 8000);
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 120000);
    var done = function () { clearInterval(job.ticker); clearTimeout(timer); job.running = false; };

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores: sm.scores }),
      signal: ctrl.signal
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (d) { return { res: res, d: d }; });
    }).then(function (x) {
      done();
      var log = logEl();
      var res = log ? resultMessages(log) : [];
      var anchor = res[res.length - 1];
      if (x.res.ok && x.d && x.d.ok && x.d.report) {
        try { localStorage.setItem(REPORT_KEY, JSON.stringify({ at: sm.at, data: x.d })); } catch (e) {}
        place(anchor, buildCard(x.d, sm), sm.at);
        scrollTo(job.el);
        scan();
      } else {
        showState(anchor, (x.d && x.d.message) || T.failed, true, true);
      }
    }).catch(function (err) {
      done();
      var log = logEl();
      var res = log ? resultMessages(log) : [];
      showState(res[res.length - 1], err && err.name === 'AbortError' ? T.timeout : T.network, true, true);
    });
  }

  function attach() {
    host = document.getElementById('jarvis-widget');
    if (!host || !host.shadowRoot) return false;
    shadow = host.shadowRoot;
    if (!styled) {
      shadow.appendChild(el('style', { text: CSS }));
      styled = true;
    }
    var pending = false;
    observer = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; scan(); });
    });
    observer.observe(shadow, { childList: true, subtree: true });
    scan();
    return true;
  }

  // The widget mounts itself on load; wait for it
  function start() {
    if (attach()) return;
    var tries = 0;
    var t = setInterval(function () {
      tries += 1;
      if (attach() || tries > 100) clearInterval(t);
    }, 200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
