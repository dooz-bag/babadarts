/* ===========================================================================
   DATSU — SHELL
   Builds the header, menu and footer on every page so you only ever have to
   change them in one place. Also kicks off the page-specific rendering.
   =========================================================================== */

(function () {
  var D = window.DATSU;
  var U = D.util;

  /* ------------------------------------------------------------- pieces --- */

  /* A plain dartboard: twenty segment lines, two rings and a bull.
     The segment lines are generated rather than typed out by hand. */
  D.logoSvg = function (size) {
    var s = size || 34;
    var spokes = "";
    for (var i = 0; i < 20; i++) {
      var a = (i * 18 - 81) * Math.PI / 180;
      spokes +=
        '<line x1="' + (50 + 14 * Math.cos(a)).toFixed(1) + '" y1="' + (50 + 14 * Math.sin(a)).toFixed(1) +
        '" x2="' + (50 + 44 * Math.cos(a)).toFixed(1) + '" y2="' + (50 + 44 * Math.sin(a)).toFixed(1) + '"/>';
    }
    return '' +
      '<svg viewBox="0 0 100 100" width="' + s + '" height="' + s + '" aria-hidden="true">' +
      '  <circle cx="50" cy="50" r="47" fill="#1a1d22" stroke="#3a4048" stroke-width="1.5"/>' +
      '  <g stroke="#2e333a" stroke-width="1">' + spokes + '</g>' +
      '  <circle cx="50" cy="50" r="40" fill="none" stroke="#b6564d" stroke-width="4" opacity="0.55"/>' +
      '  <circle cx="50" cy="50" r="23" fill="none" stroke="#5b8f92" stroke-width="4" opacity="0.5"/>' +
      '  <circle cx="50" cy="50" r="9" fill="none" stroke="#b8934f" stroke-width="3"/>' +
      '  <circle cx="50" cy="50" r="3.5" fill="#b6564d"/>' +
      '</svg>';
  };

  D.avatarHtml = function (player, big) {
    var cls = "avatar" + (big ? " avatar-lg" : "");
    if (player.avatar) {
      return '<span class="' + cls + '" style="background:' + U.colourFor(player.id) + '">' +
        '<img src="' + U.esc(player.avatar) + '" alt="' + U.esc(player.name) + '" ' +
        'onerror="this.parentNode.textContent=\'' + U.esc(U.initials(player.name)) + '\'">' +
        '</span>';
    }
    return '<span class="' + cls + '" style="background:' + U.colourFor(player.id) + '">' +
      U.esc(U.initials(player.name)) + '</span>';
  };

  D.photoHtml = function (photo) {
    var rawSrc = photo.src || "";
    // If a path wasn't prefixed (e.g. just "foo.jpg"), assume it's in assets/img/archive/
    var src = rawSrc.indexOf("/") === -1 ? ("assets/img/archive/" + rawSrc) : rawSrc;
    var escSrc = U.esc(src);
    var cap = U.esc(photo.caption || "");
    var fallback =
      '<div class=\'photo-missing\'>' +
      '<div class=\'big\'>◎</div>' +
      '<div>Photo not added yet — drop a file in at</div>' +
      '<code>' + escSrc + '</code>' +
      '</div>';
    return '<figure class="shot">' +
      '<button type="button" class="shot-btn" data-src="' + escSrc + '" data-cap="' + cap + '" aria-label="View larger image">' +
      '<img src="' + escSrc + '" alt="' + cap + '" loading="lazy" ' +
      'onerror="this.closest(\'.shot\').outerHTML=' + JSON.stringify(fallback).replace(/"/g, "&quot;") + '">' +
      '</button>' +
      (cap ? '<figcaption>' + cap + '</figcaption>' : '') +
      '</figure>';
  };

  /* ------------------------------------------------------------- header --- */

  var NAV = [
    { href: "index.html", label: "Home", page: "home" },
    { href: "league.html", label: "League Table", page: "league" },
    { href: "playoffs.html", label: "Playoffs", page: "playoffs" },
    { href: "stats.html", label: "Stats &amp; Records", page: "stats" },
    { href: "players.html", label: "Players", page: "players" },
    { href: "submit.html", label: "Submit Result", page: "submit" },
    { href: "join.html", label: "Join Us", page: "join" }
  ];

  function buildHeader(current) {
    var cfg = D.config;
    var links = NAV.map(function (n) {
      // Labels are written just above, so they are trusted HTML
      return '<a href="' + n.href + '"' + (n.page === current ? ' class="active"' : '') + '>' +
        n.label + '</a>';
    }).join("");

    var archiveLinks = (D.archive || []).filter(function (a) {
      return D.isArchivePopulated ? D.isArchivePopulated(a) : ((a.photos && a.photos.length) || (a.results && a.results.length));
    }).map(function (a) {
      return '<a href="season.html?s=' + encodeURIComponent(a.id) + '">' +
        U.esc(a.name) + ' <span class="dd-type">· ' + U.esc(a.type) + '</span></a>';
    }).join("");

    var archiveMenu =
      '<div class="has-dropdown">' +
      '  <a href="archive.html"' + (current === "archive" || current === "season" ? ' class="active"' : '') + '>Archive ▾</a>' +
      '  <div class="dropdown">' +
      '    <a href="archive.html"><strong>All past results</strong></a>' +
      archiveLinks +
      '  </div>' +
      '</div>';

    return '' +
      '<div class="header-inner">' +
      '  <a class="brand" href="index.html">' + D.logoSvg(34) +
      '    <span class="brand-text">' + U.esc(cfg.leagueShortName) + '</span>' +
      '  </a>' +
      '  <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="mainNav">MENU</button>' +
      '  <nav class="nav" id="mainNav">' + links + archiveMenu + '</nav>' +
      '</div>';
  }

  function buildFooter() {
    var cfg = D.config;
    var quip = cfg.quips[Math.floor(Math.random() * cfg.quips.length)];
    return '' +
      '<div class="wrap">' +
      '  <div class="footer-grid">' +
      '    <div>' +
      '      <h4>' + U.esc(cfg.leagueName) + '</h4>' +
      '      <p class="muted tiny">' + U.esc(cfg.tagline) + '</p>' +
      '    </div>' +
      '    <div>' +
      '      <h4>Where</h4>' +
      '      <ul>' +
      '        <li>' + U.esc(cfg.venue.name) + '</li>' +
      '        <li class="muted tiny">' + U.esc(cfg.venue.nameJa) + '</li>' +
      '        <li class="muted tiny">' + U.esc(cfg.venue.address) + '</li>' +
      '        <li><a href="' + U.esc(cfg.venue.mapsUrl) + '" target="_blank" rel="noopener">Open in Maps →</a></li>' +
      '      </ul>' +
      '    </div>' +
      '    <div>' +
      '      <h4>Quick links</h4>' +
      '      <ul>' +
      '        <li><a href="league.html">League table</a></li>' +
      '        <li><a href="league.html#season-stats">Season stats &amp; highs</a></li>' +
      '        <li><a href="playoffs.html">Playoff picture</a></li>' +
      '        <li><a href="stats.html">Overall career stats</a></li>' +
      '        <li><a href="archive.html">The archive</a></li>' +
      '        <li><a href="submit.html">Submit a result</a></li>' +
      '        <li><a href="join.html">How to join</a></li>' +
      '      </ul>' +
      '    </div>' +
      '  </div>' +
      '  <p class="quip">' + U.esc(quip) + '</p>' +
      '  <p class="copyright">Made in Takadanobaba. Soft tip, DARTSLIVE, no excuses.</p>' +
      '</div>';
  }

  /* ----------------------------------------------------------- lightbox --- */

  function wireLightbox() {
    var modal = document.getElementById("datsu-lightbox");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "datsu-lightbox";
      modal.className = "lightbox";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML =
        '<div class="lightbox-backdrop"></div>' +
        '<div class="lightbox-dialog">' +
        '  <button type="button" class="lightbox-close" aria-label="Close image">&times;</button>' +
        '  <div class="lightbox-img-wrap">' +
        '    <img class="lightbox-img" src="" alt="">' +
        '  </div>' +
        '  <p class="lightbox-cap"></p>' +
        '</div>';
      document.body.appendChild(modal);

      function close() {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("lightbox-locked");
      }

      modal.addEventListener("click", function (e) {
        if (e.target.closest(".lightbox-close") || e.target.classList.contains("lightbox-backdrop")) {
          close();
        }
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && modal.classList.contains("open")) close();
      });
    }

    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".shot-btn");
      if (!btn) return;
      var src = btn.getAttribute("data-src");
      var cap = btn.getAttribute("data-cap") || "";
      var imgEl = modal.querySelector(".lightbox-img");
      var capEl = modal.querySelector(".lightbox-cap");
      imgEl.src = src;
      imgEl.alt = cap;
      capEl.textContent = cap;
      capEl.style.display = cap ? "block" : "none";
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-locked");
    });
  }

  /* --------------------------------------------------------------- boot --- */

  function wireNav() {
    var btn = document.getElementById("navToggle");
    var nav = document.getElementById("mainNav");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function render() {
    var page = document.body.getAttribute("data-page") || "";
    var header = document.getElementById("site-header");
    var footer = document.getElementById("site-footer");
    if (header) header.innerHTML = buildHeader(page);
    if (footer) footer.innerHTML = buildFooter();
    wireNav();
    wireLightbox();

    document.title = (document.body.getAttribute("data-title") || "") +
      " · " + D.config.leagueShortName;

    if (D.pages && typeof D.pages[page] === "function") {
      try { D.pages[page](); }
      catch (err) { console.error("[DATSU] Problem rendering the " + page + " page:", err); }
    }
  }

  function start() {
    D.loadFromSheet().then(render, render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
