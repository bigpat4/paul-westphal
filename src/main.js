// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Floating navbar — solidify on scroll past the hero fold
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const onHeaderScroll = () => {
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onHeaderScroll, { passive: true });
  onHeaderScroll();
}

// Nav toggle
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');
navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
mainNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Counter animation
function runCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1600;
  const startTime = performance.now();
  const update = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString('de-DE');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      runCounter(e.target);
      counterObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.counter').forEach(el => counterObs.observe(el));

// Stacking scroll cards (Apple/Linear style)
(function () {
  const cards = Array.from(document.querySelectorAll('#systemStack .stack-card'));
  if (!cards.length || window.matchMedia('(max-width: 768px)').matches) return;

  const onScroll = () => {
    const vh = window.innerHeight;
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) {
        card.style.setProperty('--s', 1);
        card.style.opacity = 1;
        return;
      }
      const r = next.getBoundingClientRect();
      const start = vh * 0.85;
      const end = 140;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end)));
      const scale = 1 - p * 0.04 * (cards.length - i);
      card.style.setProperty('--s', scale);
      card.style.opacity = 1;
    });
  };

  let rafId;
  window.addEventListener('scroll', () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => { onScroll(); rafId = null; });
  }, { passive: true });

  cards.forEach(c => c.classList.add('is-stacked'));
  onScroll();
})();

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.faq-q').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling.style.maxHeight = '0';
    });
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      const answer = btn.nextElementSibling;
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// ===== Booking modal (shell) =====
// Collects a preferred slot + contact details and opens a prefilled e-mail to Paul.
// No calendar is written yet — swap the submit for the Cal.com embed when the account exists.
(function () {
  const overlay = document.getElementById('bookingOverlay');
  if (!overlay) return;

  const modal = overlay.querySelector('.booking-modal');
  const closeBtn = document.getElementById('bookingClose');
  const nextBtn = document.getElementById('bookingNext');
  const backBtn = document.getElementById('bookingBack');
  const daysWrap = document.getElementById('bookingDays');
  const timesWrap = document.getElementById('bookingTimes');
  const summary = document.getElementById('bookingSummary');
  const foot = document.getElementById('bookingFoot');
  const steps = Array.from(overlay.querySelectorAll('.booking-step'));
  const dots = Array.from(overlay.querySelectorAll('.booking-steps .dot'));

  const DOW = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  const EMAIL = 'Paul.Westphal@Westphal-plus.de';

  const state = { step: 1, day: null, time: null };
  let lastFocus = null;

  // Build next 5 weekdays
  function buildDays() {
    daysWrap.innerHTML = '';
    const d = new Date();
    let added = 0;
    while (added < 5) {
      d.setDate(d.getDate() + 1);
      const wd = d.getDay();
      if (wd === 0 || wd === 6) continue; // skip weekend
      const label = `${DOW[wd]}, ${d.getDate()}. ${MON[d.getMonth()]}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'booking-day';
      btn.dataset.label = label;
      btn.innerHTML = `<span class="bd-dow">${DOW[wd]}</span><span class="bd-date">${d.getDate()}</span><span class="bd-mon">${MON[d.getMonth()]}</span>`;
      btn.addEventListener('click', () => {
        daysWrap.querySelectorAll('.booking-day').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        state.day = label;
        syncNext();
      });
      daysWrap.appendChild(btn);
      added++;
    }
  }

  function buildTimes() {
    timesWrap.innerHTML = '';
    TIMES.forEach(t => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'booking-time';
      btn.textContent = t;
      btn.addEventListener('click', () => {
        timesWrap.querySelectorAll('.booking-time').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        state.time = t;
        syncNext();
      });
      timesWrap.appendChild(btn);
    });
  }

  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function syncNext() {
    if (state.step === 1) nextBtn.disabled = !(state.day && state.time);
    else if (state.step === 2) {
      const name = document.getElementById('bkName').value.trim();
      nextBtn.disabled = !(name && emailOk(document.getElementById('bkEmail').value.trim()));
    } else nextBtn.disabled = false;
  }

  function showStep(n) {
    state.step = n;
    steps.forEach(s => { s.hidden = Number(s.dataset.step) !== n; });
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === n - 1);
      dot.classList.toggle('is-done', i < n - 1);
    });
    backBtn.hidden = n === 1 || n === 4;
    nextBtn.hidden = n === 4;
    foot.style.display = n === 4 ? 'none' : 'flex';
    nextBtn.textContent = n === 3 ? 'Anfrage senden' : 'Weiter';
    document.getElementById('bookingTitle').textContent =
      n === 1 ? 'Termin wählen' : n === 2 ? 'Deine Daten' : n === 3 ? 'Bestätigen' : 'Fertig';
    if (n === 3) buildSummary();
    syncNext();
  }

  function buildSummary() {
    const name = document.getElementById('bkName').value.trim();
    const email = document.getElementById('bkEmail').value.trim();
    const phone = document.getElementById('bkPhone').value.trim();
    const rows = [
      ['Termin', `${state.day} · ${state.time} Uhr`],
      ['Name', name],
      ['E-Mail', email],
    ];
    if (phone) rows.push(['Telefon', phone]);
    summary.innerHTML = rows.map(([l, v]) =>
      `<div class="booking-summary-row"><span class="bs-label">${l}</span><span class="bs-value">${v.replace(/</g, '&lt;')}</span></div>`
    ).join('');
  }

  function submitRequest() {
    const name = document.getElementById('bkName').value.trim();
    const email = document.getElementById('bkEmail').value.trim();
    const phone = document.getElementById('bkPhone').value.trim();
    const msg = document.getElementById('bkMsg').value.trim();
    const subject = `Terminanfrage Erstgespräch – ${name}`;
    const body =
      `Hallo Paul,\n\nich möchte ein kostenloses Erstgespräch vereinbaren.\n\n` +
      `Wunschtermin: ${state.day} um ${state.time} Uhr\n` +
      `Name: ${name}\nE-Mail: ${email}\n` +
      (phone ? `Telefon: ${phone}\n` : '') +
      (msg ? `\nNachricht:\n${msg}\n` : '') +
      `\nViele Grüße`;
    // Opens the visitor's mail client with everything prefilled (no backend needed).
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    document.getElementById('bookingSuccessMsg').textContent =
      `Danke, ${name.split(' ')[0] || 'und bis gleich'}! Deine Anfrage für ${state.day}, ${state.time} Uhr ist vorbereitet — sende die E-Mail ab, dann bestätigt Paul dir den Termin persönlich.`;
    showStep(4);
  }

  function open() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    showStep(1);
    setTimeout(() => closeBtn.focus(), 50);
  }
  function close() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.hidden = true; }, 350);
    if (lastFocus) lastFocus.focus();
  }

  nextBtn.addEventListener('click', () => {
    if (state.step === 3) submitRequest();
    else showStep(state.step + 1);
  });
  backBtn.addEventListener('click', () => showStep(Math.max(1, state.step - 1)));
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('is-open')) close(); });
  ['bkName', 'bkEmail'].forEach(id => document.getElementById(id).addEventListener('input', syncNext));

  buildDays();
  buildTimes();

  // Wire every booking CTA to open the modal (href="#kontakt" stays as a no-JS fallback)
  const triggerSel = '.btn-header, .hero-cta .btn, .about-text .btn, .btn-card-cta, .editorial-text .btn, .proof-cta-wrap .btn, .footer-booking-btn, .mobile-bar-book, .contact .btn-slide';
  document.querySelectorAll(triggerSel).forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); open(); });
  });
})();

// ===== Scroll reveal — IntersectionObserver (robust, no CDN dependency) =====
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // CSS keeps everything visible; no animation

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  // Apply a reveal to every element in a group, with per-item stagger + optional direction.
  const reveal = (selector, { stagger = 0, variant = '' } = {}) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.remove('fade-up', 'is-visible');
      el.classList.add('reveal');
      if (variant) el.classList.add('reveal-' + variant);
      if (stagger) el.style.transitionDelay = (i * stagger) + 'ms';
      io.observe(el);
    });
  };

  reveal('.pillars-intro > *', { stagger: 90 });
  reveal('.pillar', { stagger: 120, variant: 'scale' });
  reveal('.about-image', { variant: 'left' });
  reveal('.about-text', { variant: 'right' });
  reveal('.system-header > *', { stagger: 90 });
  reveal('.service-card', { stagger: 110, variant: 'scale' });
  reveal('.editorial-image', { variant: 'left' });
  reveal('.editorial-text', { variant: 'right' });
  reveal('.proof-rating-block, .proof-stats-row, .proof-quote-block, .proof-cta-wrap', { stagger: 110 });
  reveal('.faq-item', { stagger: 70 });
  reveal('.contact-inner > *', { stagger: 90 });

  // Safety net — reveal anything already at/above the fold that IO might have skipped
  // (fast programmatic scrolls, deep links, back-forward cache). Guarantees no stuck-hidden sections.
  const sweep = () => {
    const limit = window.innerHeight * 0.94;
    document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
      if (el.getBoundingClientRect().top < limit) { el.classList.add('in'); io.unobserve(el); }
    });
  };
  window.addEventListener('scroll', sweep, { passive: true });
  window.addEventListener('load', sweep);
  window.addEventListener('pageshow', sweep);
})();

// Hero entrance — plays once on load (independent of scroll)
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = document.querySelectorAll('.hero .eyebrow, .hero h1, .hero-sub, .hero-stats, .hero-cta');
  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 1.05s cubic-bezier(.16,1,.3,1), transform 1.05s cubic-bezier(.16,1,.3,1)';
    el.style.transitionDelay = (i * 160) + 'ms';
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    els.forEach((el) => { el.style.opacity = ''; el.style.transform = ''; });
  }));
})();
