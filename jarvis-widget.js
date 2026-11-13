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
    contactLink: 'Use the contact form instead',

    // Voice mode
    voiceOpen: 'Talk with AX Assistant',
    voiceTitle: 'AX Assistant',
    voiceTag: 'Voice mode',
    vTap: 'Tap the core to speak',
    vListening: 'Listening…',
    vThinking: 'Thinking…',
    vSpeaking: 'Speaking · tap to interrupt',
    vNoSpeech: "I didn't catch that. Tap to try again.",
    vMicBlocked: 'Microphone access is blocked. Allow it in your browser settings, then tap to speak.',
    vNoKhmerVoice: "This device has no Khmer voice, so I'm showing the reply as text.",
    vHint: "Ask about Yanchhuong's work, or leave him a message.",
    vType: 'Type instead',
    vClose: 'Close voice mode',
    vMute: 'Mute voice replies',
    vUnmute: 'Turn voice replies on',
    vLangEn: 'Speech language: English. Switch to Khmer',
    vLangKm: 'Speech language: Khmer. Switch to English'
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

/* Mic button in the composer */
.mic {
  flex: none; width: 38px; height: 38px; border: 1px solid var(--jv-line); border-radius: 10px;
  background: #FFFFFF; color: var(--jv-ink);
  display: grid; place-items: center; cursor: pointer;
}
.mic:hover { border-color: var(--jv-ink); }
.mic svg { width: 18px; height: 18px; }

/* ---------- Voice mode (full screen) ---------- */
.vm {
  --vm-cyan: #5EE7FF;
  --vm-amber: #FDBA74;
  position: fixed; inset: 0; z-index: 2147483002;
  display: flex; flex-direction: column; align-items: center;
  padding: max(16px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom));
  color: #E6FBFF;
  background:
    repeating-linear-gradient(0deg, rgba(94,231,255,.035) 0 1px, transparent 1px 44px),
    repeating-linear-gradient(90deg, rgba(94,231,255,.035) 0 1px, transparent 1px 44px),
    radial-gradient(circle at 50% 42%, #0C2B38 0%, #05141C 46%, #010507 100%);
  overscroll-behavior: contain; touch-action: manipulation;
  animation: vm-in .25s ease-out;
}
.vm[hidden] { display: none; }
@keyframes vm-in { from { opacity: 0; } to { opacity: 1; } }

/* HUD corner brackets */
.vm::before, .vm::after {
  content: ""; position: absolute; width: 56px; height: 56px; pointer-events: none;
  border: 2px solid rgba(94,231,255,.45);
}
.vm::before { top: 14px; left: 14px; border-right: 0; border-bottom: 0; }
.vm::after { bottom: 14px; right: 14px; border-left: 0; border-top: 0; }

