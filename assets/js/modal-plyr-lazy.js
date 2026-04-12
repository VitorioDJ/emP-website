/**
 * Lazy-load Plyr when the Vimeo journey remodal opens (vanilla JS; no jQuery).
 */
(function () {
  'use strict';

  var MODAL_SEL = '.remodal[data-remodal-id="modal-vibe-journey"]';

  function modalIsActive(el) {
    return (
      el.classList.contains('remodal-is-opening') || el.classList.contains('remodal-is-opened')
    );
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
        Plyr.setup('.player');
      }
    };
    document.body.appendChild(script);
  }

  function boot() {
    var modal = document.querySelector(MODAL_SEL);
    if (!modal) return;

    if (modalIsActive(modal)) {
      loadPlyr();
      return;
    }

    var obs = new MutationObserver(function () {
      if (modalIsActive(modal)) {
        loadPlyr();
        obs.disconnect();
      }
    });
    obs.observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
