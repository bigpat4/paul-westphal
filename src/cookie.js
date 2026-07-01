// Cookie / storage notice — the site uses only technically necessary storage
// (no tracking, no analytics), so this is an informational acknowledge banner.
// If tracking is ever added, upgrade this to opt-in (Einwilligung) consent.
(function () {
  const KEY = 'wp-cookie-ack';
  try { if (localStorage.getItem(KEY) === '1') return; } catch (e) { /* storage blocked */ }

  const bar = document.createElement('div');
  bar.className = 'cookie-banner';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Hinweis zu Cookies');
  bar.innerHTML =
    '<p class="cookie-text">Wir verwenden nur technisch notwendige Cookies und lokale Speicherung, damit die Website funktioniert &mdash; <strong>kein Tracking, keine Analyse, keine Weitergabe</strong>. Details in der <a href="/datenschutz.html">Datenschutzerkl&auml;rung</a>.</p>' +
    '<button type="button" class="btn btn-gold cookie-ok">Verstanden</button>';
  document.body.appendChild(bar);
  requestAnimationFrame(() => bar.classList.add('is-visible'));

  bar.querySelector('.cookie-ok').addEventListener('click', () => {
    try { localStorage.setItem(KEY, '1'); } catch (e) { /* ignore */ }
    bar.classList.remove('is-visible');
    setTimeout(() => bar.remove(), 300);
  });
})();
