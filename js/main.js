/* =========================================================
   SITE CONFIG — edit these values, then commit & push.
   ========================================================= */
const SITE = {
  email: 'yanchhuongksign@gmail.com', // e.g. 'hello@yourdomain.com' — used in nav, contact section, and the form
  cvUrl: '',          // e.g. '/assets/Yanchhuong-Suon-CV.pdf' (put the PDF in /assets)
  linkedinUrl: ''     // e.g. 'https://www.linkedin.com/in/your-handle'
};

/* What I do, Technology stack, and Projects & initiatives are written directly in index.html,
   so they are visible to search engines, link previews, and readers without JavaScript.
   Edit them there. */

/* ---------- helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- language: Khmer by default, English on request ----------
   Page text is written twice in index.html, as <span lang="km"> and <span lang="en">;
   css/styles.css hides the language <html lang> isn't set to. Attributes and <title>
   hold Khmer, with the English in data-en-<attr> (data-en-text for <title>). */
const LANG_KEY = 'lang';
const UI = {
  km: { toggle: 'EN', toggleLabel: 'Switch to English', openMenu: 'បើកម៉ឺនុយ', closeMenu: 'បិទម៉ឺនុយ' },
  en: { toggle: 'ខ្មែរ', toggleLabel: 'ប្តូរទៅភាសាខ្មែរ', openMenu: 'Open menu', closeMenu: 'Close menu' }
};
const I18N_ATTRS = ['text', 'placeholder', 'aria-label', 'alt', 'title'];
const currentLang = () => (document.documentElement.lang === 'en' ? 'en' : 'km');
const toKhmerDigits = (s) => String(s).replace(/[0-9]/g, (d) => '០១២៣៤៥៦៧៨៩'[d]);

function applyLang(lang) {
  document.documentElement.lang = lang;
  I18N_ATTRS.forEach((attr) => {
    $$(`[data-en-${attr}]`).forEach((el) => {
      const get = () => (attr === 'text' ? el.textContent : el.getAttribute(attr));
      const set = (v) => { if (attr === 'text') el.textContent = v; else el.setAttribute(attr, v); };
      if (!el.hasAttribute(`data-km-${attr}`)) el.setAttribute(`data-km-${attr}`, get());
      set(el.getAttribute(`data-${lang}-${attr}`));
    });
  });
  const t = UI[lang];
  const btn = $('.lang-toggle');
  if (btn) { btn.textContent = t.toggle; btn.setAttribute('aria-label', t.toggleLabel); btn.title = t.toggleLabel; }
  const menuBtn = $('.nav-toggle');
  if (menuBtn) menuBtn.setAttribute('aria-label', menuBtn.getAttribute('aria-expanded') === 'true' ? t.closeMenu : t.openMenu);
}

function initLang() {
  applyLang(currentLang());
  const btn = $('.lang-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = currentLang() === 'km' ? 'en' : 'km';
    applyLang(next);
    try { localStorage.setItem(LANG_KEY, next); } catch (e) { /* storage blocked: choice lasts for this page view */ }
  });
}

/* ---------- project filter (cards are static HTML in index.html) ---------- */
function initFilter() {
  const wrap = $('#filter-tabs');
  if (!wrap) return;
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-tab');
    if (!btn) return;
    const f = btn.dataset.filter;
    $$('.filter-tab', wrap).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    $$('#projects-grid .project').forEach((card) => { card.hidden = !(f === 'all' || card.dataset.cat === f); });
    btn.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  });
}

