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
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
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
      if (el.closest('a')) { el.textContent = SITE.email; el.closest('a').href = `mailto:${SITE.email}`; }
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

/* The contact form is handled by /contact-form.js, which sends it to Telegram via n8n. */

document.addEventListener('DOMContentLoaded', () => {
  initFilter();
  initNav();
  applyConfig();
  $('#year').textContent = new Date().getFullYear();
});
