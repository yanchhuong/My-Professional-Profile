/*!
 * Contact form -> Telegram, for profile-indol-iota-89.vercel.app
 * Add before </body>:
 *   <script src="/contact-form.js" defer></script>
 *
 * Optional attributes on the <script> tag:
 *   data-endpoint="https://ai-ax.app.n8n.cloud/webhook/jarvis-contact"
 *   data-form="#contact form"   (CSS selector of your form)
 */
(function () {
  'use strict';
  if (window.__jarvisContactForm) return;
  window.__jarvisContactForm = true;

  var tag = document.currentScript;
  var ds = (tag && tag.dataset) || {};
  var ENDPOINT = ds.endpoint || 'https://ai-ax.app.n8n.cloud/webhook/jarvis-contact';
  var FORM_SELECTOR = ds.form || '#contact form';
  var TIMEOUT_MS = 15000;
  var MAX_MESSAGE = 3000;
  var loadedAt = Date.now();

  var COPY = {
    sending: 'Sending…',
    optional: ' (optional)',
    tooLong: 'Please keep your message under 3000 characters.',
    empty: 'Please write a message.',
    network: "Your message couldn't be sent. Check your connection and try again.",
    timeout: 'Sending took too long. Please try again.',
    generic: "Your message couldn't be sent. Please try again in a moment.",
    ok: 'Thanks! Your message has been sent.'
  };

  function init() {
    var form = document.querySelector(FORM_SELECTOR);
    if (!form) {
      console.warn('[contact-form] No form found for selector: ' + FORM_SELECTOR);
      return;
    }

    var nameField = form.querySelector('[name="name"]') || form.querySelector('input[type="text"]');
    var emailField = form.querySelector('input[type="email"]') || form.querySelector('[name="email"]');
    var messageField = form.querySelector('textarea') || form.querySelector('[name="message"]');
    var submitBtn = form.querySelector('button[type="submit"], button:not([type]), input[type="submit"]');

    if (!messageField) {
      console.warn('[contact-form] No message field (textarea) found in the form.');
      return;
    }

    // Name and email are optional, so visitors can write anonymously
    [nameField, emailField].forEach(function (field) {
      if (!field) return;
      field.required = false;
      field.removeAttribute('aria-required');
      var label = field.id ? form.querySelector('label[for="' + field.id + '"]') : field.closest('label');
      if (label && label.textContent.indexOf('optional') === -1) {
        label.appendChild(document.createTextNode(COPY.optional));
      }
    });
    messageField.required = true;
    messageField.setAttribute('maxlength', String(MAX_MESSAGE));

    // Honeypot: invisible to people, bots tend to fill it
    var trap = document.createElement('input');
    trap.type = 'text';
    trap.name = 'website';
    trap.tabIndex = -1;
    trap.autocomplete = 'off';
    trap.setAttribute('aria-hidden', 'true');
    trap.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;';
    form.appendChild(trap);

    // Status line for success and error messages
    var status = form.querySelector('[data-form-status]');
    if (!status) {
      status = document.createElement('p');
      status.setAttribute('data-form-status', '');
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.style.cssText = 'margin:12px 0 0;font:inherit;line-height:1.5;min-height:1.5em;';
      form.appendChild(status);
    }

    function showStatus(text, isError) {
      status.textContent = text;
      status.style.color = isError ? '#9A3B2E' : '#2E6B45';
      status.style.fontWeight = '600';
    }

    var busy = false;
    var originalLabel = submitBtn ? (submitBtn.tagName === 'INPUT' ? submitBtn.value : submitBtn.textContent) : '';

    function setBusy(on) {
      busy = on;
      form.setAttribute('aria-busy', String(on));
      if (!submitBtn) return;
      submitBtn.disabled = on;
      if (submitBtn.tagName === 'INPUT') submitBtn.value = on ? COPY.sending : originalLabel;
      else submitBtn.textContent = on ? COPY.sending : originalLabel;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;

      var message = messageField.value.trim();
      if (!message) { showStatus(COPY.empty, true); messageField.focus(); return; }
      if (message.length > MAX_MESSAGE) { showStatus(COPY.tooLong, true); messageField.focus(); return; }
      if (emailField && emailField.value.trim() && !emailField.checkValidity()) {
        emailField.reportValidity();
        return;
      }

      var payload = {
        name: nameField ? nameField.value.trim() : '',
        email: emailField ? emailField.value.trim() : '',
        message: message,
        page: location.pathname,
        website: trap.value,
        elapsed_ms: Date.now() - loadedAt
      };

      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
      setBusy(true);
      status.textContent = '';

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
        .then(function (res) {
          return res.json().catch(function () { return null; }).then(function (data) {
            return { res: res, data: data };
          });
        })
        .then(function (r) {
          if (r.res.ok && r.data && r.data.ok) {
            showStatus(r.data.reply || COPY.ok, false);
            form.reset();
          } else {
            showStatus((r.data && r.data.reply) || COPY.generic, true);
          }
        })
        .catch(function (err) {
          showStatus(err && err.name === 'AbortError' ? COPY.timeout : COPY.network, true);
        })
        .then(function () {
          clearTimeout(timer);
          setBusy(false);
        });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
