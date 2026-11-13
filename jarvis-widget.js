/*!
 * AX chat + voice widget for profile-indol-iota-89.vercel.app
 * Drop-in, no build step. Add before </body>:
 *   <script src="/jarvis-widget.js" defer></script>
 *
 * Optional attributes on the <script> tag:
 *   data-name="AX"
 *   data-endpoint="https://ai-ax.app.n8n.cloud/webhook/jarvis-public"
 *   data-avatar="/assets/profile-new.jpg"
 *   data-contact="#contact"
 *   data-voice="off"            (hide the microphone button)
 */
(function () {
  'use strict';
  if (window.__jarvisWidget) return;
  window.__jarvisWidget = true;
 
  // ---------- Config ----------
  const tag = document.currentScript;
  const ds = (tag && tag.dataset) || {};
  const NAME = ds.name || 'AX';
  const CFG = {
    endpoint: ds.endpoint || 'https://ai-ax.app.n8n.cloud/webhook/jarvis-public',
    avatar: ds.avatar || '/assets/profile-new.jpg',
    contact: ds.contact || '#contact'
  };
  const MAX_LEN = 1000;
  const TIMEOUT_MS = 30000;
  const VOICE_TIMEOUT_MS = 45000;
  const MAX_STORED = 40;
  const STORE_KEY = 'jarvis_chat_v1';
  const NOTICE_KEY = 'jarvis_voice_notice_v1';
  const VOICE = {
    rate: 16000,        // sample rate sent for transcription
    maxMs: 30000,       // longest single utterance
    endSilenceMs: 1200, // pause that ends a turn
    noSpeechMs: 9000,   // stop listening if nobody talks
    minSpeechMs: 350,   // ignore clicks and coughs
    preRollMs: 350,     // keep audio just before speech starts
    startMs: 140        // loudness must last this long to count as speech
  };
 
  // Copy follows <html lang>: Khmer when it is "km", English otherwise (see applyCopy).
  const COPIES = {};
  COPIES.en = {
    launcher: 'Ask ' + NAME,
    title: NAME,
    subtitle: 'AI assistant for Yanchhuong',
    greeting:
      "Hi, I'm " + NAME + ", Yanchhuong's AI assistant. Ask me about his work, or leave a message and I'll pass it to him. You can type or tap the mic to talk.\n" +
      '\u179f\u17bd\u179f\u17d2\u178f\u17b8! \u17a2\u17d2\u1793\u1780\u17a2\u17b6\u1785\u179f\u17bd\u179a\u1781\u17d2\u1789\u17bb\u17c6\u1787\u17b6\u1797\u17b6\u179f\u17b6\u1781\u17d2\u1798\u17c2\u179a \u17ac\u17a2\u1784\u17cb\u1782\u17d2\u179b\u17c1\u179f\u17d4',
    suggestions: [
      'What do you work on?',
      'Can you help with my project?',
      "I'd like to book a meeting",
      'How do I contact Yanchhuong?',
      '\u178f\u17be\u179b\u17c4\u1780\u1792\u17d2\u179c\u17be\u1780\u17b6\u179a\u1784\u17b6\u179a\u17a2\u17d2\u179c\u17b8\u1781\u17d2\u179b\u17c7?'
    ],
    placeholder: 'Type your question\u2026',
    send: 'Send',
    close: 'Close chat',
    reset: 'New chat',
    typing: NAME + ' is typing',
    disclaimer: NAME + ' is an AI and can make mistakes.',
    errNetwork: NAME + " couldn't reply. Check your connection and try again.",
    errTimeout: NAME + ' took too long to reply. Try again in a moment.',
    errOrigin: 'This chat only works on the official site.',
    errGeneric: NAME + " couldn't reply right now.",
    contactLink: 'Use the contact form instead',
    // Voice
    micLabel: 'Talk to ' + NAME,
    voiceEnd: 'End voice chat',
    listening: 'Listening\u2026',
    listeningHint: 'Tap to send now',
    thinking: 'Thinking\u2026',
    speaking: 'Speaking\u2026',
    speakingHint: 'Tap to interrupt',
    starting: 'Starting microphone\u2026',
    voiceFooter: 'Talk naturally. Pause when you finish and ' + NAME + ' will answer.',
    voiceNotice: 'Voice works in English for now. It is processed by AI to reply to you, and recordings are not saved.',
    micDenied: 'Microphone access is blocked. Allow it in your browser settings, or type your message.',
    micUnavailable: 'No microphone was found. Please type your message.',
    noSpeech: "I didn't hear anything, so I stopped listening. Tap the mic when you're ready.",
    notHeardTwice: "I'm having trouble hearing you. Try again closer to the microphone, or type your message.",
    voiceError: "Voice didn't work this time. Try again, or type your message.",
    // Limits
    voiceLimitLabel: "Voice limit reached for today. You can keep typing.",
    chatLimitPlaceholder: 'Daily chat limit reached',
    chatLimitFoot: 'Chat is paused for today. You can still use the contact form.'
  };
  COPIES.km = {
    launcher: 'សួរ ' + NAME,
    title: NAME,
    subtitle: 'ជំនួយការ AI របស់ Yanchhuong',
    greeting:
      'សួស្តី! ខ្ញុំជា ' + NAME + ' ជំនួយការ AI របស់ Yanchhuong។ អ្នកអាចសួរខ្ញុំអំពីការងាររបស់គាត់ ឬទុកសារ ហើយខ្ញុំនឹងបញ្ជូនទៅគាត់។ អ្នកអាចវាយអក្សរ ឬចុចមីក្រូហ្វូនដើម្បីនិយាយ។\n' +
      'You can also ask me in English.',
    suggestions: [
      'តើលោកធ្វើការងារអ្វីខ្លះ?',
      'អាចជួយគម្រោងរបស់ខ្ញុំបានទេ?',
      'ខ្ញុំចង់ណាត់ជួប',
      'តើទាក់ទង Yanchhuong ដោយរបៀបណា?',
      'What do you work on?'
    ],
    placeholder: 'វាយសំណួររបស់អ្នក…',
    send: 'ផ្ញើ',
    close: 'បិទការជជែក',
    reset: 'ជជែកថ្មី',
    typing: NAME + ' កំពុងវាយ',
    disclaimer: NAME + ' គឺជា AI ហើយអាចមានកំហុស។',
    errNetwork: NAME + ' មិនអាចឆ្លើយតបបានទេ។ សូមពិនិត្យការតភ្ជាប់ ហើយព្យាយាមម្តងទៀត។',
    errTimeout: NAME + ' ឆ្លើយតបយឺតពេក។ សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀត។',
    errOrigin: 'ការជជែកនេះដំណើរការតែនៅលើគេហទំព័រផ្លូវការប៉ុណ្ណោះ។',
    errGeneric: NAME + ' មិនអាចឆ្លើយតបបាននៅពេលនេះទេ។',
    contactLink: 'ប្រើទម្រង់ទំនាក់ទំនងជំនួសវិញ',
    // Voice
    micLabel: 'និយាយជាមួយ ' + NAME,
    voiceEnd: 'បញ្ចប់ការជជែកជាសំឡេង',
    listening: 'កំពុងស្តាប់…',
    listeningHint: 'ចុចដើម្បីផ្ញើឥឡូវនេះ',
    thinking: 'កំពុងគិត…',
    speaking: 'កំពុងនិយាយ…',
    speakingHint: 'ចុចដើម្បីបញ្ឈប់',
    starting: 'កំពុងបើកមីក្រូហ្វូន…',
    voiceFooter: 'និយាយធម្មតា។ ឈប់បន្តិចពេលនិយាយចប់ ហើយ ' + NAME + ' នឹងឆ្លើយតប។',
    voiceNotice: 'បច្ចុប្បន្ន ការនិយាយជាសំឡេងប្រើបានតែជាភាសាអង់គ្លេសប៉ុណ្ណោះ។ សំឡេងរបស់អ្នកត្រូវបានដំណើរការដោយ AI ដើម្បីឆ្លើយតប ហើយមិនត្រូវបានរក្សាទុកទេ។',
    micDenied: 'មីក្រូហ្វូនត្រូវបានរារាំង។ សូមអនុញ្ញាតនៅក្នុងការកំណត់កម្មវិធីរុករក ឬវាយសាររបស់អ្នក។',
    micUnavailable: 'រកមិនឃើញមីក្រូហ្វូនទេ។ សូមវាយសាររបស់អ្នក។',
    noSpeech: 'ខ្ញុំមិនឮអ្វីទេ ដូច្នេះខ្ញុំបានឈប់ស្តាប់។ ចុចមីក្រូហ្វូនពេលអ្នករួចរាល់។',
    notHeardTwice: 'ខ្ញុំស្តាប់អ្នកមិនសូវឮទេ។ សូមព្យាយាមម្តងទៀតឱ្យជិតមីក្រូហ្វូន ឬវាយសាររបស់អ្នក។',
    voiceError: 'ការនិយាយជាសំឡេងមិនដំណើរការលើកនេះទេ។ សូមព្យាយាមម្តងទៀត ឬវាយសាររបស់អ្នក។',
    // Limits
    voiceLimitLabel: 'អស់ចំនួនប្រើសំឡេងសម្រាប់ថ្ងៃនេះហើយ។ អ្នកនៅតែអាចវាយសារបាន។',
    chatLimitPlaceholder: 'អស់ចំនួនជជែកប្រចាំថ្ងៃហើយ',
    chatLimitFoot: 'ការជជែកត្រូវបានផ្អាកសម្រាប់ថ្ងៃនេះ។ អ្នកនៅតែអាចប្រើទម្រង់ទំនាក់ទំនងបាន។'
  };
  const pageLang = function () { return document.documentElement.lang === 'km' ? 'km' : 'en'; };
  let COPY = COPIES[pageLang()];
 
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
    clear() { try { sessionStorage.removeItem(STORE_KEY); } catch (e) {} },
    flag(key) { try { return sessionStorage.getItem(key) === '1'; } catch (e) { return false; } },
    setFlag(key) { try { sessionStorage.setItem(key, '1'); } catch (e) {} }
  };
 
  function newSessionId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
 
  // ---------- Daily limits (mirrors the server's limits so the UI can switch off) ----------
  // The server answers 429 with error "voice_limit" (voice only) or "rate_limited" (all chat).
  // We remember that for the rest of the day (Phnom Penh time, same as the server) in this tab.
  const LIMIT_KEY = 'jarvis_limits_v1';
  function limitDay() {
    try { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Phnom_Penh' }); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  const limits = (function () {
    try {
      const l = JSON.parse(sessionStorage.getItem(LIMIT_KEY));
      if (l && l.day === limitDay()) return { day: l.day, chat: !!l.chat, voice: !!l.voice };
    } catch (e) {}
    return { day: limitDay(), chat: false, voice: false };
  })();
  function saveLimits() { try { sessionStorage.setItem(LIMIT_KEY, JSON.stringify(limits)); } catch (e) {} }
  function clearLimits() {
    limits.day = limitDay(); limits.chat = false; limits.voice = false;
    try { sessionStorage.removeItem(LIMIT_KEY); } catch (e) {}
  }
  function freshLimits() { if (limits.day !== limitDay()) clearLimits(); }
  function chatOff() { freshLimits(); return limits.chat; }
  function voiceOff() { freshLimits(); return limits.chat || limits.voice; }

  const saved = store.load();
  const state = {
    sessionId: (saved && saved.sessionId) || newSessionId(),
    open: false,
    messages: (saved && Array.isArray(saved.messages)) ? saved.messages : [],
    busy: false
  };
 
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const VOICE_SUPPORTED = ds.voice !== 'off' && !!(window.isSecureContext && navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia && AudioCtx);
 
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
.msg.note { align-self: center; max-width: 92%; padding: 4px 8px; font-size: 13px; color: var(--jv-muted); text-align: center; }
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
  display: flex; align-items: flex-end; gap: 6px;
  background: #FFFFFF; border: 1px solid var(--jv-line); border-radius: 14px;
  padding: 6px 6px 6px 12px;
}
.field[hidden] { display: none; }
.field:focus-within { border-color: var(--jv-ink); box-shadow: 0 0 0 2px var(--jv-focus); }
textarea {
  flex: 1; resize: none; border: 0; outline: 0; background: transparent;
  font: inherit; font-size: 15px; color: var(--jv-text);
  line-height: 1.45; max-height: 7.5em; padding: 6px 0;
}
textarea::placeholder { color: var(--jv-muted); }
textarea:disabled { cursor: not-allowed; }
.field.off { background: var(--jv-bot); }
.field.off textarea::placeholder { color: var(--jv-error); }
.chip:disabled { opacity: .45; cursor: not-allowed; }
.send, .mic {
  flex: none; width: 38px; height: 38px; border-radius: 10px;
  display: grid; place-items: center; cursor: pointer;
}
.send { border: 0; background: var(--jv-ink); color: var(--jv-on-ink); }
.send:hover:not(:disabled) { background: var(--jv-ink-hover); }
.send:disabled { opacity: .4; cursor: not-allowed; }
.mic { border: 1px solid var(--jv-line); background: transparent; color: var(--jv-ink); }
.mic:hover:not(:disabled) { border-color: var(--jv-ink); background: var(--jv-bot); }
.mic:disabled { opacity: .4; cursor: not-allowed; }
.mic[hidden] { display: none; }
.send svg, .mic svg { width: 18px; height: 18px; }
.meta { display: flex; justify-content: space-between; gap: 8px; margin-top: 6px; font-size: 12px; color: var(--jv-muted); }
.count.over { color: var(--jv-error); font-weight: 600; }
 
