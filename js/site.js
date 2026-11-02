// IPUL Ensenada and Tijuana: the only script on the pages.
// Everything works without it; it adds the phone menu and its nested
// menus, the churches drop-down, remembering the language choice, the home
// page's church tabs on phones, and today's verse.
(function () {
  'use strict';
  var scriptSrc = document.currentScript && document.currentScript.src;

  // Remember the language the visitor switches to (brief section 4).
  // Storage can fail (private mode, blocked); the site works without it.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-set-lang]');
    if (!a) return;
    try { window.localStorage.setItem('ipul-lang', a.getAttribute('data-set-lang')); } catch (err) { /* ignore */ }
  });

  // Phone menu.
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  if (header && toggle) {
    var menuArea = header.querySelector('.site-header__main');
    var menuOpen = function () { return toggle.getAttribute('aria-expanded') === 'true'; };
    // The sliding panel reaches from below the bar (and the page title
    // strip of the compact bar) to the bottom of the screen, and follows
    // the bar if the page moves while it is open.
    var sizeMenu = function () {
      if (menuArea) header.style.setProperty('--menu-top', Math.max(0, menuArea.getBoundingClientRect().bottom) + 'px');
    };
    toggle.addEventListener('click', function () {
      var open = !menuOpen();
      if (open) sizeMenu();
      toggle.setAttribute('aria-expanded', String(open));
      header.classList.toggle('is-open', open);
    });
    window.addEventListener('resize', function () { if (menuOpen()) sizeMenu(); });
    window.addEventListener('scroll', function () { if (menuOpen()) sizeMenu(); }, { passive: true });
    // Tapping the dimmed page beside the panel, or moving the keyboard focus
    // out of the menu, closes it.
    header.addEventListener('click', function (e) {
      if (e.target === header && menuOpen()) toggle.click();
    });
    document.addEventListener('focusin', function (e) {
      if (menuOpen() && menuArea && !menuArea.contains(e.target)) toggle.click();
    });
  }

  // Nested menus ("Our churches", "About us"). On wide screens they are
  // drop-downs: one open at a time, closed by a click or focus elsewhere.
  // In the phone menu they open in place, each on its own, and all close
  // again once the menu has slid away.
  var wide = window.matchMedia('(min-width: 60rem)');
  var subs = Array.prototype.slice.call(document.querySelectorAll('.sub-toggle'));
  function setSub(b, open) {
    b.setAttribute('aria-expanded', String(open));
    b.parentNode.classList.toggle('is-expanded', open);
  }
  function closeSubs(except) {
    subs.forEach(function (b) { if (b !== except) setSub(b, false); });
  }
  subs.forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true';
      if (wide.matches) closeSubs(b);
      setSub(b, open);
    });
  });
  var outsideSubs = function (el) { return wide.matches && (!el.closest || !el.closest('.has-sub')); };
  if (toggle) {
    toggle.addEventListener('click', function () {
      setTimeout(function () { if (toggle.getAttribute('aria-expanded') !== 'true') closeSubs(); }, 350);
    });
  }
  document.addEventListener('click', function (e) {
    if (outsideSubs(e.target)) closeSubs();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openSub = subs.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
    if (openSub) { closeSubs(); openSub.focus(); return; }
    if (toggle && toggle.getAttribute('aria-expanded') === 'true') { toggle.click(); toggle.focus(); }
  });
  document.addEventListener('focusin', function (e) {
    if (outsideSubs(e.target)) closeSubs();
  });

  // Sticky header and back-to-top button. Once the whole header has
  // scrolled above the screen, the bar and menu become a compact bar fixed
  // to the top and the back-to-top button appears; both go away together
  // when the header comes back into view.
  var barArea = header && header.querySelector('.site-header__main');
  if (header && barArea && 'IntersectionObserver' in window) {
    var stuck = false;
    var setStuck = function (on) {
      if (on === stuck) return;
      stuck = on;
      if (toggle && toggle.getAttribute('aria-expanded') === 'true') toggle.click();
      closeSubs();
      // The header keeps the space the bar used, so the page does not jump.
      header.style.paddingTop = on ? barArea.offsetHeight + 'px' : '';
      document.documentElement.classList.toggle('is-stuck', on);
    };
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      setStuck(!e.isIntersecting && e.boundingClientRect.top < 0);
    }).observe(header);
    // Keyboard focus never lands hidden under the compact bar: an element
    // that takes focus beneath it is scrolled into view. Only keyboard
    // focus: a tap on plain text gives focus to <main> (it has tabindex for
    // the skip link), and scrolling to its top sent the page back up.
    var keyboardFocus = function (el) {
      try { return el.matches(':focus-visible'); } catch (err) { return true; }
    };
    document.addEventListener('focusin', function (e) {
      if (!stuck || barArea.contains(e.target) || e.target.id === 'main' || !keyboardFocus(e.target)) return;
      var limit = barArea.getBoundingClientRect().bottom + 8;
      var top = e.target.getBoundingClientRect().top;
      if (top < limit) window.scrollBy({ top: top - limit, behavior: 'auto' });
    });
  }

  // Folded verses (first line shown). The verse is in the page in full; this
  // shows only its first line, fading out, and turns the reference below it
  // into a button that opens and folds the verse in place. Screen readers
  // still read the whole verse. Without this script the verse shows in full.
  var BOOK = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 6.5C10.3 5.3 7.8 4.8 4 5v13c3.8-.2 6.3.3 8 1.5m0-13c1.7-1.2 4.2-1.7 8-1.5v13c-3.8-.2-6.3.3-8 1.5m0-13v13"/></svg>';
  var CHEV = '<svg class="verse-toggle__chev" aria-hidden="true" viewBox="0 0 12 12" width="12" height="12"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  Array.prototype.forEach.call(document.querySelectorAll('.verse[data-fold]'), function (fig) {
    var quote = fig.querySelector('blockquote');
    var cap = fig.querySelector('figcaption');
    if (!quote || !cap) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'verse-toggle';
    btn.setAttribute('aria-expanded', 'false');
    if (quote.id) btn.setAttribute('aria-controls', quote.id);
    btn.innerHTML = BOOK + '<span></span>' + CHEV;
    btn.querySelector('span').textContent = cap.textContent;
    cap.textContent = '';
    cap.appendChild(btn);
    fig.classList.add('is-folded');
    var toggle = function () {
      var open = !fig.classList.toggle('is-folded');
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', toggle);
    // Tapping the visible first line opens the verse too.
    quote.addEventListener('click', function () { if (fig.classList.contains('is-folded')) toggle(); });
  });

  // Every photo in a page's body (not the photo at the top of the page or
  // the pastor's head shot; on every page since October 29, Charles), and
  // the home page's church cards and photo strip: tap a photo to see it
  // large. The photo becomes a button
  // (its name is the photo's alt text) that opens it full screen in the
  // browser's own dialog; a tap, the close button or Escape closes it, and
  // focus returns to the photo. Opens only when someone taps a photo.
  var zoomPhotos = document.querySelectorAll('.page-body figure.photo:not(.photo--headshot) picture'
    + ', .page--home .church-card figure.photo picture, .page--home .photo-strip figure.photo picture');
  if (zoomPhotos.length && window.HTMLDialogElement) {
    var dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.innerHTML = '<img class="lightbox__img" alt=""><button type="button" class="lightbox__close">'
      + '<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></button>';
    var closeBtn = dlg.querySelector('.lightbox__close');
    closeBtn.setAttribute('aria-label', document.body.getAttribute('data-close-label') || 'Close');
    document.body.appendChild(dlg);
    var bigImg = dlg.querySelector('.lightbox__img');
    dlg.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('close', function () { bigImg.removeAttribute('src'); });
    Array.prototype.forEach.call(zoomPhotos, function (pic) {
      var img = pic.querySelector('img');
      var source = pic.querySelector('source');
      if (!img) return;
      // The largest size listed for the photo.
      var largest = img.currentSrc || img.src;
      if (source) {
        var best = 0;
        source.getAttribute('srcset').split(',').forEach(function (c) {
          var parts = c.trim().split(/\s+/), w = parseInt(parts[1], 10) || 0;
          if (w > best) { best = w; largest = new URL(parts[0], document.baseURI).href; }
        });
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'photo-zoom';
      pic.parentNode.insertBefore(btn, pic);
      btn.appendChild(pic);
      btn.addEventListener('click', function () {
        bigImg.src = largest;
        bigImg.alt = img.alt;
        dlg.setAttribute('aria-label', img.alt);
        dlg.showModal();
        closeBtn.focus();
      });
    });
  }

  // Home and I'm New pages, phones: the two church cards become tabs, so one
  // church shows at a time and the page is shorter (Charles, October 29).
  // The first tab (Tijuana) is open at first; the choice is not stored. Wide
  // screens, and phones without this script, show both cards.
  // data-church-tabs="always" (Contact page, October 31): tabs on every
  // screen; a link to a heading in one church's section opens its tab.
  Array.prototype.forEach.call(document.querySelectorAll('[data-church-tabs]'), function (tabBox) {
    var tabList = tabBox.querySelector('.church-tabs');
    if (!tabList || !window.matchMedia) return;
    var tabs = Array.prototype.slice.call(tabList.querySelectorAll('button'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var always = tabBox.getAttribute('data-church-tabs') === 'always';
    var phone = window.matchMedia('(max-width: 47.99rem)');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var FADE_MS = 350; // the pill's slide and the card's fade in site.css
    var current = 0, tabbed = null, settle = null;
    var target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    panels.forEach(function (p, j) { if (target && p.contains(target)) current = j; });
    // The card that comes into view fades in over the one it replaces, which
    // stays in place until the fade ends, so the page behind never shows
    // through (no flash; Charles, October 29).
    var select = function (i, focus) {
      var prev = current;
      var fade = i !== prev && !reduce.matches;
      current = i;
      tabList.setAttribute('data-active', String(i));
      clearTimeout(settle);
      tabs.forEach(function (t, j) {
        t.setAttribute('aria-selected', String(j === i));
        t.tabIndex = j === i ? 0 : -1;
        panels[j].classList.remove('is-entering');
        panels[j].hidden = !(j === i || (fade && j === prev));
      });
      if (fade) {
        void panels[i].offsetWidth;
        panels[i].classList.add('is-entering');
        settle = setTimeout(function () {
          panels[prev].hidden = true;
          panels[i].classList.remove('is-entering');
        }, FADE_MS);
      }
      if (focus) tabs[i].focus();
    };
    // The other church's photo and map load once the tabs come near the
    // screen, so they are ready to fade in, not still loading, when tapped.
    if ('IntersectionObserver' in window) {
      var preload = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        preload.disconnect();
        Array.prototype.forEach.call(tabBox.querySelectorAll('img[loading="lazy"]'), function (img) {
          img.loading = 'eager';
          // Decoded ahead too, so the photo is drawn in the fade's first frame.
          if (img.decode) img.decode().catch(function () {});
        });
      }, { rootMargin: '400px 0px' });
      preload.observe(tabBox);
    }
    var apply = function () {
      var on = always || phone.matches;
      if (on === tabbed) return;
      tabbed = on;
      tabList.hidden = !on;
      tabBox.classList.toggle('is-tabbed', on);
      if (on) tabList.setAttribute('role', 'tablist'); else tabList.removeAttribute('role');
      tabs.forEach(function (t, j) {
        if (on) {
          t.setAttribute('role', 'tab');
          panels[j].setAttribute('role', 'tabpanel');
          panels[j].setAttribute('aria-labelledby', t.id);
        } else {
          t.removeAttribute('role');
          panels[j].removeAttribute('role');
          panels[j].removeAttribute('aria-labelledby');
          panels[j].hidden = false;
        }
      });
      if (on) select(current, false);
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false); });
      // Arrow keys, Home and End move between the tabs (the usual tab keys).
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, to = null;
        if (e.key === 'ArrowRight') to = (i + 1) % n;
        else if (e.key === 'ArrowLeft') to = (i - 1 + n) % n;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = n - 1;
        if (to === null) return;
        e.preventDefault();
        select(to, true);
      });
    });
    // Turning a tablet or resizing a window can cross the phone width.
    if (phone.addEventListener) phone.addEventListener('change', apply);
    window.addEventListener('resize', apply);
    apply();
  });

  // Questions and answers (I'm New): a question opens its answer in place,
  // sliding open while the icon turns into a minus, and closes it the same
  // way. The answer stays in the page until the closing has finished.
  // Tapping the open answer closes it too (Charles, October 30), except a
  // tap on a link in it (the WhatsApp number) or while selecting its text.
  // Without this script the browser opens and closes them at once.
  Array.prototype.forEach.call(document.querySelectorAll('.faq__item'), function (item) {
    var shut = null;
    var question = item.querySelector('summary');
    item.querySelector('.faq__a').addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      if (String(window.getSelection ? window.getSelection() : '').trim()) return;
      if (item.classList.contains('is-open')) question.click();
    });
    question.addEventListener('click', function (e) {
      e.preventDefault();
      clearTimeout(shut);
      if (!item.classList.contains('is-open')) {
        item.open = true;
        void item.offsetWidth;
        item.classList.add('is-open');
      } else {
        item.classList.remove('is-open');
        var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        shut = setTimeout(function () { item.open = false; }, still ? 0 : 350);
      }
    });
    // Opened some other way (the browser's find in page): show the answer.
    item.addEventListener('toggle', function () {
      if (item.open && !item.classList.contains('is-open')) item.classList.add('is-open');
    });
  });

  // Children page, phones: videos are small there, so pressing play turns
  // the video full screen.
  Array.prototype.forEach.call(document.querySelectorAll('.page--children video'), function (v) {
    v.addEventListener('play', function () {
      if (window.innerWidth >= 640 || document.fullscreenElement) return;
      try {
        if (v.requestFullscreen) v.requestFullscreen().catch(function () {});
        else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      } catch (err) { /* keep playing in the page */ }
    });
  });

  // Service times bar: the line between the two churches shows only while
  // they share a row (when the bar wraps, it would hang at a line's start).
  var bar = document.querySelector('.times-bar');
  if (bar) {
    var churches = bar.querySelectorAll('.times-bar__church');
    var oneRow = function () {
      if (churches.length < 2) return;
      var same = function () { return Math.abs(churches[1].getBoundingClientRect().top - churches[0].getBoundingClientRect().top) < 4; };
      // Measured with the line in place, since it adds a little width.
      bar.classList.add('is-one-row');
      if (!same()) bar.classList.remove('is-one-row');
    };
    oneRow();
    window.addEventListener('resize', oneRow);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(oneRow);
  }

  // Verse of the day: the same verse for everyone on the same calendar day
  // in Tijuana (days since the start date, modulo the number of verses).
  var votd = document.querySelector('[data-votd]');
  if (votd && scriptSrc && window.fetch && window.Intl) {
    try {
      var count = Number(votd.getAttribute('data-count'));
      var start = votd.getAttribute('data-start').split('-').map(Number);
      var parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Tijuana', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date()).split('-').map(Number);
      var days = Math.floor((Date.UTC(parts[0], parts[1] - 1, parts[2]) - Date.UTC(start[0], start[1] - 1, start[2])) / 86400000);
      var index = ((days % count) + count) % count;
      if (String(index) !== votd.getAttribute('data-index')) {
        var lang = document.documentElement.lang;
        fetch(new URL('../verses/' + index + '.json', scriptSrc).href)
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (v) {
            if (!v || !v[lang]) return;
            votd.querySelector('[data-votd-text]').textContent = v[lang].text;
            votd.querySelector('[data-votd-ref]').textContent = v[lang].ref + ', ' + votd.getAttribute('data-version');
            votd.setAttribute('data-index', String(index));
            // The background goes with the verse (verse number mod the number of backgrounds).
            var band = votd.closest('[data-backgrounds]');
            if (band) {
              var bgs = band.getAttribute('data-backgrounds').split(' ');
              band.setAttribute('data-bg', bgs[index % bgs.length]);
            }
          })
          .catch(function () { /* keep the verse from the build */ });
      }
    } catch (err) { /* keep the verse from the build */ }
  }
})();
