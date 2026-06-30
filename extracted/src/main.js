// Year
document.getElementById('year').textContent = new Date().getFullYear();

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
      card.style.opacity = 1 - p * 0.14;
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

// ===== GSAP Scroll Animations =====
// GSAP + ScrollTrigger are loaded from CDN as deferred scripts before this module.
// Falls back to IntersectionObserver if CDN is unavailable.
(function () {
  const g = window.gsap;
  const ST = window.ScrollTrigger;

  if (!g || !ST) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
    return;
  }

  g.registerPlugin(ST);
  // Signal to CSS that GSAP is in control — resets .fade-up opacity so GSAP owns it
  document.documentElement.classList.add('gsap-ready');

  const ease = 'power2.out';

  // Hero entrance (plays on load, not scroll-triggered)
  g.from('.hero .eyebrow, .hero h1, .hero-sub, .hero-stats, .hero-cta', {
    y: 22, opacity: 0, duration: 0.78, ease, stagger: 0.14
  });
  g.from('.hero-visual img', {
    scale: 1.06, opacity: 0, duration: 1.15, ease, delay: 0.1
  });

  // Pillar cards — stagger left to right
  g.from('.pillar', {
    scrollTrigger: { trigger: '.pillars-grid', start: 'top 82%' },
    y: 40, opacity: 0, duration: 0.72, stagger: 0.14, ease
  });

  // About — opposing slide-in
  g.from('.about-image', {
    scrollTrigger: { trigger: '.about-grid', start: 'top 82%' },
    x: -40, opacity: 0, duration: 0.9, ease
  });
  g.from('.about-text', {
    scrollTrigger: { trigger: '.about-grid', start: 'top 82%' },
    x: 40, opacity: 0, duration: 0.9, ease, delay: 0.13
  });

  // System section header
  g.from('.system-header > *', {
    scrollTrigger: { trigger: '.system-header', start: 'top 82%' },
    y: 26, opacity: 0, duration: 0.68, stagger: 0.13, ease
  });

  // Services grid
  g.from('.service-card', {
    scrollTrigger: { trigger: '.service-grid', start: 'top 83%' },
    y: 38, opacity: 0, duration: 0.72, stagger: 0.16, ease
  });

  // USP mark pops in, then text
  g.from('.usp-mark', {
    scrollTrigger: { trigger: '.usp-inner', start: 'top 83%' },
    scale: 0.5, opacity: 0, duration: 0.52, ease: 'back.out(1.7)'
  });
  g.from('.usp h2, .usp p, .usp .btn', {
    scrollTrigger: { trigger: '.usp-inner', start: 'top 83%' },
    y: 26, opacity: 0, duration: 0.68, stagger: 0.11, ease, delay: 0.14
  });

  // Story / testimonial cards
  g.from('.story-card', {
    scrollTrigger: { trigger: '.stories-grid', start: 'top 83%' },
    y: 38, opacity: 0, duration: 0.68, stagger: 0.13, ease
  });

  // FAQ items cascade
  g.from('.faq-item', {
    scrollTrigger: { trigger: '.faq-list', start: 'top 83%' },
    y: 20, opacity: 0, duration: 0.52, stagger: 0.07, ease
  });

  // Contact section
  g.from('.contact-inner > *', {
    scrollTrigger: { trigger: '.contact-inner', start: 'top 82%' },
    y: 26, opacity: 0, duration: 0.68, stagger: 0.11, ease
  });
})();
