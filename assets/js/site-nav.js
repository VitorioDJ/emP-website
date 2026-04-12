/**
 * Primary navigation: mobile drawer + <details> submenus (vanilla JS).
 * Expects Bootstrap navbar markup for layout/CSS; does not use collapse or dropdown plugins.
 */
(function () {
  'use strict';

  var MQ_MOBILE = window.matchMedia('(max-width: 991.98px)');
  var MQ_DESKTOP = window.matchMedia('(min-width: 992px)');

  function isMobileLayout() {
    return MQ_MOBILE.matches;
  }

  function closest(el, sel) {
    if (!el || !el.closest) return null;
    return el.closest(sel);
  }

  function getNavbar() {
    return document.querySelector('.navbar-theme');
  }

  function getToggler() {
    return document.querySelector('.navbar-toggler');
  }

  function getPanel() {
    return document.getElementById('navbarSupportedContent');
  }

  function setMainPanelOpen(open) {
    var navbar = getNavbar();
    var toggler = getToggler();
    var panel = getPanel();
    if (!panel || !toggler) return;

    if (open) {
      panel.classList.add('show');
      toggler.classList.remove('collapsed');
      toggler.setAttribute('aria-expanded', 'true');
      if (isMobileLayout() && navbar) navbar.classList.add('bg-dark');
    } else {
      panel.classList.remove('show');
      toggler.classList.add('collapsed');
      toggler.setAttribute('aria-expanded', 'false');
      if (navbar) navbar.classList.remove('bg-dark');
      panel.querySelectorAll('details.site-nav-disclosure').forEach(function (d) {
        d.open = false;
      });
    }
  }

  /**
   * Theme CSS (theme.css) drives desktop/mobile dropdown visibility via .dropdown-menu.show
   * (opacity/visibility/pointer-events / max-height) — not via <details open> alone.
   */
  function syncDropdownMenuShow(details) {
    var menu = details.querySelector('.dropdown-menu');
    if (!menu) return;
    menu.classList.toggle('show', details.open);
  }

  function syncItemOpenClass() {
    var panel = getPanel();
    if (!panel) return;
    panel.querySelectorAll('details.site-nav-disclosure').forEach(function (d) {
      var li = d.closest('.nav-item');
      if (!li) return;
      li.classList.toggle('site-nav-item-open', d.open);
    });
  }

  function closeSiblings(detailsEl) {
    var panel = getPanel();
    if (!panel) return;
    panel.querySelectorAll('details.site-nav-disclosure').forEach(function (d) {
      if (d !== detailsEl) d.open = false;
    });
  }

  function initMainToggle() {
    var toggler = getToggler();
    var panel = getPanel();
    if (!toggler || !panel) return;

    toggler.addEventListener('click', function () {
      if (!isMobileLayout()) return;
      var willOpen = !panel.classList.contains('show');
      setMainPanelOpen(willOpen);
    });

    document.addEventListener(
      'touchstart',
      function (e) {
        if (!isMobileLayout()) return;
        if (!panel.classList.contains('show')) return;
        if (closest(e.target, '.navbar')) return;
        setMainPanelOpen(false);
      },
      { passive: true }
    );

    var lastTouchTs = 0;
    document.addEventListener(
      'touchstart',
      function () {
        lastTouchTs = Date.now();
      },
      true
    );

    document.addEventListener(
      'click',
      function (e) {
        if (!isMobileLayout()) return;
        if (!panel.classList.contains('show')) return;
        if (closest(e.target, '.navbar')) return;
        var fromTouch =
          (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents === true) ||
          Date.now() - lastTouchTs < 600;
        if (!fromTouch) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      },
      true
    );

    panel.addEventListener('click', function (e) {
      if (!isMobileLayout()) return;
      var a = closest(e.target, 'a');
      if (!a || !panel.contains(a)) return;
      if (closest(a, 'summary')) return;
      if (a.classList.contains('dropdown-item') || a.classList.contains('nav-link')) {
        setMainPanelOpen(false);
      }
    });
  }

  function initDetailsSubmenus() {
    var panel = getPanel();
    if (!panel) return;

    var disclosures = panel.querySelectorAll('details.site-nav-disclosure');
    disclosures.forEach(function (details) {
      details.addEventListener('toggle', function () {
        syncDropdownMenuShow(details);
        syncItemOpenClass();
        if (details.open && isMobileLayout()) {
          closeSiblings(details);
        }
      });

      /* mouseenter on <details> is unreliable when the pointer moves straight onto <summary>; cover both */
      function openOnDesktopHover() {
        if (!MQ_DESKTOP.matches) return;
        details.open = true;
      }

      details.addEventListener('mouseenter', openOnDesktopHover);
      var summary = details.querySelector('summary');
      if (summary) {
        summary.addEventListener('mouseenter', openOnDesktopHover);

        /*
         * Large screens: hover opens the submenu. A click on the title while it is already open
         * must not run the native <details> toggle (users expect to reach the links, not dismiss).
         * First click while closed still opens via default behavior; hover-only users unchanged.
         */
        summary.addEventListener(
          'click',
          function (e) {
            if (!MQ_DESKTOP.matches) return;
            if (details.open) {
              e.preventDefault();
            }
          },
          true
        );

        summary.addEventListener(
          'keydown',
          function (e) {
            if (!MQ_DESKTOP.matches) return;
            if (!details.open) return;
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
            }
          },
          true
        );
      }

      details.addEventListener('mouseleave', function () {
        if (!MQ_DESKTOP.matches) return;
        window.setTimeout(function () {
          if (!details.matches(':hover')) {
            details.open = false;
          }
        }, 100);
      });
    });
  }

  function onViewportChange() {
    if (MQ_DESKTOP.matches) {
      var panel = getPanel();
      if (panel) {
        panel.querySelectorAll('details.site-nav-disclosure').forEach(function (d) {
          d.open = false;
        });
        syncItemOpenClass();
      }
    }
  }

  if (MQ_MOBILE.addEventListener) {
    MQ_MOBILE.addEventListener('change', onViewportChange);
    MQ_DESKTOP.addEventListener('change', onViewportChange);
  } else if (MQ_MOBILE.addListener) {
    MQ_MOBILE.addListener(onViewportChange);
    MQ_DESKTOP.addListener(onViewportChange);
  }

  function boot() {
    initMainToggle();
    initDetailsSubmenus();
    var panel = getPanel();
    if (panel) {
      panel.querySelectorAll('details.site-nav-disclosure').forEach(function (d) {
        syncDropdownMenuShow(d);
      });
    }
    syncItemOpenClass();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
