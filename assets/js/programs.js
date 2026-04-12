/**
 * Load data/programs.json and render program cards + Remodal content.
 * Optional program.landingPage: image/title link there (same document); no Remodal for that row.
 * Depends: jQuery, Remodal (after DOM ready for auto-init; new modals get .remodal() explicitly).
 */
(function () {
  'use strict';

  var MODAL_PREFIX = 'modal-program-';

  /** Resolve against the page URL so paths work from subfolders and avoid ./ edge cases. */
  function programsJsonCandidates() {
    var list = [];
    var script = document.querySelector('script[src*="programs.js"]');
    var override = script && script.getAttribute('data-programs');
    if (override) {
      list.push(new URL(override, window.location.href).href);
    }
    list.push(new URL('data/programs.json', window.location.href).href);
    return list;
  }

  function loadJson(url) {
    if (window.location.protocol === 'file:') {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        if (xhr.overrideMimeType) xhr.overrideMimeType('application/json');
        xhr.open('GET', url, true);
        xhr.onload = function () {
          if (xhr.status === 200 || xhr.status === 0) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error('status ' + xhr.status));
          }
        };
        xhr.onerror = function () {
          reject(new Error('network'));
        };
        xhr.send();
      });
    }
    return fetch(url, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function tryLoadJson(urls, index) {
    if (index >= urls.length) {
      return Promise.reject(new Error('no url'));
    }
    return loadJson(urls[index]).catch(function (err) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('programs.json failed:', urls[index], err && err.message ? err.message : err);
      }
      return tryLoadJson(urls, index + 1);
    });
  }

  function escapeHtml(s) {
    if (s == null || s === '') return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function textToParagraphHtml(text) {
    if (!text) return '';
    return text.split('\n').map(escapeHtml).join('<br>');
  }

  /** Match existing modals: first word bold in h4, rest plain (leading space preserved). */
  function modalTitleHtml(text) {
    if (!text) return '';
    var idx = text.indexOf(' ');
    var bold = idx === -1 ? text : text.slice(0, idx);
    var rest = idx === -1 ? '' : text.slice(idx);
    return '<h4><span class="font-weight-bold">' + escapeHtml(bold) + '</span>' + escapeHtml(rest) + '</h4>';
  }

  function parseVimeoId(url) {
    if (!url || typeof url !== 'string') return null;
    var m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    return m ? m[1] : null;
  }

  function parseYouTubeId(url) {
    if (!url || typeof url !== 'string') return null;
    var m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/i);
    return m ? m[1] : null;
  }

  function buildVideoBlock(url) {
    if (!url) return '';
    var vimeoId = parseVimeoId(url);
    if (vimeoId) {
      return (
        '<div class="rounded overflow-hidden mb-3">' +
        '<div class="player" data-plyr-provider="vimeo" data-plyr-embed-id="' +
        escapeHtml(vimeoId) +
        '"></div></div>'
      );
    }
    var ytId = parseYouTubeId(url);
    if (ytId) {
      return (
        '<div class="rounded overflow-hidden mb-3">' +
        '<div class="player" data-plyr-provider="youtube" data-plyr-embed-id="' +
        escapeHtml(ytId) +
        '"></div></div>'
      );
    }
    return (
      '<p class="mb-3"><a href="' +
      escapeHtml(url) +
      '" target="_blank" rel="noopener noreferrer">Watch video</a></p>'
    );
  }

  function buildModalSection(block) {
    if (!block || !block.type) return '';
    switch (block.type) {
      case 'title':
        return modalTitleHtml(block.text || '');
      case 'subtitle':
        return '<p class="mb-3 text-uppercase ls-0">' + textToParagraphHtml(block.text || '') + '</p>';
      case 'text':
        return '<p class="mb-2 text-left">' + textToParagraphHtml(block.text || '') + '</p>';
      case 'images':
        if (!Array.isArray(block.urls) || !block.urls.length) return '';
        return block.urls
          .map(function (u) {
            return (
              '<img class="rounded w-100 mb-3" src="' +
              escapeHtml(u) +
              '" alt="">'
            );
          })
          .join('');
      case 'video':
        return buildVideoBlock(block.url || '');
      default:
        return '';
    }
  }

  function buildModalHtml(program) {
    var modalId = MODAL_PREFIX + program.id;
    var parts = [
      '<div class="remodal rounded-soft" data-remodal-id="' +
        escapeHtml(modalId) +
        '">',
      '<button class="remodal-close" data-remodal-action="close"></button>'
    ];
    (program.modal || []).forEach(function (block) {
      parts.push(buildModalSection(block));
    });
    parts.push(
      '<button class="btn btn-sm btn-dark mr-3" data-remodal-action="confirm">OK</button>',
      '</div>'
    );
    return parts.join('');
  }

  function urlLooksLikePdf(url) {
    if (!url || typeof url !== 'string') return false;
    var path = url.split(/[?#]/)[0].toLowerCase();
    return path.slice(-4) === '.pdf';
  }

  function programLandingPage(program) {
    return (program && program.landingPage ? String(program.landingPage) : '').trim();
  }

  function programNeedsRemodal(program) {
    if (programLandingPage(program)) return false;
    return Array.isArray(program.modal) && program.modal.length > 0;
  }

  function buildCardHtml(program) {
    var modalId = MODAL_PREFIX + program.id;
    var landing = programLandingPage(program);
    var pdfUrl = (program.pdfUrl || '').trim();
    var pdfLabel = program.pdfLabel || 'More Info (PDF)';
    var btnTitle = program.buttonTitle || 'Apply';
    var btnLink = (program.buttonLink || '').trim();
    var descHtml = textToParagraphHtml(program.description || '');

    var pdfBlock = '';
    if (pdfUrl) {
      pdfBlock =
        '<a class="text-dark font-weight-semi-bold" href="' +
        escapeHtml(pdfUrl) +
        '"' +
        (urlLooksLikePdf(pdfUrl) ? ' target="_blank" rel="noopener noreferrer"' : '') +
        '>' +
        escapeHtml(pdfLabel) +
        '<span class="fas fa-angle-right ml-1 text-900" data-fa-transform="down-2"></span></a>';
    }

    var btnBlock;
    if (btnLink) {
      btnBlock =
        '<a class="btn btn-dark hvr-sweep-top px-4" href="' +
        escapeHtml(btnLink) +
        '">' +
        escapeHtml(btnTitle) +
        '</a>';
    } else {
      btnBlock =
        '<a class="btn btn-dark hvr-sweep-top px-4" href="#!" data-remodal-target="modal-closed">' +
        escapeHtml(btnTitle) +
        '</a>';
    }

    var imgLink =
      '<a class="program-card-thumb rounded-top" ' +
      (landing
        ? 'href="' + escapeHtml(landing) + '"'
        : 'href="#!" data-remodal-target="' + escapeHtml(modalId) + '"') +
      '><img src="' +
      escapeHtml(program.image || '') +
      '" alt=""></a>';
    var titleLink =
      '<a class="text-black" ' +
      (landing
        ? 'href="' + escapeHtml(landing) + '"'
        : 'href="#!" data-remodal-target="' + escapeHtml(modalId) + '"') +
      '>' +
      '<span class="text-sans-serif font-weight-bold d-block">' +
      escapeHtml(program.title || '') +
      '</span>' +
      '<span class="fs-0 d-block">' +
      escapeHtml(program.subtitle || '') +
      '</span></a>';

    return (
      '<div class="col-md-6 col-lg-4 d-flex flex-column mb-2 mb-md-4">' +
      imgLink +
      '<div class="p-2 p-md-3 border rounded-bottom border-top-0 bg-vik-101 flex-grow-1 d-flex flex-column">' +
      '<h5 class="text-base text-transform-none font-weight-medium lh-1">' +
      titleLink +
      '</h5>' +
      '<p class="mb-0">' +
      descHtml +
      '</p>' +
      '<div class="mt-auto d-flex flex-column program-card-cta">' +
      pdfBlock +
      '<hr class="program-card-cta-rule" />' +
      '<div>' +
      btnBlock +
      '</div></div></div></div>'
    );
  }

  function initProgramRemodals(root) {
    if (!window.jQuery) return;
    var $ = window.jQuery;
    $(root)
      .find('.remodal')
      .each(function () {
        var $m = $(this);
        if ($m.data('remodal') == null) {
          $m.remodal();
        }
      });
  }

  function setupPlyrIfAvailable() {
    if (typeof window.Plyr === 'undefined') return;
    try {
      window.Plyr.setup('.player');
    } catch (e) {
      /* ignore double-init */
    }
  }

  function wirePlyrWatch(modalEl) {
    if (typeof window.watchRemodalForPlyr === 'function') {
      window.watchRemodalForPlyr(modalEl);
    }
  }

  function render(data) {
    var programs = data && data.programs;
    if (!Array.isArray(programs) || !programs.length) return;

    var row = document.getElementById('programs-card-row');
    var modalRoot = document.getElementById('program-modals-root');
    if (!row || !modalRoot) return;

    var fragCards = document.createDocumentFragment();
    var fragModals = document.createDocumentFragment();

    programs.forEach(function (program) {
      if (!program.id) return;
      var cardWrap = document.createElement('div');
      cardWrap.innerHTML = buildCardHtml(program);
      var cardEl = cardWrap.querySelector('.col-md-6');
      if (cardEl) fragCards.appendChild(cardEl);
      if (programNeedsRemodal(program)) {
        var modalWrap = document.createElement('div');
        modalWrap.innerHTML = buildModalHtml(program);
        var modalEl = modalWrap.querySelector('.remodal');
        if (modalEl) {
          fragModals.appendChild(modalEl);
          wirePlyrWatch(modalEl);
        }
      }
    });

    row.appendChild(fragCards);
    modalRoot.appendChild(fragModals);

    initProgramRemodals(modalRoot);
    if (window.__plyrVimeoLazyLoaded) {
      setupPlyrIfAvailable();
    }
  }

  function showError(msg) {
    var row = document.getElementById('programs-card-row');
    if (!row) return;
    row.innerHTML =
      '<div class="col-12"><p class="text-muted mb-0" role="alert">' +
      escapeHtml(msg) +
      '</p></div>';
  }

  function boot() {
    tryLoadJson(programsJsonCandidates(), 0)
      .then(render)
      .catch(function () {
        showError(
          'Program listings could not be loaded. If you opened this file from disk, use a local server (e.g. npx serve) or open the site over http/https.'
        );
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
