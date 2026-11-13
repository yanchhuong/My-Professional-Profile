/* =========================================================
   SITE CONFIG — edit these values, then commit & push.
   ========================================================= */
const SITE = {
  email: '',          // e.g. 'hello@yourdomain.com' — used in nav, contact section, and the form
  cvUrl: '',          // e.g. '/assets/Yanchhuong-Suon-CV.pdf' (put the PDF in /assets)
  linkedinUrl: ''     // e.g. 'https://www.linkedin.com/in/your-handle'
};

const services = [
  { num: '01', title: 'Software engineering', text: 'Enterprise applications, system architecture, database design, API development and integration, and cloud deployment.' },
  { num: '02', title: 'Business & product', text: 'Project management, product strategy, business process analysis, and ERP, HRMS, and accounting systems.' },
  { num: '03', title: 'AI & innovation', text: 'AI agents, RAG, vision AI, MCP, and workflow automation that take manual work out of business processes.' },
  { num: '04', title: 'Entrepreneurship', text: 'SaaS business models, product innovation, business strategy, and creative marketing for new digital products.' }
];

const skillGroups = [
  { title: 'Backend', items: ['Java', 'Spring Boot', 'Python', 'FastAPI'] },
  { title: 'Frontend', items: ['React', 'JavaScript', 'Tailwind CSS'] },
  { title: 'Database', items: ['PostgreSQL', 'Firebase'] },
  { title: 'Infrastructure', items: ['Docker', 'Linux', 'Nginx'] },
  { title: 'Cloud & hosting', items: ['DigitalOcean', 'Vercel', 'Cloudflare'] },
  { title: 'AI', items: ['OpenAI', 'Claude', 'RAG', 'Vision AI'] },
  { title: 'Automation', items: ['n8n', 'MCP', 'Telegram bots'] }
];

const categories = [
  { id: 'all', label: 'All' },
  { id: 'platform', label: 'Business platforms' },
  { id: 'fintech', label: 'Banking & FinTech' },
  { id: 'ai', label: 'AI & automation' }
];

const projects = [
  { mono: 'HR', title: 'HR-Share / smartHRMS', cat: 'platform', status: 'In development', text: 'An integrated business management ecosystem for Cambodian SMEs, enterprises, and institutions, run from one scalable platform.', areas: ['HR & attendance', 'Payroll', 'Accounting', 'POS & inventory', 'Approval workflows', 'AI assistance'] },
  { mono: 'AI', title: 'AI Business Assistant', cat: 'ai', status: 'Exploring', text: 'AI assistants that help organizations find knowledge, understand documents, automate workflows, and make better decisions.', areas: ['AI agents', 'RAG', 'Document search', 'Knowledge management'] },
  { mono: 'FT', title: 'Accounting & FinTech Solutions', cat: 'fintech', status: 'Exploring', text: 'Digital financial platforms that connect business accounting, payments, financial management, and banking services.', areas: ['Invoicing & billing', 'Financial reporting', 'Payments', 'Banking integration', 'Currency exchange'] },
  { mono: 'EA', title: 'Enterprise AI & Digital Transformation', cat: 'ai', status: 'Exploring', text: 'Enterprise AI that improves how organizations manage knowledge and run day-to-day operations.', areas: ['Policy & guideline search', 'Knowledge assistants', 'Document management', 'Automation'] },
  { mono: 'MK', title: 'AI Content & Marketing Automation', cat: 'ai', status: 'Exploring', text: 'AI-powered creative production and automated digital marketing workflows.', areas: ['AI marketing content', 'Social media automation', 'Telegram automation', 'AI video'] },
  { mono: 'WL', title: 'WELOAN-NH', cat: 'fintech', status: 'Client project', text: 'Banking and lending platform with a customer mobile app, back-office system, and weekly reporting workflow.', areas: ['Mobile app', 'Back-office', 'Lending', 'Reporting'] },
  { mono: 'KB', title: 'KB PRASAC CRM', cat: 'fintech', status: 'Client project', text: 'CRM solution demo prepared for a banking client, covering customer and sales workflows.', areas: ['CRM', 'Banking', 'Sales workflows'] },
  { mono: 'WB', title: 'WeBill365', cat: 'fintech', status: 'Product', text: 'Bill payment platform: biller tracking and reporting, plus the product pitch for partners.', areas: ['Bill payment', 'Reporting', 'Partnerships'] },
  { mono: 'CV', title: 'CV Parsing System', cat: 'ai', status: 'Internal tool', text: 'AI-based CV extraction for HR recruitment, using a local LLM with a Java Spring backend.', areas: ['Local LLM', 'Java Spring', 'HR tech'] },
  { mono: 'JV', title: 'Jarvis Assistant', cat: 'ai', status: 'Personal tool', text: 'Personal AI assistant on n8n for tasks, reports, project status, and a weekday morning brief.', areas: ['n8n', 'MCP', 'Telegram bot'] },
  { mono: 'EL', title: 'E-Learning Platform', cat: 'platform', status: 'Prototype', text: 'Learning platform prototype, taken from a web prototype to a mobile-optimized SPA.', areas: ['React', 'Tailwind CSS', 'Mobile SPA'] }
];