/* Voice bar */
.voice { display: flex; align-items: stretch; gap: 6px; }
.voice[hidden] { display: none; }
.vbar {
  flex: 1; display: flex; align-items: center; gap: 12px;
  min-height: 52px; padding: 8px 14px;
  border: 1px solid var(--jv-ink); border-radius: 14px;
  background: #FFFFFF; color: var(--jv-text);
  font: inherit; font-size: 15px; text-align: left; cursor: pointer;
}
.vbar:disabled { cursor: default; }
.vtext { display: flex; flex-direction: column; line-height: 1.3; }
.vtext b { font-weight: 600; }
.vtext span { font-size: 12px; color: var(--jv-muted); }
.meter { flex: none; display: inline-flex; align-items: center; gap: 3px; height: 26px; width: 31px; }
.meter i { display: block; width: 4px; height: 6px; border-radius: 2px; background: var(--jv-ink); transition: height .08s linear; }
.vbar.thinking .meter i { opacity: .35; animation: jv-wait 1.2s infinite ease-in-out; }
.vbar.speaking .meter i { animation: jv-talk .9s infinite ease-in-out; }
.meter i:nth-child(2) { animation-delay: .12s; }
.meter i:nth-child(3) { animation-delay: .24s; }
.meter i:nth-child(4) { animation-delay: .36s; }
.meter i:nth-child(5) { animation-delay: .48s; }
@keyframes jv-talk { 0%, 100% { height: 6px; } 50% { height: 22px; } }
@keyframes jv-wait { 0%, 100% { opacity: .25; } 50% { opacity: .7; } }
.vend {
  flex: none; width: 52px; border: 1px solid var(--jv-line); border-radius: 14px;
  background: transparent; color: var(--jv-ink); cursor: pointer;
  display: grid; place-items: center;
}
.vend:hover { border-color: var(--jv-error); color: var(--jv-error); }
.vend svg { width: 18px; height: 18px; }
 
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
  .typing i, .meter i { animation: none !important; }
  .typing i { opacity: .7; }
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
    img.onerror = function () { a.textContent = NAME.charAt(0); };
    img.src = CFG.avatar;
    return a;
  }
  const ICON = {
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    send: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'
  };
 
  // ---------- Build UI ----------
  const host = el('div', { id: 'jarvis-widget' });
  const shadow = host.attachShadow({ mode: 'open' });
  const style = el('style', { text: CSS });
  const root = el('div', { class: 'root' });
 
  const launcherLabel = el('span', { text: COPY.launcher });
  const launcher = el('button', { class: 'launcher', type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' },
    [avatar(false), launcherLabel]);
 
  const resetBtn = el('button', { class: 'icon-btn', type: 'button', text: COPY.reset });
  const closeBtn = el('button', { class: 'icon-btn', type: 'button', 'aria-label': COPY.close }, [svg(ICON.close)]);
 
  const titleEl = el('strong', { id: 'jv-title', text: COPY.title });
  const subtitleEl = el('span', { text: COPY.subtitle });
  const header = el('div', { class: 'header' }, [
    avatar(true),
    el('div', { class: 'who' }, [titleEl, subtitleEl]),
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
  const micBtn = el('button', { class: 'mic', type: 'button', 'aria-label': COPY.micLabel, title: COPY.micLabel }, [svg(ICON.mic)]);
  if (!VOICE_SUPPORTED) micBtn.hidden = true;
  const sendBtn = el('button', { class: 'send', type: 'button', 'aria-label': COPY.send, disabled: '' }, [svg(ICON.send)]);
  const field = el('div', { class: 'field' }, [input, micBtn, sendBtn]);
 
  // Voice bar
  const meterBars = [el('i'), el('i'), el('i'), el('i'), el('i')];
  const vLabel = el('b', { text: COPY.listening });
  const vHint = el('span', { text: COPY.listeningHint });
  const vbar = el('button', { class: 'vbar', type: 'button' }, [
    el('span', { class: 'meter', 'aria-hidden': 'true' }, meterBars),
    el('span', { class: 'vtext' }, [vLabel, vHint])
  ]);
  const vend = el('button', { class: 'vend', type: 'button', 'aria-label': COPY.voiceEnd, title: COPY.voiceEnd }, [svg(ICON.close)]);
  const voiceRow = el('div', { class: 'voice', hidden: '' }, [vbar, vend]);
 
  const count = el('span', { class: 'count', 'aria-live': 'polite' });
  const footNote = el('span', { text: COPY.disclaimer });
 
  const composer = el('div', { class: 'composer' }, [
    field,
    voiceRow,
    el('div', { class: 'meta' }, [footNote, count])
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
    const cls = m.role === 'user' ? 'user' : (m.role === 'note' ? 'note' : 'bot');
    return el('div', { class: 'msg ' + cls, text: m.text });
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
    if (!hasUserMsg && !chatOff()) log.appendChild(renderChips());
    scrollDown();
  }
 
  function addMessage(role, text) {
    const m = { role: role, text: text };
    state.messages.push(m);
    const chips = log.querySelector('.chips');
    if (chips && role !== 'note') chips.remove();
    if (typingNode) log.insertBefore(renderMessage(m), typingNode);
    else log.appendChild(renderMessage(m));
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
    sendBtn.disabled = state.busy || len === 0 || over || chatOff();
    micBtn.disabled = state.busy || voiceOff();
    count.textContent = input.value.length > MAX_LEN - 200 ? input.value.length + ' / ' + MAX_LEN : '';
    count.classList.toggle('over', over);
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }
 
  // Switches the composer on or off to match the daily limits.
  function applyLimits() {
    const noChat = chatOff();
    const noVoice = voiceOff();
    input.disabled = noChat;
    input.placeholder = noChat ? COPY.chatLimitPlaceholder : COPY.placeholder;
    field.classList.toggle('off', noChat);
    micBtn.setAttribute('aria-label', noVoice ? COPY.voiceLimitLabel : COPY.micLabel);
    micBtn.title = noVoice ? COPY.voiceLimitLabel : COPY.micLabel;
    Array.prototype.forEach.call(log.querySelectorAll('.chip'), function (c) { c.disabled = noChat; });
    if (!voice.active) footNote.textContent = noChat ? COPY.chatLimitFoot : COPY.disclaimer;
    updateComposer();
  }

  // Called when the server says a limit was reached.
  function hitLimit(errorCode) {
    freshLimits();
    if (errorCode === 'voice_limit') limits.voice = true;
    else limits.chat = true;
    saveLimits();
    if (voice.active) stopVoice();
    applyLimits();
  }

  // ---------- Open / close ----------
  function setOpen(open) {
    state.open = open;
    panel.hidden = !open;
    launcher.hidden = open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      renderAll();
      applyLimits();
      setTimeout(function () { input.focus(); }, 30);
    } else {
      stopVoice();
      launcher.focus();
    }
  }
 
  // ---------- Network ----------
  async function post(payload, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, timeoutMs);
    try {
      const res = await fetch(CFG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ session_id: state.sessionId, page: location.pathname }, payload)),
        signal: controller.signal
      });
      let data = null;
      try { data = await res.json(); } catch (e) { data = null; }
      return { res: res, data: data };
    } finally {
      clearTimeout(timer);
    }
  }
 
  async function send(text) {
    const message = String(text || '').trim();
    if (!message || state.busy || message.length > MAX_LEN || chatOff()) return;
    let limitCode = '';
 
    state.busy = true;
    addMessage('user', message);
    input.value = '';
    updateComposer();
    setTyping(true);
 
    try {
      const r = await post({ message: message }, TIMEOUT_MS);
      if (r.res.ok && r.data && r.data.reply) {
        addMessage('bot', r.data.reply);
      } else if (r.data && r.data.reply) {
        addMessage(r.res.status === 429 ? 'error' : 'bot', r.data.reply);
        if (r.res.status === 429) limitCode = r.data.error || 'rate_limited';
      } else if (r.res.status === 403) {
        addMessage('error', COPY.errOrigin);
      } else {
        addMessage('error', COPY.errGeneric);
      }
    } catch (err) {
      addMessage('error', err && err.name === 'AbortError' ? COPY.errTimeout : COPY.errNetwork);
    } finally {
      setTyping(false);
      state.busy = false;
      if (limitCode) hitLimit(limitCode);
      updateComposer();
      if (!chatOff()) input.focus();
    }
  }
 
  // ---------- Voice: audio helpers ----------
  function downsample(buf, inRate, outRate) {
    if (outRate >= inRate) return buf;
    const ratio = inRate / outRate;
    const len = Math.floor(buf.length / ratio);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.min(buf.length, Math.floor((i + 1) * ratio));
      let sum = 0;
      for (let j = start; j < end; j++) sum += buf[j];
      out[i] = sum / Math.max(1, end - start);
    }
    return out;
  }
 
  function encodeWav(samples, rate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const v = new DataView(buffer);
    const w = function (o, s) { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVE');
    w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  }
 
  function toBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  }
 
  function fromBase64(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }
 
  function decodeAudio(ctx, buffer) {
    return new Promise(function (resolve, reject) {
      const p = ctx.decodeAudioData(buffer, resolve, reject); // callback form for older Safari
      if (p && p.then) p.then(resolve, reject);
    });
  }
 
  // ---------- Voice: conversation loop ----------
  const voice = {
    active: false, phase: 'off',
    stream: null, ctx: null, source: null, proc: null, sink: null, player: null,
    chunks: [], preRoll: [], preRollMs: 0,
    speech: false, loudMs: 0, speechMs: 0, quietMs: 0, totalMs: 0, startedAt: 0,
    noiseSum: 0, noiseCount: 0, threshold: 0.02,
    notHeard: 0, meterRaf: 0, level: 0
  };
 
  function setPhase(phase) {
    voice.phase = phase;
    vbar.classList.toggle('thinking', phase === 'thinking' || phase === 'starting');
    vbar.classList.toggle('speaking', phase === 'speaking');
    vbar.disabled = !(phase === 'listening' || phase === 'speaking');
    const map = {
      starting: [COPY.starting, ''],
      listening: [COPY.listening, voice.speech ? COPY.listeningHint : ''],
      thinking: [COPY.thinking, ''],
      speaking: [COPY.speaking, COPY.speakingHint]
    };
    const t = map[phase] || ['', ''];
    vLabel.textContent = t[0];
    vHint.textContent = t[1];
    status.textContent = t[0];
    if (phase !== 'listening') meterBars.forEach(function (b) { b.style.height = ''; });
  }
 
  function showVoiceUI(on) {
    field.hidden = on;
    voiceRow.hidden = !on;
    footNote.textContent = on ? COPY.voiceFooter : COPY.disclaimer;
    count.textContent = '';
  }
 
  function drawMeter() {
    voice.meterRaf = 0;
    if (voice.phase !== 'listening') return;
    const lvl = Math.min(1, voice.level / (voice.threshold * 4));
    const shape = [0.55, 0.85, 1, 0.8, 0.5];
    meterBars.forEach(function (b, i) {
      b.style.height = Math.round(6 + lvl * 18 * shape[i] * (0.8 + Math.random() * 0.4)) + 'px';
    });
  }
 
  async function startVoice() {
    if (voice.active || state.busy || !VOICE_SUPPORTED || voiceOff()) return;
    voice.active = true;
    voice.notHeard = 0;
    showVoiceUI(true);
    setPhase('starting');
 
    if (!store.flag(NOTICE_KEY)) {
      addMessage('note', COPY.voiceNotice);
      store.setFlag(NOTICE_KEY);
    }
 
    try {
      // AudioContext is created inside the tap so iOS allows playback later
      voice.ctx = new AudioCtx();
      if (voice.ctx.state === 'suspended') await voice.ctx.resume();
      voice.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }
      });
    } catch (err) {
      const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      stopVoice();
      addMessage('error', denied ? COPY.micDenied : COPY.micUnavailable);
      return;
    }
    if (!voice.active) { stopVoice(); return; } // ended while waiting for permission
 
    voice.source = voice.ctx.createMediaStreamSource(voice.stream);
    voice.proc = voice.ctx.createScriptProcessor(4096, 1, 1);
    voice.sink = voice.ctx.createGain();
    voice.sink.gain.value = 0; // process audio without playing the mic back
    voice.source.connect(voice.proc);
    voice.proc.connect(voice.sink);
    voice.sink.connect(voice.ctx.destination);
    voice.proc.onaudioprocess = onAudio;
    listen();
  }
 
  function listen() {
    if (!voice.active) return;
    voice.chunks = [];
    voice.preRoll = [];
    voice.preRollMs = 0;
    voice.speech = false;
    voice.loudMs = 0;
    voice.speechMs = 0;
    voice.quietMs = 0;
    voice.totalMs = 0;
    voice.noiseSum = 0;
    voice.noiseCount = 0;
    voice.startedAt = Date.now();
    setPhase('listening');
  }
 
  function onAudio(e) {
    if (voice.phase !== 'listening') return;
    const data = e.inputBuffer.getChannelData(0);
    const chunk = new Float32Array(data);
    let sum = 0;
    for (let i = 0; i < chunk.length; i++) sum += chunk[i] * chunk[i];
    const rms = Math.sqrt(sum / chunk.length);
    const ms = (chunk.length / voice.ctx.sampleRate) * 1000;
    voice.level = rms;
    if (!voice.meterRaf) voice.meterRaf = requestAnimationFrame(drawMeter);
 
    // Learn the room's background noise in the first moments
    if (voice.noiseCount < 4 && !voice.speech) {
      voice.noiseSum += rms;
      voice.noiseCount += 1;
      voice.threshold = Math.min(0.08, Math.max(0.012, (voice.noiseSum / voice.noiseCount) * 3));
    }
 
    if (!voice.speech) {
      voice.preRoll.push(chunk);
      voice.preRollMs += ms;
      while (voice.preRollMs - ms > VOICE.preRollMs && voice.preRoll.length > 1) {
        voice.preRoll.shift();
        voice.preRollMs -= ms;
      }
      if (rms > voice.threshold) {
        voice.loudMs += ms;
        if (voice.loudMs >= VOICE.startMs) {
          voice.speech = true;
          voice.chunks = voice.preRoll.slice();
          voice.speechMs = voice.preRollMs;
          setPhase('listening'); // shows "Tap to send now"
        }
      } else {
        voice.loudMs = 0;
      }
      if (Date.now() - voice.startedAt > VOICE.noSpeechMs) {
        stopVoice();
        addMessage('note', COPY.noSpeech);
      }
      return;
    }
 
    voice.chunks.push(chunk);
    voice.speechMs += ms;
    voice.quietMs = rms < voice.threshold * 0.8 ? voice.quietMs + ms : 0;
    if ((voice.quietMs >= VOICE.endSilenceMs && voice.speechMs >= VOICE.minSpeechMs) || voice.speechMs >= VOICE.maxMs) {
      finishTurn();
    }
  }
 
  function finishTurn() {
    if (voice.phase !== 'listening' || !voice.speech) return;
    setPhase('thinking');
    const total = voice.chunks.reduce(function (n, c) { return n + c.length; }, 0);
    const merged = new Float32Array(total);
    let off = 0;
    voice.chunks.forEach(function (c) { merged.set(c, off); off += c.length; });
    voice.chunks = [];
    voice.preRoll = [];
 
    const pcm = downsample(merged, voice.ctx.sampleRate, VOICE.rate);
    // Gently lift quiet recordings so speech is easier to recognise
    let peak = 0;
    for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
    if (peak > 0 && peak < 0.3) {
      const gain = Math.min(4, 0.9 / peak);
      for (let i = 0; i < pcm.length; i++) pcm[i] *= gain;
    }
    sendVoice(toBase64(encodeWav(pcm, VOICE.rate)));
  }
 
  async function sendVoice(b64) {
    state.busy = true;
    updateComposer();
    setTyping(true);
    let next = 'stop';
    try {
      const r = await post({ mode: 'voice', audio: b64, mimeType: 'audio/wav' }, VOICE_TIMEOUT_MS);
      const d = r.data || {};
      if (!voice.active) return; // visitor ended voice mode while waiting
      if (r.res.ok && d.not_heard) {
        voice.notHeard += 1;
        if (voice.notHeard >= 2) {
          addMessage('note', COPY.notHeardTwice);
        } else {
          addMessage('note', d.reply);
          next = 'listen';
        }
      } else if (r.res.ok && d.reply) {
        voice.notHeard = 0;
        if (d.transcript) addMessage('user', d.transcript);
        setTyping(false);
        addMessage('bot', d.reply);
        next = d.audio ? 'speak' : 'listen';
        if (next === 'speak') {
          state.busy = false;
          updateComposer();
          await speak(d.audio);
          return;
        }
      } else if (d.reply) {
        addMessage(r.res.status === 429 ? 'error' : 'note', d.reply);
        if (r.res.status === 429) hitLimit(d.error || 'voice_limit'); // turns the mic (or all chat) off
      } else if (r.res.status === 403) {
        addMessage('error', COPY.errOrigin);
      } else {
        addMessage('error', COPY.voiceError);
      }
    } catch (err) {
      if (voice.active) addMessage('error', err && err.name === 'AbortError' ? COPY.errTimeout : COPY.voiceError);
    } finally {
      setTyping(false);
      state.busy = false;
      updateComposer();
    }
    if (!voice.active) return;
    if (next === 'listen') setTimeout(listen, 500);
    else if (next === 'stop') stopVoice();
  }
 
  async function speak(b64) {
    if (!voice.active) return;
    setPhase('speaking');
    try {
      const buf = await decodeAudio(voice.ctx, fromBase64(b64));
      if (!voice.active || voice.phase !== 'speaking') return;
      const src = voice.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(voice.ctx.destination);
      src.onended = function () {
        if (voice.player !== src) return;
        voice.player = null;
        if (voice.active && voice.phase === 'speaking') setTimeout(listen, 250);
      };
      voice.player = src;
      src.start(0);
    } catch (e) {
      if (voice.active) setTimeout(listen, 400); // reply is already shown as text
    }
  }
 
  function interrupt() {
    if (voice.player) {
      const p = voice.player;
      voice.player = null;
      try { p.onended = null; p.stop(0); } catch (e) {}
    }
    listen();
  }
 
  function stopVoice() {
    const wasActive = voice.active;
    voice.active = false;
    voice.phase = 'off';
    if (voice.player) { try { voice.player.onended = null; voice.player.stop(0); } catch (e) {} voice.player = null; }
    if (voice.proc) { voice.proc.onaudioprocess = null; try { voice.proc.disconnect(); } catch (e) {} }
    if (voice.source) { try { voice.source.disconnect(); } catch (e) {} }
    if (voice.sink) { try { voice.sink.disconnect(); } catch (e) {} }
    if (voice.stream) voice.stream.getTracks().forEach(function (t) { t.stop(); });
    if (voice.ctx && voice.ctx.state !== 'closed') { try { voice.ctx.close(); } catch (e) {} }
    voice.proc = voice.source = voice.sink = voice.stream = voice.ctx = null;
    voice.chunks = [];
    voice.preRoll = [];
    showVoiceUI(false);
    if (chatOff()) footNote.textContent = COPY.chatLimitFoot;
    status.textContent = '';
    if (wasActive && state.open) setTimeout(function () { micBtn.focus(); }, 30);
  }
 
  // ---------- Events ----------
  launcher.addEventListener('click', function () { setOpen(true); });
  closeBtn.addEventListener('click', function () { setOpen(false); });
 
  resetBtn.addEventListener('click', function () {
    if (state.busy) return;
    stopVoice();
    state.sessionId = newSessionId();
    state.messages = [];
    store.clear();
    store.save(state);
    // A new session gets a fresh session allowance; if the daily per-visitor limit
    // still applies, the server says so on the next message and we switch off again.
    clearLimits();
    renderAll();
    applyLimits();
    input.focus();
  });
 
  sendBtn.addEventListener('click', function () { send(input.value); });
  micBtn.addEventListener('click', startVoice);
  vend.addEventListener('click', stopVoice);
  vbar.addEventListener('click', function () {
    if (voice.phase === 'speaking') interrupt();
    else if (voice.phase === 'listening' && voice.speech) finishTurn();
  });
 
  input.addEventListener('input', updateComposer);
  input.addEventListener('keydown', function (e) {
    // isComposing: don't send while typing Khmer/IME text
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send(input.value);
    }
  });
 
  panel.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (voice.active) stopVoice();
      else setOpen(false);
    }
  });
 
  // Page buttons with data-ax-voice (e.g. "Talk to my AI" in the hero) open the chat
  // and start voice right away, or just open the chat when voice isn't available today.
  document.addEventListener('click', function (e) {
    const trigger = e.target && e.target.closest && e.target.closest('[data-ax-voice]');
    if (!trigger) return;
    e.preventDefault();
    if (!state.open) setOpen(true);
    if (VOICE_SUPPORTED && !voiceOff() && !voice.active) startVoice();
  });

  // Never keep the microphone on in a background tab
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && voice.active) stopVoice();
  });
 
  // ---------- Language ----------
  // Re-labels the widget when the page switches language (main.js sets <html lang>).
  // Messages already in the chat stay in the language they were written in.
  function applyCopy() {
    COPY = COPIES[pageLang()];
    launcherLabel.textContent = COPY.launcher;
    titleEl.textContent = COPY.title;
    subtitleEl.textContent = COPY.subtitle;
    resetBtn.textContent = COPY.reset;
    closeBtn.setAttribute('aria-label', COPY.close);
    input.setAttribute('aria-label', COPY.placeholder);
    sendBtn.setAttribute('aria-label', COPY.send);
    vend.setAttribute('aria-label', COPY.voiceEnd);
    vend.title = COPY.voiceEnd;
    renderAll(); // greeting and suggestion chips
    if (typingNode) log.appendChild(typingNode);
    applyLimits(); // placeholder, mic label, footer note
    if (voice.active) {
      setPhase(voice.phase);
      footNote.textContent = COPY.voiceFooter;
    }
  }
  new MutationObserver(applyCopy).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // ---------- Mount ----------
  function mount() {
    document.body.appendChild(host);
    renderAll();
    applyLimits();
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();