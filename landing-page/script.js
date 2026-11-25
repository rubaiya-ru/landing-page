/* StrategyByte landing page
   Everything here runs in the browser only. The sign-up, Book a demo and
   Sign in forms validate input and show a confirmation; they never store
   or send any data. The 3D mascot lives in assets/js/kilo3d.js. */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wait = (ms) => new Promise((r) => window.setTimeout(r, reduceMotion.matches ? 0 : ms));

  /* ---------- Header: solid background once the page scrolls ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('site-menu');
  const toggleLabel = toggle.querySelector('.sr-only');

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? 'Close menu' : 'Open menu';
    menu.classList.toggle('is-open', open);
    header.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a, button')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open') && !document.querySelector('dialog[open]')) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Form helpers (shared by all three forms) ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const messageFor = (input) => {
    const v = input.value.trim();
    if (input.required && !v) return input.dataset.required || 'This field is required.';
    if (input.type === 'email' && v && !EMAIL_RE.test(v)) return 'Please enter a valid email address.';
    if (input.minLength > 0 && v && v.length < input.minLength) return input.dataset.required || 'This entry is too short.';
    if (input.type === 'date' && v && input.min && v < input.min) return 'Please choose a date from today onwards.';
    return '';
  };

  const showError = (input, message) => {
    const field = input.closest('.field');
    field.classList.toggle('has-error', Boolean(message));
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    const error = field.querySelector('.field-error');
    if (error) error.textContent = message;
  };

  /* Wires validation to a form. onValid(form) runs once every field passes. */
  const wireForm = (form, onValid) => {
    const inputs = Array.from(form.querySelectorAll('.field input, .field select'));
    const submit = form.querySelector('button[type="submit"]');
    const label = submit.querySelector('.btn-label');
    const idleLabel = label.textContent;
    const status = form.querySelector('[data-form-status]');
    let attempted = false;

    inputs.forEach((input) => {
      const live = input.tagName === 'SELECT' || input.type === 'date' ? 'change' : 'input';
      input.addEventListener(live, () => {
        if (attempted || input.closest('.field').classList.contains('has-error')) showError(input, messageFor(input));
      });
      input.addEventListener('blur', () => {
        if (attempted || input.value.trim()) showError(input, messageFor(input));
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      attempted = true;
      const invalid = inputs.filter((input) => {
        const message = messageFor(input);
        showError(input, message);
        return message;
      });
      if (invalid.length) {
        if (status) status.textContent = 'Please correct the highlighted fields.';
        invalid[0].focus();
        return;
      }
      if (status) status.textContent = '';
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      label.textContent = 'Please wait…';
      await wait(700); // simulated request: nothing leaves the browser
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      label.textContent = idleLabel;
      onValid(form);
    });

    return {
      reset() {
        attempted = false;
        form.reset();
        inputs.forEach((input) => showError(input, ''));
        if (status) status.textContent = '';
      },
    };
  };

  const firstName = (value) => value.trim().split(/\s+/)[0];

  /* Swaps a form for its confirmation panel. */
  const showSuccess = (form, success, values) => {
    Object.entries(values).forEach(([key, value]) => {
      success.querySelectorAll(`[data-success-${key}]`).forEach((el) => { el.textContent = value; });
    });
    form.hidden = true;
    success.hidden = false;
    success.querySelector('[data-success-title]').focus();
  };

  /* ---------- Sign-up form (hero) ---------- */
  const signupForm = document.getElementById('signup-form');
  const signupSuccess = document.getElementById('signup-success');
  const signup = wireForm(signupForm, (form) => {
    showSuccess(form, signupSuccess, {
      name: firstName(form.elements.name.value),
      email: form.elements.email.value.trim(),
    });
    window.dispatchEvent(new CustomEvent('kilo:hop'));
  });

  signupSuccess.querySelector('[data-success-reset]').addEventListener('click', () => {
    signup.reset();
    signupSuccess.hidden = true;
    signupForm.hidden = false;
    signupForm.elements.name.focus();
  });

  /* ---------- Dialogs ---------- */
  let lastTrigger = null;

  const openDialog = (dialog, trigger) => {
    if (!dialog || dialog.open) return;
    lastTrigger = trigger || document.activeElement;
    setMenu(false);
    dialog.showModal();
    const first = dialog.querySelector('form:not([hidden]) input');
    if (first) first.focus();
  };

  document.querySelectorAll('[data-open-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => openDialog(document.getElementById(btn.dataset.openDialog), btn));
  });

  document.querySelectorAll('dialog.modal').forEach((dialog) => {
    dialog.querySelectorAll('[data-close-dialog]').forEach((btn) => btn.addEventListener('click', () => dialog.close()));
    // click on the dimmed backdrop closes the dialog
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      dialog.dispatchEvent(new CustomEvent('dialog:closed'));
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
      lastTrigger = null;
    });
  });

  /* ---------- Book a demo ---------- */
  const demoDialog = document.getElementById('demo-dialog');
  const demoForm = document.getElementById('demo-form');
  const demoSuccess = document.getElementById('demo-success');
  const dateInput = demoForm.elements.date;

  const today = new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  dateInput.min = iso(today);

  const demo = wireForm(demoForm, (form) => {
    const date = new Date(`${form.elements.date.value}T00:00:00`);
    const when = date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const time = form.elements.time.value.split(' (')[0].toLowerCase();
    showSuccess(form, demoSuccess, {
      name: firstName(form.elements.name.value),
      email: form.elements.email.value.trim(),
      when: `the ${time} of ${when}`,
    });
  });

  demoDialog.addEventListener('dialog:closed', () => {
    if (!demoSuccess.hidden) {
      demo.reset();
      demoSuccess.hidden = true;
      demoForm.hidden = false;
    }
  });

  /* ---------- Sign in ---------- */
  const signinDialog = document.getElementById('signin-dialog');
  const signinForm = document.getElementById('signin-form');
  const signinMessage = signinForm.querySelector('[data-signin-message]');

  const signin = wireForm(signinForm, () => {
    signinMessage.textContent = 'Thank you. Sign-in is not available on this demonstration page, so no details were checked or sent.';
    signinForm.elements.password.value = '';
  });

  signinForm.querySelector('[data-forgot]').addEventListener('click', () => {
    signinMessage.textContent = 'Password reset is not available on this demonstration page.';
  });

  signinDialog.addEventListener('dialog:closed', () => {
    signin.reset();
    signinMessage.textContent = '';
  });

  /* ---------- "Sign up" links: scroll to the hero form and focus it ---------- */
  document.querySelectorAll('[data-focus-signup]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const open = link.closest('dialog');
      if (open) open.close();
      lastTrigger = null;
      document.getElementById('signup').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
      const target = signupForm.hidden ? signupSuccess.querySelector('[data-success-title]') : signupForm.elements.name;
      window.setTimeout(() => target.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 450);
    });
  });

  /* ---------- Industry ticker under Kilo (reads the Industries cards) ---------- */
  const items = Array.from(document.querySelectorAll('.industry[data-no]')).map((el) => ({
    no: el.dataset.no,
    name: el.querySelector('h3').textContent,
    line: el.querySelector('p').textContent,
  }));
  const tickerBody = document.querySelector('.ticker-body');
  const tickerCount = document.querySelector('[data-ticker-count]');
  const tickerName = document.querySelector('[data-ticker-name]');
  const tickerLine = document.querySelector('[data-ticker-line]');
  let tick = 0;
  let tickerTimer = null;

  const showItem = (i) => {
    const item = items[i];
    tickerCount.textContent = `${item.no} / ${String(items.length).padStart(2, '0')}`;
    tickerName.textContent = item.name;
    tickerLine.textContent = item.line;
  };

  const nextItem = () => {
    tick = (tick + 1) % items.length;
    tickerBody.classList.add('is-swapping');
    window.setTimeout(() => {
      showItem(tick);
      tickerBody.classList.remove('is-swapping');
    }, 260);
  };

  const startTicker = () => {
    window.clearInterval(tickerTimer);
    tickerTimer = reduceMotion.matches || document.hidden ? null : window.setInterval(nextItem, 3200);
  };

  if (items.length && tickerBody) {
    showItem(0);
    startTicker();
    reduceMotion.addEventListener('change', startTicker);
    document.addEventListener('visibilitychange', startTicker);
  }
})();
