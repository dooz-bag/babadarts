/* ===========================================================================
   DATSU — PAGE BUILDERS
   One function per page. Each one fills in the empty <div>s in the HTML.

   Nothing in here assumes how many groups there are or how many players are
   in them — it all comes from data/players.js.
   =========================================================================== */

(function () {
  var D = window.DATSU;
  var U = D.util;
  D.pages = {};

  function $(id) { return document.getElementById(id); }
  function set(id, html) { var el = $(id); if (el) el.innerHTML = html; }

  /* ================================================== reusable pieces === */

  // Groups get a different accent colour each, cycling if there are lots.
  var ACCENTS = ["accent", "accent-cool", "accent-warm", "accent-good"];
  function groupAccent(i) { return ACCENTS[i % ACCENTS.length]; }

  function playerCellHtml(player) {
    return '<span class="player-cell">' +
      D.avatarHtml(player) +
      '<span><span class="flag">' + U.esc(player.flag) + '</span> ' + U.esc(player.name) +
      '<br><span class="dl">' + U.esc(player.dartslive) + '</span></span>' +
      '</span>';
  }

  function outlookTag(outlook) {
    var map = { bye: "tag-bye", in: "tag-in", hunt: "tag-hunt", out: "tag-out" };
    return '<span class="tag ' + (map[outlook] || "tag-hunt") + '">' +
      U.esc(D.outlookLabel(outlook)) + '</span>';
  }

  function standingsTable(group, opts) {
    opts = opts || {};
    var rows = D.standings(group);
    var shape = D.playoffShape();
    var limit = opts.limit || rows.length;

    var body = rows.slice(0, limit).map(function (r) {
      // Dashed line under the last bye place and the last playoff place
      var cut = (r.pos === shape.byesPerGroup || r.pos === shape.perGroup) && limit >= r.pos + 1;
      return '<tr class="zone-' + r.zone + (cut ? ' cutline' : '') + '">' +
        '<td><span class="pos">' + r.pos + '</span></td>' +
        '<td>' + playerCellHtml(r.player) + '</td>' +
        '<td class="num">' + r.played + '</td>' +
        '<td class="num"><strong>' + r.won + '</strong></td>' +
        '<td class="num">' + r.lost + '</td>' +
        '<td class="num">' + r.legsFor + '</td>' +
        '<td class="num">' + r.legsAgainst + '</td>' +
        '<td class="num">' + U.signed(r.legDiff) + '</td>' +
        (opts.showAverages === false ? '' :
          '<td class="num">' + U.num(r.ppd) + '</td>' +
          '<td class="num">' + U.num(r.mpr) + '</td>') +
        (opts.showOutlook === false ? '' : '<td>' + outlookTag(r.outlook) + '</td>') +
        '</tr>';
    }).join("");

    return '<div class="table-wrap"><table class="data">' +
      '<thead><tr>' +
      '<th>#</th><th>Player</th>' +
      '<th class="num" title="Played">P</th>' +
      '<th class="num" title="Matches Won">W</th>' +
      '<th class="num" title="Matches Lost">L</th>' +
      '<th class="num" title="Legs won">LF</th>' +
      '<th class="num" title="Legs lost">LA</th>' +
      '<th class="num" title="Leg difference">+/-</th>' +
      (opts.showAverages === false ? '' : '<th class="num" title="01 average, points per dart">PPD</th><th class="num" title="Cricket average, marks per round">MPR</th>') +
      (opts.showOutlook === false ? '' : '<th>Outlook</th>') +
      '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  function resultRowHtml(m) {
    var pa = D.player(m.a), pb = D.player(m.b);
    var s = D.legScore(m);
    var legs = (m.legs || []).map(function (leg) {
      var isCricket = String(leg.game).toLowerCase() === "cricket";
      var unit = isCricket ? "MPR" : "PPD";
      var label = isCricket ? "Cricket" : (leg.game && leg.game !== "leg" ? U.esc(leg.game) : U.esc(D.config.rules.game1));
      var hasStats = (typeof leg.aStat === "number" && !isNaN(leg.aStat)) || (typeof leg.bStat === "number" && !isNaN(leg.bStat));
      var statsSpan = hasStats ? ' <span class="muted">(' + U.num(leg.aStat) + " / " + U.num(leg.bStat) + ' ' + unit + ')</span>' : '';
      return '<span class="leg-pill">' + label + ' \u2192 ' + U.esc(D.player(leg.winner).name) + statsSpan + '</span>';
    }).join("");

    return '<div class="result-row">' +
      '<span class="p' + (s.a > s.b ? ' winner' : '') + '">' + D.avatarHtml(pa) +
      '<span class="nm">' + U.esc(pa.flag) + ' ' + U.esc(pa.name) + '</span></span>' +
      '<span class="score">' + s.a + ' \u2013 ' + s.b + '</span>' +
      '<span class="p right' + (s.b > s.a ? ' winner' : '') + '">' +
      '<span class="nm">' + U.esc(pb.name) + ' ' + U.esc(pb.flag) + '</span>' + D.avatarHtml(pb) + '</span>' +
      '<span class="legs-detail">' + legs + '</span>' +
      '</div>';
  }

  /* Leader cards cycle through the accent colours, so a row of them is not
     all one shade. Pass a colour name to pin one. */
  var leaderTint = 0;
  function leaderCard(category, leader, unit, sub, colour) {
    var tint = colour || ACCENTS[leaderTint++ % ACCENTS.length];
    if (!leader) {
      return '<div class="leader tint-' + tint + '"><div class="cat">' + U.esc(category) + '</div>' +
        '<div class="val muted">\u2013</div><div class="sub">No results yet</div></div>';
    }
    var p = leader.stats.player;
    return '<div class="leader tint-' + tint + '">' +
      '<div class="cat">' + U.esc(category) + '</div>' +
      '<div class="val ' + tint + '">' + U.num(leader.value) + '</div>' +
      '<div class="who">' + U.esc(p.flag) + ' ' + U.esc(p.name) + '</div>' +
      '<div class="sub">' + U.esc(unit || "") + (sub ? ' \u00b7 ' + U.esc(sub) : '') + '</div>' +
      '</div>';
  }

  /* Same idea as leaderCard() above, but wrapped in a soft diffused neon
     glow that picks up the tint colour — used for the "Best of the season"
     boxes on an archive page, where the headline stats deserve to stand out
     a bit more than a normal stat card. `kind` controls how the value is
     formatted: "num" (2dp average), "int" (whole number) or "pct" (1dp %). */
  function seasonLeaderCard(category, leader, tint, kind, sub) {
    if (!leader) {
      return '<div class="leader neon tint-' + tint + '" style="--glow:var(--' + tint + ')">' +
        '<div class="cat">' + U.esc(category) + '</div>' +
        '<div class="val muted">\u2013</div><div class="sub">No results yet</div></div>';
    }
    var p = leader.stats.player;
    var val = kind === "pct" ? U.num(leader.value, 1) + "%"
      : kind === "int" ? String(Math.round(leader.value))
      : U.num(leader.value);
    return '<div class="leader neon tint-' + tint + '" style="--glow:var(--' + tint + ')">' +
      '<div class="cat">' + U.esc(category) + '</div>' +
      '<div class="val ' + tint + '">' + val + '</div>' +
      '<div class="who">' + U.esc(p.flag ? p.flag + " " : "") + U.esc(p.name) + '</div>' +
      '<div class="sub">' + U.esc(sub || "") + '</div>' +
      '</div>';
  }

  // "Group A", "Group B" ... plus how many are in it
  function groupHeading(group, i, extra) {
    return '<h2 class="' + groupAccent(i) + '">Group ' + U.esc(group) +
      ' <span class="muted" style="font-size:.7em">' + D.groupSize(group) + ' players</span></h2>' +
      (extra || "");
  }

  /* ================================================== shared: bracket === */

  function bracketSideHtml(s) {
    if (!s) return '<div class="side pending"><span class="nm">TBC</span></div>';
    return '<div class="side' + (s.pending ? ' pending' : '') + (s.won ? ' win' : '') + '">' +
      '<span class="nm">' +
      (s.label ? '<span class="seed">' + U.esc(s.label) + '</span>' : '') +
      U.esc(s.flag ? s.flag + " " : "") + U.esc(s.name) +
      '</span>' +
      '<span class="mono">' + (s.score === undefined ? '' : U.esc(s.score)) + '</span>' +
      '</div>';
  }

  function bracketCellHtml(tie) {
    if (tie.kind === "empty") {
      return '<div class="bracket-cell is-empty"><div class="tie"></div></div>';
    }
    if (tie.kind === "bye") {
      return '<div class="bracket-cell"><div class="tie tie-bye">' +
        bracketSideHtml(tie.home) +
        '<div class="fmt"><span>' + U.esc(tie.id) + '</span><span>Bye \u2014 straight through</span></div>' +
        '</div></div>';
    }
    return '<div class="bracket-cell"><div class="tie">' +
      bracketSideHtml(tie.home) + bracketSideHtml(tie.away) +
      '<div class="fmt"><span>' + U.esc(tie.id) + '</span></div>' +
      '</div></div>';
  }

  function bracketHtml() {
    var rounds = D.projectedBracket();
    if (!rounds.length) {
      return '<p class="muted">Not enough players for a bracket yet.</p>';
    }
    var html = rounds.map(function (r) {
      return '<div class="bracket-round">' +
        '<h4 class="bracket-round-title">' + U.esc(r.name) +
        (r.format ? '<span>' + U.esc(r.format) + '</span>' : '') + '</h4>' +
        '<div class="bracket-cells">' + r.ties.map(bracketCellHtml).join("") + '</div>' +
        '</div>';
    }).join("");

    // --cells tells the CSS how tall the first column needs to be
    return '<div class="bracket-scroll">' +
      '<div class="bracket" style="--cells:' + rounds[0].ties.length + '">' + html + '</div>' +
      '</div>';
  }

  /* ============================================================= HOME === */

  /* One thing only: is a league on, and what it's called.
     Green glow when it's running, amber when it isn't — nothing else on it. */
  function statusBadgeHtml() {
    var st = D.config.status;
    var on = st.running !== false;
    return '<div class="status-badge ' + (on ? 'is-on' : 'is-off') + '">' +
      '<span class="status-dot"></span>' +
      '<span class="status-text">' +
      '<strong>' + U.esc(st.seasonName) + '</strong>' +
      '<span>' + (on ? 'Running now' : 'Not running at the moment') + '</span>' +
      '</span>' +
      '</div>';
  }

  D.pages.home = function () {
    var cfg = D.config;
    var groups = D.groups();
    var shape = D.playoffShape();

    var words = cfg.leagueName.split(" ");
    set("hero-title", '<span class="accent">' + U.esc(words[0]) + '</span> ' +
      U.esc(words.slice(1).join(" ")));
    set("hero-sub", U.esc(cfg.tagline) + " Soft tip, DARTSLIVE, and a running commentary nobody asked for.");
    set("hero-art", D.logoSvg("100%"));

    set("hero-chips",
      '<span class="chip"><strong>' + D.activePlayers().length + '</strong> players</span>' +
      '<span class="chip"><strong>' + groups.length + '</strong> group' + (groups.length === 1 ? '' : 's') + '</span>' +
      '<span class="chip"><strong>' + U.esc(cfg.rules.matchFormat) + '</strong></span>' +
      '<span class="chip">' + U.esc(cfg.rules.game1) + ' \u2192 ' + U.esc(cfg.rules.game2) + ' \u2192 <strong>cork choice</strong></span>' +
      '<span class="chip">' + U.esc(cfg.venue.name) + '</span>');

    set("status-board", statusBadgeHtml());

    /* A single quip, quietly, instead of a scrolling marquee */
    var quip = cfg.quips[Math.floor(Math.random() * cfg.quips.length)];
    set("quip-line", '<div class="wrap"><em>\u201c</em>' + U.esc(quip) + '<em>\u201d</em></div>');

    /* The most recent results, however long ago that was */
    var nights = D.matchNights();
    if (nights.length) {
      var n = nights[0];
      set("latest-results",
        '<p class="date-head">' + U.esc(U.weekday(n.date)) + ' ' + U.esc(U.date(n.date)) + '</p>' +
        n.matches.map(resultRowHtml).join(""));
    } else {
      set("latest-results", '<div class="card"><p class="muted">No results in yet. Get corking.</p></div>');
    }

    /* Group tables — one per group, however many there are */
    set("race-intro", 'Top ' + shape.perGroup + ' in each group make the playoffs.');
    set("mini-tables", groups.map(function (g, i) {
      return '<div>' +
        '<h3 class="' + groupAccent(i) + '">Group ' + U.esc(g) + '</h3>' +
        standingsTable(g, { showAverages: false, showOutlook: false }) +
        '</div>';
    }).join(""));

    var mt = $("mini-tables");
    if (mt) {
      // Two across on a wide screen, one per row on a narrow one
      mt.className = "grid " + (groups.length >= 3 ? "grid-3" : "grid-2");
    }

    /* Leaders snapshot */
    var L = D.leaders();
    leaderTint = 0;
    set("home-leaders",
      leaderCard("Best 01 average", L.best01, "01 Avg") +
      leaderCard("Best cricket average", L.bestCricket, "Cricket Avg") +
      leaderCard("Best overall index", L.bestOverall, "ダーツ Index"));

    /* Photos of the bar. Drop real files into assets/img/hub/ to replace
       the placeholders — the file names are shown on screen. */
    set("hub-photos", [
      { src: "assets/img/hub/board.jpg", caption: "Our board. Hers now, apparently." },
      { src: "assets/img/hub/bar.jpg", caption: "The bar. Scene of many excuses." },
      { src: "assets/img/hub/league-night.jpg", caption: "A normal Tuesday." }
    ].map(D.photoHtml).join(""));
  };

  /* =========================================================== LEAGUE === */

  D.pages.league = function () {
    var rules = D.config.rules;
    var shape = D.playoffShape();
    var groups = D.groups();

    var byeLine = shape.byesPerGroup > 0
      ? 'The top <strong>' + shape.byesPerGroup + '</strong> in each group skip round one. '
      : 'Everyone who qualifies plays in round one. ';

    set("league-intro",
      'Top <strong>' + shape.perGroup + '</strong> in each group make the playoffs. ' + byeLine +
      'Rankings are ordered by <strong>match wins (W)</strong>, with ties decided by <strong>leg difference (+/-)</strong>, ' +
      'then a <strong>head-to-head decider match</strong>.');

    var legend =
      '<div class="legend">' +
      (shape.byesPerGroup > 0 ? '<span class="l-bye">Round-one bye (top ' + shape.byesPerGroup + ')</span>' : '') +
      '<span class="l-po">Qualified for Playoff' +
      (shape.byesPerGroup > 0 ? ' (' + (shape.byesPerGroup + 1) + '\u2013' + shape.perGroup + ')' : ' (top ' + shape.perGroup + ')') +
      '</span>' +
      '<span class="l-out">Did not Qualify</span>' +
      '</div>';

    /* One section per group */
    set("group-tables", groups.map(function (g, i) {
      var played = D.roundsInGroup(g);
      return '<section class="section" style="padding-top:0">' +
        groupHeading(g, i, '<p class="muted tiny" style="margin-top:-6px">Everyone plays everyone once \u2014 ' +
          played + ' match' + (played === 1 ? '' : 'es') + ' each, whenever you can get down to the bar.</p>') +
        standingsTable(g) + legend +
        '</section>';
    }).join(""));

    /* --------------------------------- this season's stats & leaders --- */
    buildSortableStatsTable("season-stats-table", "seasonStatsTable", statsRowsFrom(D.allStats()), "index");

    set("season-stats-help",
      '<div class="card card-accent-cool"><h3>What am I looking at?</h3>' +
      '<p><strong>01 Avg (PPD)</strong> \u2014 points per dart in the ' + U.esc(D.config.rules.game1) +
      ' legs, stats from DARTSLIVE result screen. Higher is better.</p>' +
      '<p><strong>Cricket Avg (MPR)</strong> \u2014 marks per round in cricket.</p>' +
      '<p><strong>ダーツ Index</strong> \u2014 our single rating combining the two, where 60 PPD in 01 and ' +
      '2.5 MPR in cricket would score 100.</p>' +
      '<p class="muted tiny">Tap any column heading to re-sort the table.</p></div>');

    var L = D.leaders();
    leaderTint = 0;
    set("season-records-leaders",
      leaderCard("Best overall index", L.bestOverall, "ダーツ Index") +
      leaderCard("Best 01 average", L.best01, "01 Avg", "season") +
      leaderCard("Best cricket average", L.bestCricket, "Cricket Avg", "season") +
      leaderCard("Most wins", L.mostWins, "matches won") +
      leaderCard("Best win rate", L.bestWinPct, "%"));

    set("season-records-games",
      leaderCard("Highest single 01 game", L.high01Game, "PPD",
        L.high01Game ? "v " + D.playerName(L.high01Game.stats.best01.opponent) : "", "accent") +
      leaderCard("Highest single cricket game", L.highCricketGame, "MPR",
        L.highCricketGame ? "v " + D.playerName(L.highCricketGame.stats.bestCricket.opponent) : "", "accent-cool"));

    /* ------------------------------ this season's match history collapse --- */
    var seasonMatches = D.sortedMatches() || [];
    if (seasonMatches.length) {
      set("season-matches-collapse",
        '<details class="results-collapse">' +
        '<summary class="results-summary">' +
        '<span class="results-summary-title">Season match history</span>' +
        '<span class="results-summary-count">' + seasonMatches.length + ' ' + (seasonMatches.length === 1 ? 'match' : 'matches') + '</span>' +
        '<span class="results-summary-arrow" aria-hidden="true">\u25be</span>' +
        '</summary>' +
        '<div class="results-collapse-content">' +
        seasonMatches.map(resultRowHtml).join("") +
        '</div>' +
        '</details>');
    } else {
      set("season-matches-collapse", "");
    }
  };

  /* ========================================================= PLAYOFFS === */

  D.pages.playoffs = function () {
    var rules = D.config.rules;
    var shape = D.playoffShape();
    var started = D.config.status.playoffsStarted;
    var rounds = D.projectedBracket();

    set("playoff-intro",
      (started
        ? 'The bracket as it stands.'
        : 'The league is still running, so this is the bracket <strong>as if the season ended today</strong>. ' +
        'It updates itself the moment new results go in.') +
      ' <strong>' + shape.qualifiers + '</strong> players qualify (top ' + shape.perGroup +
      ' from each of the ' + shape.groups.length + ' groups) into a <strong>' + shape.bracketSize +
      '</strong>-place bracket' +
      (shape.byes > 0 ? ', which means <strong>' + shape.byes + '</strong> round-one byes for the highest seeds' : '') +
      '.');

    set("bracket", bracketHtml());

    set("bracket-note", rounds.length
      ? 'Formats: ' + rounds.map(function (r) { return U.esc(r.name) + ' \u2014 ' + U.esc(r.format); }).join(' \u00b7 ') +
        '. Scroll sideways on a phone to follow it across.'
      : '');

    /* Who's safe, who's sweating */
    var buckets = { bye: [], in: [], hunt: [], out: [] };
    shape.groups.forEach(function (g) {
      D.standings(g).forEach(function (r) {
        buckets[r.outlook].push({ row: r, group: g });
      });
    });

    function bucketCard(title, key, colour, blurb) {
      var list = buckets[key];
      return '<div class="card">' +
        '<h3 class="' + colour + '">' + U.esc(title) + ' <span class="muted">(' + list.length + ')</span></h3>' +
        '<p class="muted tiny">' + U.esc(blurb) + '</p>' +
        (list.length
          ? '<ul class="notes" style="flex-direction:column;align-items:flex-start">' +
          list.map(function (x) {
            return '<li>' + U.esc(x.row.player.flag + " " + x.row.player.name) +
              ' \u00b7 ' + x.group + x.row.pos + ' \u00b7 ' + x.row.won + ' win' + (x.row.won === 1 ? '' : 's') + '</li>';
          }).join("") + '</ul>'
          : '<p class="muted">Nobody yet.</p>') +
        '</div>';
    }

    var cards = "";
    if (shape.byesPerGroup > 0) {
      cards += bucketCard("Bye secured", "bye", "accent-gold",
        "Mathematically cannot drop out of the top " + shape.byesPerGroup + ".");
    }
    cards +=
      bucketCard("Playoffs secured", "in", "accent-good", "In the top " + shape.perGroup + " no matter what happens.") +
      bucketCard("In the hunt", "hunt", "accent-warm", "Still alive. Still terrifying.") +
      bucketCard("Eliminated", "out", "muted", "Cannot reach the top " + shape.perGroup + ". Bar duty.");
    set("outlook-cards", cards);

    var oc = $("outlook-cards");
    if (oc) oc.className = "grid " + (shape.byesPerGroup > 0 ? "grid-4" : "grid-3");

    /* Describe the actual round-one pairings rather than hard-coding them */
    var firstRound = rounds.length ? rounds[0] : null;
    var pairings = firstRound
      ? firstRound.ties.filter(function (t) { return t.kind === "tie"; })
        .map(function (t) { return t.home.label + " v " + t.away.label; }).join(", ")
      : "";

    set("scenario-note",
      '<div class="card card-accent-cool"><h3>How to read the outlook</h3>' +
      '<p>The site works out the maximum number of match wins every player could still reach if they won all of ' +
      'their remaining matches, then compares that with everyone else. It ignores leg-difference ' +
      'tiebreaks, so treat the labels as a very good guide rather than gospel.</p>' +
      (pairings
        ? '<p class="muted tiny">Seeds are interleaved across the groups, so the opening round is: ' +
          U.esc(pairings) + '.</p>'
        : '') +
      '</div>');
  };

  /* ================================================ STATS & RECORDS === */

  var STAT_COLS = [
    { key: "name", label: "Player", type: "text" },
    { key: "group", label: "Grp", type: "text" },
    { key: "formSort", label: "Last 5", type: "text" },
    { key: "played", label: "P", type: "num", dp: 0 },
    { key: "won", label: "W", type: "num", dp: 0 },
    { key: "lost", label: "L", type: "num", dp: 0 },
    { key: "winPct", label: "Win %", type: "num", dp: 1 },
    { key: "ppd", label: "01 Avg", type: "num", dp: 2 },
    { key: "mpr", label: "Cricket Avg", type: "num", dp: 2 },
    { key: "index", label: "Index", type: "num", dp: 1 },
    { key: "best01", label: "Best 01", type: "num", dp: 2 },
    { key: "bestCricket", label: "Best Cricket", type: "num", dp: 2 }
  ];

  // Same shape whether it's this season's stats or a player's whole career.
  function statsRowsFrom(statsList) {
    return statsList.map(function (s) {
      return {
        player: s.player,
        name: s.player.name,
        group: s.player.group === "?" ? "\u2013" : s.player.group,
        played: s.played, won: s.won, lost: s.lost,
        winPct: s.winPct, ppd: s.ppd, mpr: s.mpr, index: s.index,
        best01: s.best01 ? s.best01.value : null,
        bestCricket: s.bestCricket ? s.bestCricket.value : null,
        form: s.form,
        formSort: s.form.slice(0, 5).join("")
      };
    });
  }

  // Builds one sortable stats table into `containerId`. Used for both this
  // season's table and the career/all-time one — same columns, different data.
  function buildSortableStatsTable(containerId, tableId, data, defaultSortKey, opts) {
    opts = opts || {};
    var showGroup = opts.showGroup !== false;
    var cols = showGroup ? STAT_COLS : STAT_COLS.filter(function (c) { return c.key !== "group"; });
    var sortKey = defaultSortKey || "index", sortDir = -1;

    function draw() {
      data.sort(function (x, y) {
        var a = x[sortKey], b = y[sortKey];
        if (a === null || a === undefined) a = -Infinity;
        if (b === null || b === undefined) b = -Infinity;
        if (typeof a === "string") return sortDir * a.localeCompare(b);
        return sortDir * (a - b);
      });

      var head = cols.map(function (c) {
        var cls = (c.type === "num" ? "num" : "") +
          (c.key === sortKey ? (sortDir === -1 ? " sorted-desc" : " sorted-asc") : "");
        return '<th class="' + cls + '" data-key="' + c.key + '">' + U.esc(c.label) + '</th>';
      }).join("");

      var body = data.map(function (r) {
        var form = (r.form || []).slice(0, 5).map(function (f) {
          return '<span class="' + (f === "W" ? "accent-good" : "muted") + '">' + f + '</span>';
        }).join("");
        return '<tr>' +
          '<td>' + playerCellHtml(r.player) + '</td>' +
          (showGroup ? ('<td>' + U.esc(r.group) + '</td>') : '') +
          '<td class="mono">' + (form || '<span class="muted">\u2013</span>') + '</td>' +
          '<td class="num">' + r.played + '</td>' +
          '<td class="num">' + r.won + '</td>' +
          '<td class="num">' + r.lost + '</td>' +
          '<td class="num">' + U.num(r.winPct, 1) + '</td>' +
          '<td class="num"><strong class="accent-cool">' + U.num(r.ppd) + '</strong></td>' +
          '<td class="num"><strong class="accent">' + U.num(r.mpr) + '</strong></td>' +
          '<td class="num">' + U.num(r.index, 1) + '</td>' +
          '<td class="num">' + U.num(r.best01) + '</td>' +
          '<td class="num">' + U.num(r.bestCricket) + '</td>' +
          '</tr>';
      }).join("");

      set(containerId,
        '<div class="table-wrap"><table class="data sortable" id="' + tableId + '">' +
        '<thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>');

      var table = $(tableId);
      if (!table) return;
      table.querySelectorAll("thead th").forEach(function (th) {
        th.addEventListener("click", function () {
          var k = th.getAttribute("data-key");
          if (k === sortKey) sortDir = -sortDir;
          else { sortKey = k; sortDir = (k === "name" || k === "group") ? 1 : -1; }
          draw();
        });
      });
    }

    draw();
  }

  D.pages.stats = function () {
    /* -------------------------------------------------- career averages --- */
    var history = D.history || [];
    var careerRows = statsRowsFrom(D.allCareerStats());

    set("career-intro", history.length
      ? 'Every league and tournament on record combined — this season plus ' +
        history.length + ' logged result' + (history.length === 1 ? '' : 's') + ' from before it.'
      : 'All logged results across every season and tournament combined into overall career averages.');

    /* All-time leader cards (requires min 5 games played) */
    var CL = D.careerLeaders(5);
    leaderTint = 0;
    set("records-alltime",
      leaderCard("Best overall index — career", CL.bestOverall, "ダーツ Index") +
      leaderCard("Best 01 average — career", CL.best01, "01 Avg") +
      leaderCard("Best cricket average — career", CL.bestCricket, "Cricket Avg") +
      leaderCard("Most career wins", CL.mostWins, "matches won") +
      leaderCard("Best career win rate", CL.bestWinPct, "%") +
      leaderCard("All-time high 01 game", CL.high01Game, "PPD",
        CL.high01Game && CL.high01Game.stats && CL.high01Game.stats.best01 ? "v " + D.playerName(CL.high01Game.stats.best01.opponent) : "", "accent") +
      leaderCard("All-time high cricket game", CL.highCricketGame, "MPR",
        CL.highCricketGame && CL.highCricketGame.stats && CL.highCricketGame.stats.bestCricket ? "v " + D.playerName(CL.highCricketGame.stats.bestCricket.opponent) : "", "accent-cool"));

    /* Sortable overall career table (without Group column) */
    buildSortableStatsTable("stats-table", "careerStatsTable", careerRows, "played", { showGroup: false });

    set("stats-help",
      '<div class="card card-accent-cool"><h3>What am I looking at?</h3>' +
      '<p><strong>01 Avg (PPD)</strong> — career points per dart in 01 legs across all games.</p>' +
      '<p><strong>Cricket Avg (MPR)</strong> — career marks per round in cricket across all games.</p>' +
      '<p><strong>ダーツ Index</strong> — our single rating combining the two, where 60 PPD in 01 and ' +
      '2.5 MPR in cricket would score 100.</p>' +
      '<p class="muted tiny"><strong>* Note on career leaderboards:</strong> A minimum of <strong>5 matches played</strong> is required to qualify for career leader cards. Tap any column heading to re-sort the table. Looking for this season only? Head over to the <a href="league.html#season-stats">League Table</a> page.</p></div>');

    /* Roll of honour from the archive */
    var champs = (D.archive || []).filter(function (a) { return a.champion; });
    set("roll-of-honour", champs.length
      ? '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>Competition</th><th>When</th><th>Champion</th><th>Runner-up</th><th></th>' +
      '</tr></thead><tbody>' +
      champs.map(function (a) {
        return '<tr>' +
          '<td>' + U.esc(a.name) + '</td>' +
          '<td class="muted">' + U.esc(a.dates) + '</td>' +
          '<td><strong class="accent-good">' + U.esc(a.champion) + '</strong></td>' +
          '<td class="muted">' + U.esc(a.runnerUp || "\u2013") + '</td>' +
          '<td><a href="season.html?s=' + encodeURIComponent(a.id) + '">View \u2192</a></td>' +
          '</tr>';
      }).join("") + '</tbody></table></div>'
      : '<p class="muted">No past competitions recorded yet.</p>');
  };

  /* ========================================================== PLAYERS === */

  D.pages.players = function () {
    // Collect everyone who has ever played or is registered in D.players
    var seen = {};
    var allPlayers = [];

    (D.players || []).forEach(function (p) {
      if (p.id && !seen[p.id]) {
        seen[p.id] = true;
        allPlayers.push(p);
      }
    });

    // Also include any player id appearing in matches/history who might not be in players.js
    (D.allMatchesEver ? D.allMatchesEver() : []).forEach(function (m) {
      [m.a, m.b].forEach(function (id) {
        if (id && !seen[id]) {
          seen[id] = true;
          allPlayers.push(D.player(id));
        }
      });
    });

    // Sort alphabetically by name
    allPlayers.sort(function (a, b) {
      return (a.name || a.id).localeCompare(b.name || b.id);
    });

    var countries = {};
    allPlayers.forEach(function (p) { if (p.country) countries[p.country] = 1; });
    var countryCount = Object.keys(countries).length;

    set("players-intro",
      'All ' + allPlayers.length + ' players who have ever graced the league' +
      (countryCount ? ', hailing from ' + countryCount + ' ' + (countryCount === 1 ? 'country' : 'countries') : '') +
      '. Career averages combine this season and all past competitions.');

    var cardsHtml = allPlayers.map(function (p) {
      var s = D.careerStatsFor(p.id);
      var countryLine = [p.flag, p.country].filter(Boolean).join(" ");

      return '<div class="card">' +
        '<div class="player-card">' + D.avatarHtml(p, true) +
        '<div class="meta">' +
        '<div class="nm">' + U.esc(p.name) + '</div>' +
        (p.dartslive ? '<div class="dl">' + U.esc(p.dartslive) + '</div>' : '') +
        (countryLine ? '<div class="muted tiny">' + U.esc(countryLine) + '</div>' : '') +
        '</div></div>' +
        '<div class="chips">' +
        '<span class="chip">Record <strong>' + s.won + '\u2013' + s.lost + '</strong></span>' +
        '<span class="chip">01 Avg <strong>' + U.num(s.ppd) + '</strong></span>' +
        '<span class="chip">Cricket Avg <strong>' + U.num(s.mpr) + '</strong></span>' +
        '<span class="chip">ダーツ Index <strong>' + U.num(s.index, 1) + '</strong></span>' +
        '</div>' +
        (p.notes && p.notes.length
          ? '<ul class="notes">' + p.notes.map(function (n) { return '<li>' + U.esc(n) + '</li>'; }).join("") + '</ul>'
          : '') +
        '</div>';
    }).join("");

    set("player-grid-section",
      '<section class="section" style="padding-top:0">' +
      '<div class="grid grid-3">' + cardsHtml + '</div>' +
      '</section>');
  };

  /* ========================================================== ARCHIVE === */

  D.pages.archive = function () {
    var items = D.archive || [];
    if (!items.length) {
      set("archive-grid", '<p class="muted">Nothing archived yet.</p>');
      return;
    }
    set("archive-grid", items.map(function (a) {
      return '<a class="card card-accent" href="season.html?s=' + encodeURIComponent(a.id) + '" style="display:block;color:inherit">' +
        '<p class="eyebrow">' + U.esc(a.type === "tournament" ? "Tournament" : "League") + ' \u00b7 ' + U.esc(a.dates) + '</p>' +
        '<h3>' + U.esc(a.name) + '</h3>' +
        '<p><span class="muted tiny">Champion</span><br><strong class="accent-good">' + U.esc(a.champion || "TBC") + '</strong></p>' +
        (a.runnerUp ? '<p class="muted tiny">Runner-up: ' + U.esc(a.runnerUp) + '</p>' : '') +
        '<p class="muted tiny">' + U.esc((a.photos || []).length) + ' photo(s) \u00b7 ' + U.esc((a.results || []).length) + ' round(s) of results</p>' +
        '<p class="accent-cool">View the page \u2192</p>' +
        '</a>';
    }).join(""));
  };

  /* =========================================================== SEASON === */

  D.pages.season = function () {
    var id = new URLSearchParams(window.location.search).get("s");
    var a = id ? D.archiveItem(id) : null;

    if (!a) {
      set("season-body",
        '<div class="card"><h2>Can\'t find that one</h2>' +
        '<p>Either the link is wrong or it hasn\'t been added to the archive yet.</p>' +
        '<p><a class="btn" href="archive.html">Back to the archive</a></p></div>');
      return;
    }

    document.body.setAttribute("data-title", a.name);
    document.title = a.name + " \u00b7 " + D.config.leagueShortName;

    var autoMatches = D.archiveMatches(a.id);
    var playoffs = D.archivePlayoffs(a.id);
    var autoStats = D.archiveStats(a.id); // regular season matches only (where !m.round)

    var champName = a.champion || (playoffs.champion ? (playoffs.champion.flag ? playoffs.champion.flag + " " : "") + playoffs.champion.name : "TBC");
    var runnerUpName = a.runnerUp || (playoffs.runnerUp ? (playoffs.runnerUp.flag ? playoffs.runnerUp.flag + " " : "") + playoffs.runnerUp.name : "");

    var html = "";

    html += '<p class="eyebrow">' + U.esc(a.type === "tournament" ? "Tournament" : "League") + ' \u00b7 ' + U.esc(a.dates) + '</p>';
    html += '<h1>' + U.esc(a.name) + '</h1>';
    if (a.blurb) html += '<p class="hero-sub">' + U.esc(a.blurb) + '</p>';

    html += '<div class="chips">' +
      '<span class="chip">Champion <strong class="accent-good">' + U.esc(champName) + '</strong></span>' +
      (runnerUpName ? '<span class="chip">Runner-up <strong>' + U.esc(runnerUpName) + '</strong></span>' : '') +
      (a.venue ? '<span class="chip">' + U.esc(a.venue) + '</span>' : '') +
      '</div>';

    // Playoff knockout bracket
    var poRounds = [];
    if (playoffs.quarters.length) {
      poRounds.push({
        name: "Quarter-finals",
        ties: playoffs.quarters.map(function (m, i) {
          var s = D.legScore(m);
          var pa = D.player(m.a), pb = D.player(m.b);
          return {
            id: "QF-" + (i + 1),
            home: { name: pa.name, flag: pa.flag, score: s.a, won: s.a > s.b },
            away: { name: pb.name, flag: pb.flag, score: s.b, won: s.b > s.a }
          };
        })
      });
    }
    if (playoffs.semis.length) {
      poRounds.push({
        name: "Semi-finals",
        ties: playoffs.semis.map(function (m, i) {
          var s = D.legScore(m);
          var pa = D.player(m.a), pb = D.player(m.b);
          return {
            id: "SF-" + (i + 1),
            home: { name: pa.name, flag: pa.flag, score: s.a, won: s.a > s.b },
            away: { name: pb.name, flag: pb.flag, score: s.b, won: s.b > s.a }
          };
        })
      });
    }
    if (playoffs.finals.length) {
      poRounds.push({
        name: "Final",
        ties: playoffs.finals.map(function (m, i) {
          var s = D.legScore(m);
          var pa = D.player(m.a), pb = D.player(m.b);
          return {
            id: "Final",
            home: { name: pa.name, flag: pa.flag, score: s.a, won: s.a > s.b },
            away: { name: pb.name, flag: pb.flag, score: s.b, won: s.b > s.a }
          };
        })
      });
    }

    if (poRounds.length) {
      var maxCells = Math.max.apply(null, poRounds.map(function (r) { return r.ties.length; }));
      html += '<div class="section"><h2>Playoff bracket</h2>' +
        '<div class="bracket-scroll">' +
        '<div class="bracket" style="--cells:' + maxCells + '">' +
        poRounds.map(function (r) {
          return '<div class="bracket-round">' +
            '<h4 class="bracket-round-title">' + U.esc(r.name) + '</h4>' +
            '<div class="bracket-cells">' + r.ties.map(bracketCellHtml).join("") + '</div>' +
            '</div>';
        }).join("") +
        '</div></div></div>';
    }

    // Highlights: manual from archive.js, or a set of neon "best of the
    // season" boxes worked out automatically from the logged results.
    var highlights = (a.highlights && a.highlights.length) ? a.highlights : [];
    if (highlights.length) {
      html += '<div class="section"><h2>Highlights</h2><div class="grid grid-3">' +
        highlights.map(function (h) {
          return '<div class="card"><p class="eyebrow">' + U.esc(h.label) + '</p><p><strong>' + U.esc(h.value) + '</strong></p></div>';
        }).join("") + '</div></div>';
    } else if (autoMatches.length) {
      var allSeasonStats = D.archiveStats(a.id, true);
      var L = D.leadersFrom(allSeasonStats);
      html += '<div class="section"><h2>Best of the season</h2><div class="grid grid-3">' +
        seasonLeaderCard("Best 01 Average", L.best01, "accent", "num", "Season average") +
        seasonLeaderCard("Best Cricket Average", L.bestCricket, "accent-cool", "num", "Season average") +
        seasonLeaderCard("Highest 01 Game", L.high01Game, "accent-warm", "num", "Best single leg") +
        seasonLeaderCard("Highest Cricket Game", L.highCricketGame, "accent-good", "num", "Best single leg") +
        seasonLeaderCard("Most Wins", L.mostWins, "accent-gold", "int", "Matches won") +
        seasonLeaderCard("Highest Win %", L.bestWinPct, "accent-plum", "pct", "Min. 2 matches played") +
        '</div></div>';
    }

    if (a.results && a.results.length) {
      html += '<div class="section"><h2>Knockout results</h2>';
      html += a.results.map(function (r) {
        return '<div class="card" style="margin-bottom:10px"><p class="eyebrow">' + U.esc(r.round) + '</p><p>' + U.esc(r.text) + '</p></div>';
      }).join("");
      html += '</div>';
    }

    // League table from regular season results. Grouping is worked out from
    // the group column on the History tab's own rows (see D.archiveStats),
    // never from a player's current, live-season group in data/players.js --
    // which may well have changed by the time this page gets read.
    if (autoStats.length) {
      var groupsSeen = {};
      var groupsList = [];
      autoStats.forEach(function (s) {
        var g = s.group;
        if (g && !groupsSeen[g]) { groupsSeen[g] = true; groupsList.push(g); }
      });
      groupsList.sort();

      function renderArchiveTable(rows, title) {
        var spots = (a.playoffSpots || (D.config && D.config.rules && D.config.rules.playoffSpots)) || 6;
        var byes = a.byesPerGroup !== undefined ? a.byesPerGroup : ((D.config && D.config.rules && D.config.rules.byesPerGroup) || 0);

        var poPlayerIds = {};
        if (playoffs && playoffs.matches && playoffs.matches.length) {
          playoffs.matches.forEach(function (m) { poPlayerIds[m.a] = true; poPlayerIds[m.b] = true; });
        }

        var legend =
          '<div class="legend">' +
          (byes > 0 ? '<span class="l-bye">Bye (top ' + byes + ')</span>' : '') +
          '<span class="l-po">Qualified for Playoff' +
          (byes > 0 ? ' (' + (byes + 1) + '\u2013' + spots + ')' : (spots ? ' (top ' + spots + ')' : '')) +
          '</span>' +
          '<span class="l-out">Did not Qualify</span>' +
          '</div>';

        return '<div class="section">' +
          (title ? '<h3 style="margin-bottom:12px">' + U.esc(title) + '</h3>' : '') +
          '<div class="table-wrap"><table class="data">' +
          '<thead><tr><th>#</th><th>Player</th>' +
          '<th class="num" title="Played">P</th><th class="num" title="Won">W</th><th class="num" title="Lost">L</th>' +
          '<th class="num" title="Legs won">LF</th><th class="num" title="Legs lost">LA</th>' +
          '<th class="num" title="01 average, points per dart">01 Avg</th>' +
          '<th class="num" title="Best single-game 01 average">Best 01</th>' +
          '<th class="num" title="Cricket average, marks per round">Cricket Avg</th>' +
          '<th class="num" title="Best single-game cricket average">Best Cricket</th>' +
          '<th class="num" title="ダーツ Index — combined 01 + cricket rating">Index</th></tr></thead><tbody>' +
          rows.map(function (s, i) {
            var pos = i + 1;
            var qualified = Object.keys(poPlayerIds).length ? !!poPlayerIds[s.player.id] : (pos <= spots);
            var isBye = byes > 0 && pos <= byes;
            var zone = isBye ? "bye" : (qualified ? "playoff" : "out");
            var cut = (pos === byes || pos === spots) && rows.length >= pos + 1;

            return '<tr class="zone-' + zone + (cut ? ' cutline' : '') + '">' +
              '<td><span class="pos">' + pos + '</span></td>' +
              '<td>' + playerCellHtml(s.player) + '</td>' +
              '<td class="num">' + s.played + '</td>' +
              '<td class="num"><strong>' + s.won + '</strong></td>' +
              '<td class="num">' + s.lost + '</td>' +
              '<td class="num">' + s.legsFor + '</td>' +
              '<td class="num">' + s.legsAgainst + '</td>' +
              '<td class="num">' + U.num(s.ppd) + '</td>' +
              '<td class="num">' + U.num(s.best01 ? s.best01.value : null) + '</td>' +
              '<td class="num">' + U.num(s.mpr) + '</td>' +
              '<td class="num">' + U.num(s.bestCricket ? s.bestCricket.value : null) + '</td>' +
              '<td class="num">' + U.num(s.index, 1) + '</td></tr>';
          }).join("") + '</tbody></table></div>' + legend + '</div>';
      }

      html += '<div class="section"><h2>Regular season standings</h2>';
      if (groupsList.length > 1) {
        groupsList.forEach(function (g) {
          var gRows = autoStats.filter(function (s) { return s.group === g; });
          html += renderArchiveTable(gRows, "Group " + g);
        });
      } else {
        html += renderArchiveTable(autoStats);
      }
      html += '</div>';
    } else if (a.finalTable && a.finalTable.length) {
      var spotsFinal = (a.playoffSpots || (D.config && D.config.rules && D.config.rules.playoffSpots)) || 6;
      var byesFinal = a.byesPerGroup !== undefined ? a.byesPerGroup : ((D.config && D.config.rules && D.config.rules.byesPerGroup) || 0);

      var legendFinal =
        '<div class="legend">' +
        (byesFinal > 0 ? '<span class="l-bye">Bye (top ' + byesFinal + ')</span>' : '') +
        '<span class="l-po">Qualified for Playoff' +
        (byesFinal > 0 ? ' (' + (byesFinal + 1) + '\u2013' + spotsFinal + ')' : (spotsFinal ? ' (top ' + spotsFinal + ')' : '')) +
        '</span>' +
        '<span class="l-out">Did not Qualify</span>' +
        '</div>';

      html += '<div class="section"><h2>Final table</h2><div class="table-wrap"><table class="data">' +
        '<thead><tr><th>#</th><th>Player</th><th class="num">W</th><th class="num">L</th>' +
        '<th class="num">01 Avg</th><th class="num">Cricket Avg</th></tr></thead><tbody>' +
        a.finalTable.map(function (r) {
          var pNum = parseInt(r.pos, 10);
          var isBye = byesFinal > 0 && pNum <= byesFinal;
          var zone = isBye ? "bye" : (pNum <= spotsFinal ? "playoff" : "out");
          var cut = (pNum === byesFinal || pNum === spotsFinal) && a.finalTable.length >= pNum + 1;

          return '<tr class="zone-' + zone + (cut ? ' cutline' : '') + '"><td><span class="pos">' + U.esc(r.pos) + '</span></td>' +
            '<td>' + U.esc(r.player) + '</td>' +
            '<td class="num"><strong>' + U.esc(r.w) + '</strong></td>' +
            '<td class="num">' + U.esc(r.l) + '</td>' +
            '<td class="num">' + U.num(r.ppd) + '</td>' +
            '<td class="num">' + U.num(r.mpr) + '</td></tr>';
        }).join("") + '</tbody></table></div>' + legendFinal + '</div>';
    }

    if (autoMatches.length) {
      var regMatches = autoMatches.filter(function (m) { return !m.round; });
      var poMatches = autoMatches.filter(function (m) { return !!m.round; });

      var resultsBody = "";
      if (poMatches.length) {
        resultsBody += '<h3 style="margin:20px 0 12px">Playoff match results</h3>' +
          poMatches.map(resultRowHtml).join("");
      }
      if (regMatches.length) {
        resultsBody += '<h3 style="margin:20px 0 12px">' +
          (poMatches.length ? "Regular season match results" : "Match results") + '</h3>' +
          regMatches.map(resultRowHtml).join("");
      }

      html += '<div class="section">' +
        '<details class="results-collapse">' +
        '<summary class="results-summary">' +
        '<span class="results-summary-title">Individual match results</span>' +
        '<span class="results-summary-count">' + autoMatches.length + ' matches</span>' +
        '<span class="results-summary-arrow" aria-hidden="true">▾</span>' +
        '</summary>' +
        '<div class="results-collapse-content">' +
        resultsBody +
        '</div>' +
        '</details>' +
        '</div>';
    }

    if (a.photos && a.photos.length) {
      html += '<div class="section"><h2>Photos</h2><div class="gallery">' +
        a.photos.map(D.photoHtml).join("") + '</div></div>';
    }

    html += '<p style="margin-top:26px"><a class="btn btn-quiet" href="archive.html">\u2190 Back to the archive</a></p>';

    set("season-body", html);
  };

  /* ============================================================= JOIN === */

  D.pages.join = function () {
    var cfg = D.config;
    var c = cfg.contact || {};

    set("join-status", statusBadgeHtml());

    set("join-venue",
      '<h3>' + U.esc(cfg.venue.name) + '</h3>' +
      '<p class="muted">' + U.esc(cfg.venue.nameJa) + '<br>' + U.esc(cfg.venue.address) + '</p>' +
      (cfg.venue.note ? '<p>' + U.esc(cfg.venue.note) + '</p>' : '') +
      '<p><a class="btn btn-quiet" href="' + U.esc(cfg.venue.mapsUrl) + '" target="_blank" rel="noopener">Open in Google Maps</a></p>');

    /* The LINE card copes with having no details filled in yet: shows a
       button if there's a link, the @id as text if there's only that, and
       an honest "ask at the bar" if neither has been added to config.js. */
    var who = c.name ? U.esc(c.name) : "one of us";
    var html = '<p>Easier than turning up on the off-chance \u2014 message ' + who +
      ' on LINE and we\u2019ll let you know when people are heading down to play.</p>';

    if (c.lineUrl) {
      html += '<p><a class="btn" href="' + U.esc(c.lineUrl) + '" target="_blank" rel="noopener">Add us on LINE</a></p>';
      if (c.lineId) html += '<p class="muted tiny">Or search for <strong>' + U.esc(c.lineId) + '</strong></p>';
    } else if (c.lineId) {
      html += '<p>Search for this LINE ID:</p><p class="line-id">' + U.esc(c.lineId) + '</p>';
    } else {
      html += '<p class="muted">LINE details are going in here shortly \u2014 for now, just come down ' +
        'to the bar and ask whoever\u2019s at the board.</p>';
    }

    set("join-contact", html);
  };

  /* =========================================================== SUBMIT === */
  /* A phone-friendly form so results can be logged from the bar instead of
     editing data/matches.js by hand. It only appears once an admin has
     wired up docs/SUBMIT-RESULTS.md — until then this page just explains
     how to do that. Nothing about it is required for the rest of the site
     to work.                                                              */

  function pad2(n) { return n < 10 ? "0" + n : String(n); }
  function todayIso() {
    var d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function submitSetupCardHtml() {
    return '<div class="card card-accent-warm">' +
      '<h3 class="accent-warm">This form isn\u2019t wired up yet</h3>' +
      '<p>It posts results straight into the Google Sheet behind the site, so it needs a one-off ' +
      '15-minute setup first \u2014 a small Google Apps Script and a passcode you choose yourself.</p>' +
      '<p>Whoever runs the site should open <code>docs/SUBMIT-RESULTS.md</code> and follow it through, ' +
      'then paste the resulting URL into <code>resultsForm.submitUrl</code> in <code>data/config.js</code>.</p>' +
      '<p class="muted tiny">Until then, results go in the normal way \u2014 straight into ' +
      '<code>data/matches.js</code>, or typed into the Matches tab of the Google Sheet if one is ' +
      'already set up (see <code>docs/GOOGLE-SHEET.md</code>).</p>' +
      '</div>';
  }

  function legFieldsetHtml(n, defaultGame) {
    var g1 = U.esc(D.config.rules.game1), g2 = U.esc(D.config.rules.game2);
    return '<fieldset class="leg-fields">' +
      '<legend>Leg ' + n + (n === 3 ? ' <span class="muted">\u2014 only if it went to a decider</span>' : '') + '</legend>' +
      '<div class="field-row">' +
      '<div class="field"><label for="rf-g' + n + '-game">Game</label>' +
      '<select id="rf-g' + n + '-game">' +
      '<option value="701"' + (defaultGame === "701" ? ' selected' : '') + '>' + g1 + '</option>' +
      '<option value="cricket"' + (defaultGame === "cricket" ? ' selected' : '') + '>' + g2 + '</option>' +
      '</select></div>' +
      '<div class="field"><label for="rf-g' + n + '-winner">Winner</label>' +
      '<select id="rf-g' + n + '-winner"><option value="">\u2013</option></select></div>' +
      '<div class="field"><label id="rf-g' + n + '-a-label" for="rf-g' + n + '-a">Avg (Player A)</label>' +
      '<input type="number" step="0.01" min="0" inputmode="decimal" id="rf-g' + n + '-a"></div>' +
      '<div class="field"><label id="rf-g' + n + '-b-label" for="rf-g' + n + '-b">Avg (Player B)</label>' +
      '<input type="number" step="0.01" min="0" inputmode="decimal" id="rf-g' + n + '-b"></div>' +
      '</div></fieldset>';
  }

  function submitFormHtml() {
    var players = D.activePlayers().slice().sort(function (x, y) { return x.name.localeCompare(y.name); });
    var groups = D.groups();
    var cfg = D.config;

    var playerOpts = '<option value="">Choose\u2026</option>' + players.map(function (p) {
      return '<option value="' + U.esc(p.id) + '">' + U.esc(p.flag) + ' ' + U.esc(p.name) + '</option>';
    }).join("");

    var groupOpts = '<option value="">\u2013</option>' + groups.map(function (g) {
      return '<option value="' + U.esc(g) + '">Group ' + U.esc(g) + '</option>';
    }).join("");

    var sheetWarning = (!cfg.sheet || !cfg.sheet.enabled)
      ? '<p class="muted tiny">Heads up: this site is currently reading this season\u2019s results from ' +
        '<code>data/matches.js</code>, not the Google Sheet, so anything submitted here won\u2019t show up on ' +
        'the site until <code>sheet.enabled</code> is turned on in <code>data/config.js</code> ' +
        '(see <code>docs/GOOGLE-SHEET.md</code>). It still saves to the sheet either way.</p>'
      : '';

    return sheetWarning +
      '<form id="resultForm" class="card">' +
      '<div class="field-row">' +
      '<div class="field"><label for="rf-date">Date</label><input type="date" id="rf-date" value="' + todayIso() + '" required></div>' +
      '<div class="field checkbox-field"><label><input type="checkbox" id="rf-backfill"> Old result, from before this season</label></div>' +
      '</div>' +
      '<div class="field-row">' +
      '<div class="field"><label for="rf-a">Player A</label><select id="rf-a">' + playerOpts + '</select></div>' +
      '<div class="field"><label for="rf-b">Player B</label><select id="rf-b">' + playerOpts + '</select></div>' +
      '</div>' +
      '<div class="field-row">' +
      '<div class="field"><label for="rf-group">Group</label><select id="rf-group">' + groupOpts + '</select></div>' +
      '</div>' +
      legFieldsetHtml(1, "701") +
      legFieldsetHtml(2, "cricket") +
      legFieldsetHtml(3, "701") +
      '<div class="field-row">' +
      '<div class="field"><label for="rf-passcode">League passcode</label>' +
      '<input type="password" id="rf-passcode" autocomplete="off" required></div>' +
      '</div>' +
      '<div id="rf-msg" class="form-msg" aria-live="polite"></div>' +
      '<div class="btn-row"><button type="submit" class="btn" id="rf-submit">Submit result</button></div>' +
      '</form>';
  }

  function wireSubmitForm(submitUrl) {
    var form = $("resultForm");
    if (!form) return;
    var msg = $("rf-msg"), btn = $("rf-submit");

    function showMsg(kind, text) {
      msg.className = "form-msg is-" + kind;
      msg.textContent = text;
    }
    function showErr(text) { showMsg("err", text); return false; }

    function refreshWinnerOptions() {
      var aId = $("rf-a").value, bId = $("rf-b").value;
      [1, 2, 3].forEach(function (n) {
        var sel = $("rf-g" + n + "-winner");
        var current = sel.value;
        sel.innerHTML = '<option value="">\u2013</option>' +
          (aId ? '<option value="' + U.esc(aId) + '">' + U.esc(D.player(aId).name) + '</option>' : '') +
          (bId ? '<option value="' + U.esc(bId) + '">' + U.esc(D.player(bId).name) + '</option>' : '');
        sel.value = (current === aId || current === bId) ? current : "";
      });
    }

    function refreshAvgLabels() {
      var aId = $("rf-a").value, bId = $("rf-b").value;
      var aName = aId ? D.player(aId).name : "Player A";
      var bName = bId ? D.player(bId).name : "Player B";
      [1, 2, 3].forEach(function (n) {
        $("rf-g" + n + "-a-label").textContent = "Avg (" + aName + ")";
        $("rf-g" + n + "-b-label").textContent = "Avg (" + bName + ")";
      });
    }

    $("rf-a").addEventListener("change", function () {
      refreshWinnerOptions();
      refreshAvgLabels();
      var groupSel = $("rf-group");
      if (!groupSel.dataset.touched && this.value) groupSel.value = D.player(this.value).group || "";
    });
    $("rf-b").addEventListener("change", function () {
      refreshWinnerOptions();
      refreshAvgLabels();
    });
    $("rf-group").addEventListener("change", function () { this.dataset.touched = "1"; });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      showMsg("", "");

      var date = $("rf-date").value;
      var isHistory = $("rf-backfill").checked;
      var group = $("rf-group").value;
      var aId = $("rf-a").value, bId = $("rf-b").value;

      if (!date) return showErr("Pick a date.");
      if (!aId || !bId) return showErr("Pick both players.");
      if (aId === bId) return showErr("Player A and Player B can\u2019t be the same person.");
      if (!isHistory && !group) return showErr("Pick a group \u2014 or tick \u201cOld result\u201d if this isn\u2019t part of the current season.");

      var legs = [];
      for (var n = 1; n <= 3; n++) {
        var game = $("rf-g" + n + "-game").value;
        var winner = $("rf-g" + n + "-winner").value;
        var aStat = $("rf-g" + n + "-a").value;
        var bStat = $("rf-g" + n + "-b").value;
        var anyFilled = winner || aStat !== "" || bStat !== "";
        var allFilled = winner && aStat !== "" && bStat !== "";

        if (n <= 2 && !allFilled) return showErr("Fill in leg " + n + " completely \u2014 game, winner and both averages.");
        if (n === 3 && anyFilled && !allFilled) return showErr("Leg 3 is half filled in \u2014 either finish it, or leave it all blank for a 2\u20130.");
        if (allFilled) legs.push({ game: game, winner: winner, aStat: parseFloat(aStat), bStat: parseFloat(bStat) });
      }

      var winsA = legs.filter(function (l) { return l.winner === aId; }).length;
      var winsB = legs.filter(function (l) { return l.winner === bId; }).length;
      if (legs.length === 2 && winsA !== 2 && winsB !== 2) {
        return showErr("Two legs in but nobody\u2019s won both \u2014 add leg 3, or double check the winners.");
      }
      if (legs.length === 3 && Math.max(winsA, winsB) !== 2) {
        return showErr("Three legs in, but that doesn\u2019t add up to a 2\u20131. Double check the winners.");
      }

      var payload = {
        passcode: $("rf-passcode").value,
        target: isHistory ? "history" : "matches",
        date: date, group: group, a: aId, b: bId, legs: legs
      };

      btn.disabled = true;
      showMsg("pending", "Sending\u2026");

      fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids a CORS preflight Apps Script can't answer
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          btn.disabled = false;
          if (res && res.ok) {
            showMsg("ok", "Result submitted \u2014 nice one. It can take a few minutes to show up on the site (that\u2019s Google caching the sheet, not this site being slow).");
            form.reset();
            refreshWinnerOptions();
            refreshAvgLabels();
            delete $("rf-group").dataset.touched;
          } else {
            showMsg("err", (res && res.error) || "The sheet said no \u2014 check the passcode and try again.");
          }
        })
        .catch(function () {
          btn.disabled = false;
          showMsg("err", "Couldn\u2019t reach the sheet \u2014 check your connection and try again.");
        });
    });
  }

  D.pages.submit = function () {
    var cfg = D.config.resultsForm || {};
    if (!cfg.submitUrl) {
      set("submit-body", submitSetupCardHtml());
      return;
    }
    set("submit-body", submitFormHtml());
    wireSubmitForm(cfg.submitUrl);
  };
})();
