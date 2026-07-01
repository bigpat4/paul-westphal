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
    el.style.transform = 'translateY(22px)';
    el.style.transition = 'opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1)';
    el.style.transitionDelay = (i * 130) + 'ms';
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    els.forEach((el) => { el.style.opacity = ''; el.style.transform = ''; });
  }));
})();