/* ---------- helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- render sections ---------- */
function renderServices() {
  $('#services-grid').innerHTML = services.map((s) => `
    <div class="service">
      <div class="service-num">${esc(s.num)}</div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
    </div>`).join('');
}

function renderSkills() {
  $('#skills-grid').innerHTML = skillGroups.map((g) => `
    <div class="skill-card">
      <h3>${esc(g.title)}</h3>
      <div class="tag-row">${g.items.map((it) => `<span class="tag">${esc(it)}</span>`).join('')}</div>
    </div>`).join('');
}

const labelOf = Object.fromEntries(categories.map((c) => [c.id, c.label]));

function renderProjects(filter) {
  const shown = projects.filter((p) => filter === 'all' || p.cat === filter);
  $('#projects-grid').innerHTML = shown.map((p) => `
    <article class="project">
      <div class="project-cover">
        <span class="project-mono" aria-hidden="true">${esc(p.mono)}</span>
        <span class="project-status">${esc(p.status)}</span>
      </div>
      <div class="project-body">
        <span class="pill">${esc(labelOf[p.cat])}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.text)}</p>
        <div class="project-areas">${p.areas.map((a) => `<span class="tag tag-sm">${esc(a)}</span>`).join('')}</div>
      </div>
    </article>`).join('');
}

function renderTabs() {
  const wrap = $('#filter-tabs');
  wrap.innerHTML = categories.map((c, i) =>
    `<button type="button" class="filter-tab" data-filter="${c.id}" aria-pressed="${i === 0}">${esc(c.label)}</button>`
  ).join('');
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-tab');
    if (!btn) return;
    $$('.filter-tab', wrap).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    btn.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    renderProjects(btn.dataset.filter);
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
  $$('[data-cv-link]').forEach((a) => {
    if (SITE.cvUrl) { a.href = SITE.cvUrl; a.setAttribute('download', ''); }
    else a.href = '#contact';
  });
  const li = $('[aria-label="LinkedIn"]');
  if (li) {
    if (SITE.linkedinUrl) { li.href = SITE.linkedinUrl; li.target = '_blank'; li.rel = 'noopener'; }
    else li.remove();
  }
}

/* ---------- contact form (opens the visitor's email app) ---------- */
function initForm() {
  const form = $('#contact-form');
  const status = $('#form-status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.classList.remove('error');
    let firstBad = null;
    ['cf-name', 'cf-email', 'cf-msg'].forEach((id) => {
      const el = $('#' + id);
      const ok = el.value.trim() !== '' && (el.type !== 'email' || el.checkValidity());
      el.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstBad) firstBad = el;
    });
    if (firstBad) {
      status.textContent = 'Please fill in your name, a valid email, and a message.';
      status.classList.add('error');
      firstBad.focus();
      return;
    }
    if (!SITE.email) {
      status.textContent = 'Contact email is not configured yet.';
      status.classList.add('error');
      return;
    }
    const name = $('#cf-name').value.trim();
    const from = $('#cf-email').value.trim();
    const msg = $('#cf-msg').value.trim();
    const subject = encodeURIComponent(`Project inquiry from ${name}`);
    const body = encodeURIComponent(`${msg}\n\n— ${name} (${from})`);
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
    status.textContent = 'Opening your email app…';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderServices();
  renderSkills();
  renderTabs();
  renderProjects('all');
  initNav();
  applyConfig();
  initForm();
  $('#year').textContent = new Date().getFullYear();
});
