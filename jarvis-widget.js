/*!
 * AX Assistant chat widget for profile-indol-iota-89.vercel.app
 * (file and webhook names still say "jarvis" on purpose: renaming them would break the live site)
 * Drop-in, no build step. Add before </body>:
 *   <script src="/jarvis-widget.js" defer></script>
 *
 * Optional attributes on the <script> tag:
 *   data-endpoint="https://ai-ax.app.n8n.cloud/webhook/jarvis-public"
 *   data-avatar="/assets/profile-new.jpg"
 *   data-contact="#contact"
 */
(function () {
  'use strict';
  if (window.__jarvisWidget) return;
  window.__jarvisWidget = true;

  // ---------- Config ----------
  const tag = document.currentScript;
  const ds = (tag && tag.dataset) || {};
  const CFG = {
    endpoint: ds.endpoint || 'https://ai-ax.app.n8n.cloud/webhook/jarvis-public',
    avatar: ds.avatar || '/assets/profile-new.jpg',
    contact: ds.contact || '#contact'
  };
  const MAX_LEN = 1000;
  const TIMEOUT_MS = 30000;
  const MAX_STORED = 40;
  const STORE_KEY = 'jarvis_chat_v1';

  const COPY = {
    launcher: 'Ask AX Assistant',
    title: 'AX Assistant',
    subtitle: 'AI assistant for Yanchhuong',
    greeting:
      "Hi, I'm AX Assistant, Yanchhuong's AI helper. Ask me about his work, or leave a message and I'll pass it to him.\n" +
      'សួស្តី! អ្នកអាចសួរខ្ញុំជាភាសាខ្មែរ ឬអង់គ្លេស។',
    suggestions: [
      'What do you work on?',
      'Can you help with my project?',
      'How do I contact Yanchhuong?',
      'តើលោកធ្វើការងារអ្វីខ្លះ?'
    ],
    placeholder: 'Type your question…',
    send: 'Send',
    close: 'Close chat',
    reset: 'New chat',
    typing: 'AX Assistant is typing',
    disclaimer: 'AX Assistant is an AI and can make mistakes.',
    errNetwork: "AX Assistant couldn't reply. Check your connection and try again.",
    errTimeout: 'AX Assistant took too long to reply. Try again in a moment.',
    errOrigin: 'This chat only works on the official site.',
    errGeneric: "AX Assistant couldn't reply right now.",
    contactLink: 'Use the contact form instead'
  };

  // ---------- Storage (session only, private to this tab) ----------
  const store = {
    load() {
      try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || null; } catch (e) { return null; }
    },
    save(s) {
      try {
        sessionStorage.setItem(STORE_KEY, JSON.stringify({
          sessionId: s.sessionId,
          messages: s.messages.slice(-MAX_STORED)
        }));
      } catch (e) { /* storage full or blocked: chat still works in memory */ }
    },
    clear() { try { sessionStorage.removeItem(STORE_KEY); } catch (e) {} }
  };

  function newSessionId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  const saved = store.load();
  const state = {
    sessionId: (saved && saved.sessionId) || newSessionId(),
    open: false,
    messages: (saved && Array.isArray(saved.messages)) ? saved.messages : [],
    busy: false
  };

  // ---------- Styles (scoped inside Shadow DOM) ----------
  const CSS = `
* { box-sizing: border-box; }
.root {
  --jv-surface: #FFF8EE;
  --jv-bot: #F3E8D7;
  --jv-ink: #23343B;
  --jv-ink-hover: #1A282E;
  --jv-on-ink: #FFF8EE;
  --jv-text: #2B2622;
  --jv-muted: #75695D;
  --jv-line: #E5D6C0;
  --jv-live: #3E8E5A;
  --jv-error: #9A3B2E;
  --jv-focus: #2F6F86;
  font: inherit;
  font-size: 15px;
  line-height: 1.5;
  letter-spacing: normal;
  text-align: left;
  color: var(--jv-text);
}

/* Launcher */
.launcher {
  position: fixed;
  right: max(20px, env(safe-area-inset-right));
  bottom: max(20px, env(safe-area-inset-bottom));
  z-index: 2147483000;
  display: inline-flex; align-items: center; gap: 10px;
  padding: 6px 18px 6px 6px;
  border: 0; border-radius: 999px;
  background: var(--jv-ink); color: var(--jv-on-ink);
  font: inherit; font-weight: 600; font-size: 15px;
  cursor: pointer;
  box-shadow: 0 10px 28px -12px rgba(35, 52, 59, .55);
  transition: background-color .15s ease, transform .15s ease;
}
.launcher:hover { background: var(--jv-ink-hover); transform: translateY(-1px); }
.launcher[hidden] { display: none; }

.avatar {
  position: relative; flex: none;
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--jv-bot) center/cover no-repeat;
  box-shadow: 0 0 0 2px var(--jv-on-ink);
  display: grid; place-items: center;
  color: var(--jv-ink); font-weight: 700;
}
.avatar.small { width: 36px; height: 36px; box-shadow: 0 0 0 2px var(--jv-surface); }
.avatar::after {
  content: ""; position: absolute; right: -1px; bottom: -1px;
  width: 11px; height: 11px; border-radius: 50%;
  background: var(--jv-live); box-shadow: 0 0 0 2px var(--jv-ink);
}
.avatar.small::after { box-shadow: 0 0 0 2px var(--jv-surface); }

/* Panel */
.panel {
  position: fixed;
  right: max(20px, env(safe-area-inset-right));
  bottom: max(20px, env(safe-area-inset-bottom));
  z-index: 2147483001;
  width: min(390px, calc(100vw - 40px));
  height: min(620px, calc(100dvh - 40px));
  display: flex; flex-direction: column;
  background: var(--jv-surface);
  border: 1px solid var(--jv-line);
  border-radius: 20px;
  box-shadow: 0 24px 60px -24px rgba(43, 38, 34, .45);
  overflow: hidden;
  transform-origin: bottom right;
  animation: jv-open .18s ease-out;
}
.panel[hidden] { display: none; }
@keyframes jv-open { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }

.header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 12px 14px 16px;
  border-bottom: 1px solid var(--jv-line);
}
.who { flex: 1; min-width: 0; }
.who strong { display: block; font-size: 16px; line-height: 1.25; }
.who span { display: block; font-size: 13px; color: var(--jv-muted); }
.icon-btn {
  flex: none; display: inline-grid; place-items: center;
  height: 36px; min-width: 36px; padding: 0 10px;
  border: 0; border-radius: 10px; background: transparent;
  color: var(--jv-muted); font: inherit; font-size: 13px; cursor: pointer;
}
.icon-btn:hover { background: var(--jv-bot); color: var(--jv-text); }
.icon-btn svg { width: 18px; height: 18px; }

/* Messages */
.log {
  flex: 1; overflow-y: auto; overscroll-behavior: contain;
  padding: 18px 16px 8px;
  display: flex; flex-direction: column; gap: 10px;
}
.msg {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 16px;
  white-space: pre-wrap; overflow-wrap: anywhere;
}
.msg.bot { align-self: flex-start; background: var(--jv-bot); border-bottom-left-radius: 5px; }
.msg.user { align-self: flex-end; background: var(--jv-ink); color: var(--jv-on-ink); border-bottom-right-radius: 5px; }
.msg.error { align-self: flex-start; background: transparent; border: 1px solid var(--jv-line); color: var(--jv-error); border-bottom-left-radius: 5px; }
.msg.error a { display: inline-block; margin-top: 4px; color: var(--jv-ink); font-weight: 600; }

.chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 0 6px; }
.chip {
  border: 1px solid var(--jv-line); background: #FFFFFF;
  color: var(--jv-text); font: inherit; font-size: 14px;
  padding: 7px 12px; border-radius: 999px; cursor: pointer; text-align: left;
}
.chip:hover { border-color: var(--jv-ink); }

.typing { align-self: flex-start; display: inline-flex; gap: 5px; padding: 14px 16px; background: var(--jv-bot); border-radius: 16px; border-bottom-left-radius: 5px; }
.typing i { width: 7px; height: 7px; border-radius: 50%; background: var(--jv-muted); animation: jv-dot 1.1s infinite ease-in-out; }
.typing i:nth-child(2) { animation-delay: .15s; }
.typing i:nth-child(3) { animation-delay: .3s; }
@keyframes jv-dot { 0%, 80%, 100% { opacity: .3; transform: none; } 40% { opacity: 1; transform: translateY(-3px); } }

/* Composer */
.composer { padding: 10px 12px 12px; border-top: 1px solid var(--jv-line); }
.field {
  display: flex; align-items: flex-end; gap: 8px;
  background: #FFFFFF; border: 1px solid var(--jv-line); border-radius: 14px;
  padding: 6px 6px 6px 12px;
}
.field:focus-within { border-color: var(--jv-ink); box-shadow: 0 0 0 2px var(--jv-focus); }
textarea {
  flex: 1; resize: none; border: 0; outline: 0; background: transparent;
  font: inherit; font-size: 15px; color: var(--jv-text);
  line-height: 1.45; max-height: 7.5em; padding: 6px 0;
}
textarea::placeholder { color: var(--jv-muted); }
.send {
  flex: none; width: 38px; height: 38px; border: 0; border-radius: 10px;
  background: var(--jv-ink); color: var(--jv-on-ink);
  display: grid; place-items: center; cursor: pointer;
}
.send:hover:not(:disabled) { background: var(--jv-ink-hover); }
.send:disabled { opacity: .4; cursor: not-allowed; }
.send svg { width: 18px; height: 18px; }
.meta { display: flex; justify-content: space-between; gap: 8px; margin-top: 6px; font-size: 12px; color: var(--jv-muted); }
.count.over { color: var(--jv-error); font-weight: 600; }

button:focus-visible, a:focus-visible {
  outline: 2px solid var(--jv-focus); outline-offset: 2px;
}

.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* Mobile: full screen */
@media (max-width: 520px) {
  .launcher { padding-right: 16px; }
  .panel {
    inset: 0; width: 100%; height: 100dvh;
    border-radius: 0; border: 0;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .msg { max-width: 90%; }
  textarea { font-size: 16px; } /* prevents iOS zoom on focus */
}

@media (prefers-reduced-motion: reduce) {
  .panel, .launcher { animation: none; transition: none; }
  .typing i { animation: none; opacity: .7; }
}
`;

  // ---------- DOM helpers ----------
  function el(tagName, attrs, children) {
    const node = document.createElement(tagName);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'text') node.textContent = attrs[k];
        else if (k === 'class') node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }
  function svg(path) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = path; // static icon markup only, never user content
    return s;
  }
  function avatar(small) {
    const a = el('span', { class: 'avatar' + (small ? ' small' : ''), 'aria-hidden': 'true' });
    const img = new Image();
    img.onload = function () { a.style.backgroundImage = 'url("' + CFG.avatar + '")'; };
    img.onerror = function () { a.textContent = 'J'; };
    img.src = CFG.avatar;
    return a;
  }

  // ---------- Build UI ----------
  const host = el('div', { id: 'jarvis-widget' });
  const shadow = host.attachShadow({ mode: 'open' });
  const style = el('style', { text: CSS });
  const root = el('div', { class: 'root' });

  const launcher = el('button', { class: 'launcher', type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' },
    [avatar(false), el('span', { text: COPY.launcher })]);

  const resetBtn = el('button', { class: 'icon-btn', type: 'button', text: COPY.reset });
  const closeBtn = el('button', { class: 'icon-btn', type: 'button', 'aria-label': COPY.close },
    [svg('<path d="M18 6 6 18M6 6l12 12"/>')]);

  const header = el('div', { class: 'header' }, [
    avatar(true),
    el('div', { class: 'who' }, [
      el('strong', { id: 'jv-title', text: COPY.title }),
      el('span', { text: COPY.subtitle })
    ]),
    resetBtn,
    closeBtn
  ]);

  const log = el('div', { class: 'log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions' });
  const status = el('div', { class: 'sr', 'aria-live': 'assertive' });

  const input = el('textarea', {
    rows: '1',
    placeholder: COPY.placeholder,
    'aria-label': COPY.placeholder,
    maxlength: String(MAX_LEN + 200)
  });
  const sendBtn = el('button', { class: 'send', type: 'button', 'aria-label': COPY.send, disabled: '' },
    [svg('<path d="M5 12h14M13 6l6 6-6 6"/>')]);
  const count = el('span', { class: 'count', 'aria-live': 'polite' });

  const composer = el('div', { class: 'composer' }, [
    el('div', { class: 'field' }, [input, sendBtn]),
    el('div', { class: 'meta' }, [el('span', { text: COPY.disclaimer }), count])
  ]);

  const panel = el('div', { class: 'panel', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'jv-title', hidden: '' },
    [header, log, composer, status]);

  root.appendChild(launcher);
  root.appendChild(panel);
  shadow.appendChild(style);
  shadow.appendChild(root);

  // ---------- Rendering ----------
  let typingNode = null;

  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function renderMessage(m) {
    if (m.role === 'error') {
      const box = el('div', { class: 'msg error' }, [el('span', { text: m.text })]);
      const link = el('a', { href: CFG.contact, text: COPY.contactLink });
      link.addEventListener('click', function () { setOpen(false); });
      box.appendChild(document.createElement('br'));
      box.appendChild(link);
      return box;
    }
    return el('div', { class: 'msg ' + (m.role === 'user' ? 'user' : 'bot'), text: m.text });
  }

  function renderChips() {
    const wrap = el('div', { class: 'chips' });
    COPY.suggestions.forEach(function (q) {
      const chip = el('button', { class: 'chip', type: 'button', text: q });
      chip.addEventListener('click', function () { send(q); });
      wrap.appendChild(chip);
    });
    return wrap;
  }

  function renderAll() {
    log.textContent = '';
    log.appendChild(renderMessage({ role: 'bot', text: COPY.greeting }));
    state.messages.forEach(function (m) { log.appendChild(renderMessage(m)); });
    const hasUserMsg = state.messages.some(function (m) { return m.role === 'user'; });
    if (!hasUserMsg) log.appendChild(renderChips());
    scrollDown();
  }

  function addMessage(role, text) {
    const m = { role: role, text: text };
    state.messages.push(m);
    const chips = log.querySelector('.chips');
    if (chips) chips.remove();
    log.appendChild(renderMessage(m));
    scrollDown();
    store.save(state);
  }

  function setTyping(on) {
    if (on && !typingNode) {
      typingNode = el('div', { class: 'typing', 'aria-label': COPY.typing }, [el('i'), el('i'), el('i')]);
      log.appendChild(typingNode);
      status.textContent = COPY.typing;
      scrollDown();
    } else if (!on && typingNode) {
      typingNode.remove();
      typingNode = null;
      status.textContent = '';
    }
  }

  function updateComposer() {
    const len = input.value.trim().length;
    const over = input.value.length > MAX_LEN;
    sendBtn.disabled = state.busy || len === 0 || over;
    count.textContent = input.value.length > MAX_LEN - 200 ? input.value.length + ' / ' + MAX_LEN : '';
    count.classList.toggle('over', over);
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }

  // ---------- Open / close ----------
  function setOpen(open) {
    state.open = open;
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.hidden = open;
    store.save(state);
    if (open) {
      renderAll();
      setTimeout(function () { input.focus(); }, 30);
    } else {
      launcher.focus();
    }
  }

  // ---------- Network ----------
  async function send(text) {
    const message = String(text || '').trim();
    if (!message || state.busy || message.length > MAX_LEN) return;

    state.busy = true;
    addMessage('user', message);
    input.value = '';
    updateComposer();
    setTyping(true);

    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

    try {
      const res = await fetch(CFG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: state.sessionId,
          message: message,
          page: location.pathname
        }),
        signal: controller.signal
      });

      let data = null;
      try { data = await res.json(); } catch (e) { data = null; }

      if (res.ok && data && data.reply) {
        addMessage('bot', data.reply);
      } else if (data && data.reply) {
        // 400 / 429 from the guard carry a friendly reply
        addMessage(res.status === 429 ? 'error' : 'bot', data.reply);
      } else if (res.status === 403) {
        addMessage('error', COPY.errOrigin);
      } else {
        addMessage('error', COPY.errGeneric);
      }
    } catch (err) {
      addMessage('error', err && err.name === 'AbortError' ? COPY.errTimeout : COPY.errNetwork);
    } finally {
      clearTimeout(timer);
      setTyping(false);
      state.busy = false;
      updateComposer();
      input.focus();
    }
  }

  // ---------- Events ----------
  launcher.addEventListener('click', function () { setOpen(true); });
  closeBtn.addEventListener('click', function () { setOpen(false); });

  resetBtn.addEventListener('click', function () {
    if (state.busy) return;
    state.sessionId = newSessionId();
    state.messages = [];
    store.clear();
    store.save(state);
    renderAll();
    input.focus();
  });

  sendBtn.addEventListener('click', function () { send(input.value); });

  input.addEventListener('input', updateComposer);
  input.addEventListener('keydown', function (e) {
    // isComposing: don't send while typing Khmer/IME text
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send(input.value);
    }
  });

  panel.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });

  // ---------- Mount ----------
  function mount() {
    document.body.appendChild(host);
    renderAll();
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