/* ---------- mobile nav ---------- */
function initNav() {
  const toggle = $('.nav-toggle');
  const menu = $('#nav-menu');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? UI[currentLang()].closeMenu : UI[currentLang()].openMenu);
    menu.classList.toggle('open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

/* ---------- config-driven links ---------- */
function applyConfig() {
  if (SITE.email) {
    $$('[data-email-text]').forEach((el) => {
      const a = document.createElement('a');
      a.href = `mailto:${SITE.email}`;
      a.textContent = SITE.email;
      if (el.closest('a')) { el.textContent = SITE.email; el.closest('a').href = `mailto:${SITE.email}`; el.closest('a').title = SITE.email; }
      else el.replaceWith(a);
    });
  }
  // CV buttons and the LinkedIn icon are hidden in index.html until their links are set in SITE.
  if (SITE.cvUrl) {
    $$('[data-cv-link]').forEach((a) => { a.href = SITE.cvUrl; a.setAttribute('download', ''); a.hidden = false; });
  }
  const li = $('[data-linkedin-link]');
  if (li && SITE.linkedinUrl) { li.href = SITE.linkedinUrl; li.hidden = false; }
}

/* ---------- share the site link: Telegram, Messenger, or copy ---------- */
const SHARE_UI = {
  km: { copied: 'បានចម្លងតំណ', pasteMessenger: 'បានចម្លងតំណ។ សូមបិទភ្ជាប់វាក្នុង Messenger។', failed: 'មិនអាចចម្លងបានទេ។ តំណ៖ ' },
  en: { copied: 'Link copied', pasteMessenger: 'Link copied. Paste it in Messenger.', failed: 'Couldn’t copy. Link: ' }
};

function initShare() {
  const btn = $('.share-btn');
  const menu = $('#share-menu');
  if (!btn || !menu) return;
  // The shared link is built from the domain the visitor is on (no fixed address), so it follows
  // a custom domain automatically. Always the homepage, not the section the visitor scrolled to.
  const url = location.origin + '/';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const telegramHref = () =>
    'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(document.title);
  $('[data-share="telegram"]', menu).href = telegramHref(); // set right away, so even a long-press/middle-click shares this domain

  let toastEl = null, toastTimer = 0;
  const toast = (msg) => {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'share-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  };

  const copyLink = () => {
    const done = () => true;
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(url).then(done, () => legacyCopy());
    return Promise.resolve(legacyCopy());
  };
  const legacyCopy = () => {
    const ta = document.createElement('textarea');
    ta.value = url; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;opacity:0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  };

  const items = () => $$('.share-item', menu);
  const setOpen = (open, focusFirst) => {
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      // Refresh on open: the page title (sent as the text) follows the current language
      $('[data-share="telegram"]', menu).href = telegramHref();
      if (focusFirst) items()[0].focus();
    }
  };

  btn.addEventListener('click', () => setOpen(menu.hidden, false));
  btn.addEventListener('keydown', (e) => {
    if ((e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') && menu.hidden) { e.preventDefault(); setOpen(true, true); }
  });
  menu.addEventListener('keydown', (e) => {
    const list = items(), i = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); btn.focus(); }
    else if (e.key === 'Tab') setOpen(false);
  });
  document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('.share-wrap')) setOpen(false); });

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.share-item');
    if (!item) return;
    const kind = item.dataset.share;
    const t = SHARE_UI[currentLang()];
    setOpen(false);
    if (kind === 'telegram') return; // the link opens Telegram's share page in a new tab
    e.preventDefault();
    if (kind === 'copy') {
      copyLink().then((ok) => toast(ok ? t.copied : t.failed + url));
    } else if (kind === 'messenger') {
      if (isMobile) {
        // Opens the Messenger app's share screen; if the app isn't installed, nothing opens, so copy as a fallback
        location.href = 'fb-messenger://share/?link=' + encodeURIComponent(url);
        setTimeout(() => { if (!document.hidden) copyLink().then((ok) => toast(ok ? t.pasteMessenger : t.failed + url)); }, 1500);
      } else {
        // Messenger has no public share link on desktop: copy the link and open Messenger to paste it
        copyLink().then((ok) => toast(ok ? t.pasteMessenger : t.failed + url));
        window.open('https://www.messenger.com/', '_blank', 'noopener');
      }
    }
  });
}

/* The contact form is handled by /contact-form.js, which sends it to Telegram via n8n. */

document.addEventListener('DOMContentLoaded', () => {
  initLang();
  initFilter();
  initNav();
  initShare();
  applyConfig();
  const year = new Date().getFullYear();
  $$('[data-year]').forEach((el) => { el.textContent = el.closest('[lang]').lang === 'km' ? toKhmerDigits(year) : year; });
});
