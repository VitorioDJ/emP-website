/**
 * Lazy-load Plyr CSS + polyfilled script when any Remodal that contains .player opens.
 * Watches all .remodal nodes; call window.watchRemodalForPlyr(el) for modals added later.
 */
(function () {
  'use strict';

  function modalIsActive(el) {
    return (
      el.classList.contains('remodal-is-opening') || el.classList.contains('remodal-is-opened')
    );
  }

  function modalNeedsPlayer(modal) {
    return modal.querySelector('.player');
  }

  function loadPlyr() {
    if (window.__plyrVimeoLazyLoaded) return;
    window.__plyrVimeoLazyLoaded = true;

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './assets/lib/plyr/plyr.css';
    document.head.appendChild(link);

    var script = document.createElement('script');
    script.src = './assets/lib/plyr/plyr.polyfilled.min.js';
    script.onload = function () {
      if (typeof Plyr !== 'undefined') {
        try {
          Plyr.setup('.player');
        } catch (e) {
          /* ignore */
        }
      }
    };
    document.body.appendChild(script);
  }

  function watchModal(modal) {
    if (!modal || modal.getAttribute('data-plyr-watch') === '1') return;
    modal.setAttribute('data-plyr-watch', '1');

    function maybeLoad() {
      if (modalIsActive(modal) && modalNeedsPlayer(modal)) {
        loadPlyr();
      }
    }

    if (modalIsActive(modal) && modalNeedsPlayer(modal)) {
      loadPlyr();
      return;
    }

    var obs = new MutationObserver(maybeLoad);
    obs.observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  function boot() {
    document.querySelectorAll('.remodal').forEach(watchModal);
  }

  window.watchRemodalForPlyr = function (modalEl) {
    if (modalEl) watchModal(modalEl);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