.vm-top {
  width: 100%; max-width: 980px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.vm-id { display: flex; flex-direction: column; gap: 2px; padding-left: 8px; }
.vm-id strong { font-size: 15px; letter-spacing: .28em; text-transform: uppercase; color: var(--vm-cyan); }
.vm-id span { font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: rgba(230,251,255,.55); }
.vm-actions { display: flex; align-items: center; gap: 8px; }
.vm-btn {
  min-height: 40px; min-width: 40px; padding: 0 14px;
  display: inline-grid; place-items: center;
  border: 1px solid rgba(94,231,255,.35); border-radius: 999px;
  background: rgba(5,20,28,.6); color: #E6FBFF;
  font: inherit; font-size: 13px; font-weight: 600; letter-spacing: .06em; cursor: pointer;
}
.vm-btn:hover { border-color: var(--vm-cyan); background: rgba(94,231,255,.1); }
.vm-btn svg { width: 18px; height: 18px; }
.vm-btn[aria-pressed="true"] { color: var(--vm-amber); border-color: rgba(253,186,116,.6); }

.vm-stage { flex: 1; min-height: 0; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; }
.vm-orb {
  position: relative; width: min(64vmin, 420px); aspect-ratio: 1; flex: none;
  border: 0; border-radius: 50%; padding: 0; background: transparent; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.vm-orb canvas { width: 100%; height: 100%; display: block; }
.vm-orb:focus-visible { outline: 2px solid var(--vm-cyan); outline-offset: 6px; }
.vm-status {
  font-size: 13px; font-weight: 600; letter-spacing: .24em; text-transform: uppercase;
  color: var(--vm-cyan); text-align: center; min-height: 1.5em;
}
.vm-status.warn { color: var(--vm-amber); letter-spacing: .04em; text-transform: none; font-size: 14px; }

.vm-captions {
  width: 100%; max-width: 680px; max-height: 30vh; overflow-y: auto;
  text-align: center; display: flex; flex-direction: column; gap: 10px;
}
.vm-you { margin: 0; font-size: 15px; color: rgba(230,251,255,.6); }
.vm-you:not(:empty)::before { content: "\\201C"; }
.vm-you:not(:empty)::after { content: "\\201D"; }
.vm-ai { margin: 0; font-size: clamp(17px, 2.4vw, 21px); line-height: 1.55; color: #FFFFFF; white-space: pre-wrap; }
.vm-hint { margin: 0; font-size: 14px; color: rgba(230,251,255,.55); }
.vm-foot { display: flex; justify-content: center; }
.vm-link {
  border: 0; background: transparent; color: rgba(230,251,255,.75);
  font: inherit; font-size: 14px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; padding: 8px 12px;
}
.vm-link:hover { color: #FFFFFF; }
.vm button:focus-visible { outline: 2px solid var(--vm-cyan); outline-offset: 2px; }

@media (max-width: 520px) {
  .vm::before, .vm::after { width: 34px; height: 34px; }
  .vm-orb { width: min(78vw, 360px); }
  .vm-btn { padding: 0 11px; }
}
@media (prefers-reduced-motion: reduce) { .vm { animation: none; } }
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

  // Voice input needs the browser's speech recognition (Chrome, Edge, Safari).
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const VOICE_OK = !!SpeechRec;
  const MIC_ICON = '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>';

  const resetBtn = el('button', { class: 'icon-btn', type: 'button', text: COPY.reset });
  const closeBtn = el('button', { class: 'icon-btn', type: 'button', 'aria-label': COPY.close },
    [svg('<path d="M18 6 6 18M6 6l12 12"/>')]);
  const voiceHeaderBtn = VOICE_OK
    ? el('button', { class: 'icon-btn', type: 'button', 'aria-label': COPY.voiceOpen, title: COPY.voiceOpen }, [svg(MIC_ICON)])
    : null;

  const header = el('div', { class: 'header' }, [
    avatar(true),
    el('div', { class: 'who' }, [
      el('strong', { id: 'jv-title', text: COPY.title }),
      el('span', { text: COPY.subtitle })
    ]),
    voiceHeaderBtn,
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

  const micBtn = VOICE_OK
    ? el('button', { class: 'mic', type: 'button', 'aria-label': COPY.voiceOpen, title: COPY.voiceOpen }, [svg(MIC_ICON)])
    : null;

  const composer = el('div', { class: 'composer' }, [
    el('div', { class: 'field' }, [input, micBtn, sendBtn]),
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
  // Sends one message to the assistant and returns { role, text } for the reply.
  async function requestReply(message) {
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

      if (res.ok && data && data.reply) return { role: 'bot', text: data.reply };
      // 400 / 429 from the guard carry a friendly reply
      if (data && data.reply) return { role: res.status === 429 ? 'error' : 'bot', text: data.reply };
      if (res.status === 403) return { role: 'error', text: COPY.errOrigin };
      return { role: 'error', text: COPY.errGeneric };
    } catch (err) {
      return { role: 'error', text: err && err.name === 'AbortError' ? COPY.errTimeout : COPY.errNetwork };
    } finally {
      clearTimeout(timer);
    }
  }

  async function send(text) {
    const message = String(text || '').trim();
    if (!message || state.busy || message.length > MAX_LEN) return;

    state.busy = true;
    addMessage('user', message);
    input.value = '';
    updateComposer();
    setTyping(true);

    const reply = await requestReply(message);
    addMessage(reply.role, reply.text);

    setTyping(false);
    state.busy = false;
    updateComposer();
    input.focus();
  }

  // ---------- Voice mode ----------
  // Full-screen, hands-free conversation: speech in (browser speech recognition),
  // speech out (browser speech synthesis), with an animated HUD core that reacts
  // to listening, thinking and speaking. Turns are saved to the same chat history.
  const synth = window.speechSynthesis || null;
  const REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const KHMER_RE = /[ក-៿]/;

  const vm = {
    open: false,
    state: 'idle',          // idle | listening | thinking | speaking
    lang: /^km/i.test(navigator.language || '') ? 'km' : 'en',
    muted: false,
    auto: false,            // keep the conversation going hands-free
    misses: 0,
    rec: null,
    speakId: 0,
    unlocked: false,
    level: 0,
    bump: 0,
    raf: 0,
    ctx: null,
    returnFocus: null,
    prevOverflow: ''
  };

  let vmEls = null;

  function buildVoiceUI() {
    const langBtn = el('button', { class: 'vm-btn', type: 'button' });
    const muteBtn = el('button', { class: 'vm-btn', type: 'button', 'aria-pressed': 'false', 'aria-label': COPY.vMute, title: COPY.vMute },
      [svg('<path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>')]);
    const closeVm = el('button', { class: 'vm-btn', type: 'button', 'aria-label': COPY.vClose, title: COPY.vClose },
      [svg('<path d="M18 6 6 18M6 6l12 12"/>')]);
    const canvas = el('canvas', { 'aria-hidden': 'true' });
    const orb = el('button', { class: 'vm-orb', type: 'button', 'aria-label': COPY.vTap }, [canvas]);
    const statusEl = el('div', { class: 'vm-status', role: 'status', 'aria-live': 'polite', text: COPY.vTap });
    const youEl = el('p', { class: 'vm-you' });
    const aiEl = el('p', { class: 'vm-ai', 'aria-live': 'polite' });
    const hintEl = el('p', { class: 'vm-hint', text: COPY.vHint });
    const typeBtn = el('button', { class: 'vm-link', type: 'button', text: COPY.vType });

    const overlay = el('div', { class: 'vm', role: 'dialog', 'aria-modal': 'true', 'aria-label': COPY.voiceOpen, hidden: '' }, [
      el('div', { class: 'vm-top' }, [
        el('div', { class: 'vm-id' }, [el('strong', { text: COPY.voiceTitle }), el('span', { text: COPY.voiceTag })]),
        el('div', { class: 'vm-actions' }, [langBtn, muteBtn, closeVm])
      ]),
      el('div', { class: 'vm-stage' }, [
        orb,
        statusEl,
        el('div', { class: 'vm-captions' }, [youEl, aiEl, hintEl])
      ]),
      el('div', { class: 'vm-foot' }, [typeBtn])
    ]);
    root.appendChild(overlay);

    orb.addEventListener('click', onOrbTap);
    closeVm.addEventListener('click', function () { closeVoice(false); });
    typeBtn.addEventListener('click', function () { closeVoice(true); });
    muteBtn.addEventListener('click', function () {
      vm.muted = !vm.muted;
      muteBtn.setAttribute('aria-pressed', String(vm.muted));
      muteBtn.setAttribute('aria-label', vm.muted ? COPY.vUnmute : COPY.vMute);
      muteBtn.title = vm.muted ? COPY.vUnmute : COPY.vMute;
      if (vm.muted && vm.state === 'speaking') { stopSpeaking(); setVoiceState('idle'); }
    });
    langBtn.addEventListener('click', function () {
      vm.lang = vm.lang === 'en' ? 'km' : 'en';
      renderLang();
      if (vm.state === 'listening') { stopListening(); startListening(true); }
    });
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); closeVoice(false); return; }
      if (e.key === 'Tab') trapFocus(e, overlay);
    });

    vmEls = { overlay: overlay, orb: orb, canvas: canvas, statusEl: statusEl, youEl: youEl, aiEl: aiEl, hintEl: hintEl, langBtn: langBtn };
    vm.ctx = canvas.getContext('2d');
    renderLang();
  }

  function renderLang() {
    vmEls.langBtn.textContent = vm.lang === 'en' ? 'EN' : 'ខ្មែរ';
    vmEls.langBtn.setAttribute('aria-label', vm.lang === 'en' ? COPY.vLangEn : COPY.vLangKm);
    vmEls.langBtn.title = vmEls.langBtn.getAttribute('aria-label');
  }

  function trapFocus(e, container) {
    const items = Array.prototype.filter.call(
      container.querySelectorAll('button'),
      function (b) { return !b.disabled && b.offsetParent !== null; }
    );
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    const active = shadow.activeElement;
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }

  function setVoiceStatus(text, warn) {
    vmEls.statusEl.textContent = text;
    vmEls.statusEl.classList.toggle('warn', !!warn);
  }

  function setVoiceState(s, statusText, warn) {
    vm.state = s;
    const label = statusText || (s === 'listening' ? COPY.vListening : s === 'thinking' ? COPY.vThinking : s === 'speaking' ? COPY.vSpeaking : COPY.vTap);
    setVoiceStatus(label, warn);
    vmEls.orb.setAttribute('aria-label', s === 'speaking' ? COPY.vSpeaking : s === 'listening' ? COPY.vListening : COPY.vTap);
  }

  function openVoice() {
    if (!VOICE_OK) { setOpen(true); return; }
    if (!vmEls) buildVoiceUI();
    if (vm.open) return;
    vm.open = true;
    vm.returnFocus = shadow.activeElement || document.activeElement;
    vmEls.overlay.hidden = false;
    vm.prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    vmEls.youEl.textContent = '';
    vmEls.aiEl.textContent = '';
    vmEls.hintEl.hidden = false;
    vm.misses = 0;
    setVoiceState('idle');
    if (synth && synth.getVoices) synth.getVoices(); // starts loading voices in Chrome
    cancelAnimationFrame(vm.raf);
    vm.raf = requestAnimationFrame(drawHud);
    setTimeout(function () { vmEls.orb.focus(); }, 30);
  }

  function closeVoice(toChat) {
    if (!vm.open) return;
    vm.open = false;
    vm.auto = false;
    stopListening();
    stopSpeaking();
    cancelAnimationFrame(vm.raf);
    vmEls.overlay.hidden = true;
    document.documentElement.style.overflow = vm.prevOverflow;
    vm.state = 'idle';
    if (toChat) { setOpen(true); return; }
    if (vm.returnFocus && vm.returnFocus.focus) vm.returnFocus.focus();
  }

  function onOrbTap() {
    // iOS only allows speech output that starts from a tap, so "unlock" it on the first one.
    if (synth && !vm.unlocked) {
      try { synth.speak(new SpeechSynthesisUtterance('')); } catch (e) {}
      vm.unlocked = true;
    }
    if (vm.state === 'listening') { vm.auto = false; stopListening(); setVoiceState('idle'); return; }
    if (vm.state === 'thinking') return;
    if (vm.state === 'speaking') stopSpeaking();
    vm.auto = true;
    vm.misses = 0;
    startListening(true);
  }

  function startListening(fromTap) {
    if (!vm.open || state.busy) return;
    stopListening();
    let finalText = '';
    let rec;
    try { rec = new SpeechRec(); } catch (e) { setVoiceState('idle', COPY.vMicBlocked, true); return; }
    rec.lang = vm.lang === 'km' ? 'km-KH' : 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = function (e) {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      vmEls.youEl.textContent = (finalText + ' ' + interim).trim();
      vmEls.hintEl.hidden = true;
      vm.bump = 1;
    };
    rec.onsoundstart = function () { vm.bump = Math.max(vm.bump, 0.6); };
    rec.onerror = function (e) {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        vm.auto = false;
        // An automatic re-listen can be refused on some phones; just wait for a tap then.
        rec._status = fromTap ? { text: COPY.vMicBlocked, warn: true } : { text: COPY.vTap };
      } else if (e.error === 'no-speech') {
        vm.misses += 1;
        rec._status = { text: COPY.vNoSpeech };
      } else if (e.error !== 'aborted') {
        rec._status = { text: COPY.vNoSpeech };
      }
    };
    rec.onend = function () {
      if (vm.rec === rec) vm.rec = null;
      const text = finalText.trim();
      if (text && vm.open) { handleUtterance(text); return; }
      if (vm.open && vm.state === 'listening') {
        const st = rec._status || { text: COPY.vTap };
        setVoiceState('idle', st.text, st.warn);
      }
    };

    vm.rec = rec;
    vmEls.youEl.textContent = '';
    setVoiceState('listening');
    try { rec.start(); } catch (e) { vm.rec = null; setVoiceState('idle'); }
  }

  function stopListening() {
    const rec = vm.rec;
    vm.rec = null;
    if (rec) {
      rec.onresult = null; rec.onend = null; rec.onerror = null;
      try { rec.abort(); } catch (e) {}
    }
  }

  async function handleUtterance(text) {
    const message = text.slice(0, MAX_LEN);
    vm.misses = 0;
    vmEls.youEl.textContent = message;
    vmEls.aiEl.textContent = '';
    setVoiceState('thinking');

    state.busy = true;
    addMessage('user', message);
    updateComposer();
    const reply = await requestReply(message);
    addMessage(reply.role, reply.text);
    state.busy = false;
    updateComposer();

    if (!vm.open) return;
    vmEls.aiEl.textContent = reply.text;
    if (reply.role === 'error') { vm.auto = false; setVoiceState('idle'); return; }
    if (vm.muted) { afterReply(); return; }
    speak(reply.text);
  }

  function pickVoice(khmer) {
    if (!synth || !synth.getVoices) return null;
    const voices = synth.getVoices() || [];
    if (khmer) return voices.find(function (v) { return /^km/i.test(v.lang); }) || null;
    const en = voices.filter(function (v) { return /^en/i.test(v.lang); });
    // Prefer a calm, deep, British-style voice when the device has one.
    const prefs = [/Ryan/i, /George/i, /Daniel/i, /Arthur/i, /UK English Male/i, /Thomas/i, /Guy/i, /Davis/i, /Christopher/i, /\bMale\b/i];
    for (let i = 0; i < prefs.length; i++) {
      const v = en.find(function (x) { return prefs[i].test(x.name); });
      if (v) return v;
    }
    return en.find(function (v) { return /en-GB/i.test(v.lang); }) || en[0] || null;
  }

  function speak(text) {
    const khmer = KHMER_RE.test(text);
    const voice = pickVoice(khmer);
    if (!synth || (khmer && !voice)) {
      vm.auto = false;
      setVoiceState('idle', khmer ? COPY.vNoKhmerVoice : COPY.vTap, khmer);
      return;
    }
    synth.cancel();
    const id = ++vm.speakId;
    // Speak sentence by sentence: Chrome cuts off long utterances, and the core
    // gets a pulse at every sentence.
    const parts = text.match(/[^.!?។\n]+[.!?។]*\s*/g) || [text];
    setVoiceState('speaking');
    parts.forEach(function (part, i) {
      const u = new SpeechSynthesisUtterance(part.trim());
      if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-GB'; }
      u.rate = 1.02;
      u.pitch = 0.92;
      u.onstart = function () { vm.bump = 1; };
      u.onboundary = function () { vm.bump = Math.max(vm.bump, 0.7); };
      if (i === parts.length - 1) {
        u.onend = function () { if (id === vm.speakId) afterReply(); };
        u.onerror = function () { if (id === vm.speakId) afterReply(); };
      }
      synth.speak(u);
    });
  }

  function stopSpeaking() {
    vm.speakId++;
    if (synth) { try { synth.cancel(); } catch (e) {} }
  }

  function afterReply() {
    if (!vm.open) return;
    if (vm.auto && vm.misses < 2) {
      setTimeout(function () { if (vm.open && vm.state !== 'listening') startListening(false); }, 350);
    } else {
      setVoiceState('idle');
    }
  }

  // ---------- HUD animation ----------
  function drawHud(ts) {
    if (!vm.open) return;
    vm.raf = requestAnimationFrame(drawHud);
    const canvas = vmEls.canvas;
    const ctx = vm.ctx;
    const size = vmEls.orb.clientWidth;
    if (!size || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(size * dpr);
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }

    const t = ts / 1000;
    const spin = REDUCED_MOTION ? 0 : 1;
    const s = vm.state;

    let target;
    if (s === 'listening') target = 0.22 + vm.bump * 0.55;
    else if (s === 'speaking') target = 0.3 + 0.35 * Math.abs(Math.sin(t * 7.3)) * (0.6 + 0.4 * Math.sin(t * 2.1)) + vm.bump * 0.25;
    else if (s === 'thinking') target = 0.18;
    else target = 0.06 + 0.04 * Math.sin(t * 1.6);
    vm.bump *= 0.92;
    vm.level += (target - vm.level) * 0.12;
    const L = REDUCED_MOTION ? Math.min(vm.level, 0.2) : vm.level;

    const CYAN = '94,231,255';
    const AMBER = '253,186,116';
    const hot = s === 'thinking' ? AMBER : CYAN;
    const cx = size / 2, cy = size / 2, R = size / 2 - 4;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.lineCap = 'round';

    // Outer tick ring: ticks stretch with the voice level
    const ticks = 96;
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2 + t * 0.05 * spin;
      const major = i % 8 === 0;
      const live = s === 'listening' || s === 'speaking';
      const wave = live ? Math.abs(Math.sin(i * 0.7 + t * 6 * spin)) * L : 0;
      const len = (major ? 10 : 5) + wave * R * 0.12;
      const r1 = R - 2, r0 = r1 - len;
      ctx.strokeStyle = 'rgba(' + CYAN + ',' + (major ? 0.85 : 0.35) + ')';
      ctx.lineWidth = major ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.stroke();
    }

    // Segmented rings turning in opposite directions
    function ring(r, segs, fill, rot, color, width) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      const step = (Math.PI * 2) / segs;
      for (let i = 0; i < segs; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, rot + i * step, rot + i * step + step * fill);
        ctx.stroke();
      }
    }
    ring(R * 0.8, 6, 0.55, t * 0.35 * spin, 'rgba(' + CYAN + ',0.55)', 3);
    ring(R * 0.7, 3, 0.85, -t * (s === 'thinking' ? 2.4 : 0.8) * spin, 'rgba(' + hot + ',0.8)', 2);
    ring(R * 0.6, 24, 0.4, t * 0.15 * spin, 'rgba(' + CYAN + ',0.25)', 1.5);

    // Thinking: a bright sweep around the outside
    if (s === 'thinking') {
      const a0 = t * 4 * (spin || 0.25);
      ctx.strokeStyle = 'rgba(' + AMBER + ',0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.9, a0, a0 + 1.1);
      ctx.stroke();
    }

    // Waveform ring around the core
    const base = R * 0.44;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      const n = Math.sin(a * 6 + t * 5 * spin) * 0.5 + Math.sin(a * 11 - t * 7 * spin) * 0.5;
      const r = base + n * L * R * 0.14;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(' + CYAN + ',0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glowing core
    const coreR = R * 0.24 * (1 + L * 0.4);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 1.9);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.25, 'rgba(' + hot + ',0.85)');
    g.addColorStop(0.6, 'rgba(' + hot + ',0.18)');
    g.addColorStop(1, 'rgba(' + hot + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 0.75, 0, Math.PI * 2);
    ctx.stroke();
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

  if (voiceHeaderBtn) voiceHeaderBtn.addEventListener('click', openVoice);
  if (micBtn) micBtn.addEventListener('click', openVoice);

  // Any element on the page with data-ax-voice opens voice mode
  // (falls back to the text chat on browsers without speech recognition).
  document.addEventListener('click', function (e) {
    const trigger = e.target && e.target.closest && e.target.closest('[data-ax-voice]');
    if (!trigger) return;
    e.preventDefault();
    openVoice();
  });

  // Small public API, e.g. AXAssistant.openVoice() from the console or other scripts.
  window.AXAssistant = {
    open: function () { setOpen(true); },
    openVoice: openVoice,
    voiceSupported: VOICE_OK
  };

  // ---------- Mount ----------
  function mount() {
    document.body.appendChild(host);
    renderAll();
    // A link to /#talk opens voice mode directly.
    if (location.hash === '#talk') openVoice();
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
