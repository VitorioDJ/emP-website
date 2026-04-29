(function () {
  var nav = document.querySelector('.navbar.fixed-top');
  if (!nav) return;

  function setVar() {
    document.documentElement.style.setProperty('--navbar-h', nav.offsetHeight + 'px');
  }

  setVar();
  window.addEventListener('load', setVar);
  window.addEventListener('resize', setVar);

  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(setVar).observe(nav);
  }
})();
