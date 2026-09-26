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
        '<td class="num">' + r.won + '</td>' +
        '<td class="num">' + r.lost + '</td>' +
        '<td class="num">' + r.legsFor + '</td>' +
        '<td class="num">' + r.legsAgainst + '</td>' +
        '<td class="num">' + U.signed(r.legDiff) + '</td>' +
        '<td class="num"><strong>' + r.points + '</strong></td>' +
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
      '<th class="num" title="Won">W</th>' +
      '<th class="num" title="Lost">L</th>' +
      '<th class="num" title="Legs won">LF</th>' +
      '<th class="num" title="Legs lost">LA</th>' +
      '<th class="num" title="Leg difference">+/-</th>' +
      '<th class="num">Pts</th>' +
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
      var label = isCricket ? "Cricket" : U.esc(D.config.rules.game1);
      return '<span class="leg-pill">' + label + ' \u2192 ' + U.esc(D.player(leg.winner).name) +
        ' <span class="muted">(' + U.num(leg.aStat) + " / " + U.num(leg.bStat) + ' ' + unit + ')</span></span>';
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
      leaderCard("Best overall index", L.bestOverall, "DATSU Index"));

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
      'A win is worth <strong>' + rules.pointsForWin + '</strong> points; ties are split by ' +
      '<strong>leg difference</strong>, then a <strong>head-to-head decider leg</strong>.');

    var legend =
      '<div class="legend">' +
      (shape.byesPerGroup > 0 ? '<span class="l-bye">Round-one bye (top ' + shape.byesPerGroup + ')</span>' : '') +
      '<span class="l-po">Playoff places' +
      (shape.byesPerGroup > 0 ? ' (' + (shape.byesPerGroup + 1) + '\u2013' + shape.perGroup + ')' : ' (top ' + shape.perGroup + ')') +
      '</span>' +
      '<span class="l-out">Outside the places</span>' +
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
              ' \u00b7 ' + x.group + x.row.pos + ' \u00b7 ' + x.row.points + ' pts</li>';
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
      '<p>The site works out the maximum points every player could still reach if they won all of ' +
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
  function buildSortableStatsTable(containerId, tableId, data, defaultSortKey) {
    var sortKey = defaultSortKey || "index", sortDir = -1;

    function draw() {
      data.sort(function (x, y) {
        var a = x[sortKey], b = y[sortKey];
        if (a === null || a === undefined) a = -Infinity;
        if (b === null || b === undefined) b = -Infinity;
        if (typeof a === "string") return sortDir * a.localeCompare(b);
        return sortDir * (a - b);
      });

      var head = STAT_COLS.map(function (c) {
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
          '<td>' + U.esc(r.group) + '</td>' +
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
    /* ---------------------------------------- the big sortable table --- */
    buildSortableStatsTable("stats-table", "statsTable", statsRowsFrom(D.allStats()), "index");

    set("stats-help",
      '<div class="card card-accent-cool"><h3>What am I looking at?</h3>' +
      '<p><strong>01 Avg (PPD)</strong> \u2014 points per dart in the ' + U.esc(D.config.rules.game1) +
      ' legs, straight from DARTSLIVE. Higher is better; 20 is respectable, 25+ is showing off.</p>' +
      '<p><strong>Cricket Avg (MPR)</strong> \u2014 marks per round in cricket. 2.00 is solid, 3.00 means you are ' +
      'not to be trifled with.</p>' +
      '<p><strong>Index</strong> \u2014 our own single number combining the two, where 30 PPD and ' +
      '3.00 MPR would score a perfect 100. Purely for arguing purposes.</p>' +
      '<p class="muted tiny">Tap any column heading to re-sort the table.</p></div>');

    /* ------------------------------------------- records and honours --- */
    var L = D.leaders();

    leaderTint = 0;
    set("records-season",
      leaderCard("Best overall index", L.bestOverall, "DATSU Index") +
      leaderCard("Best 01 average", L.best01, "01 Avg", "season") +
      leaderCard("Best cricket average", L.bestCricket, "Cricket Avg", "season") +
      leaderCard("Most wins", L.mostWins, "matches won") +
      leaderCard("Best win rate", L.bestWinPct, "%"));

    set("records-games",
      leaderCard("Highest single 01 game", L.high01Game, "PPD",
        L.high01Game ? "v " + D.playerName(L.high01Game.stats.best01.opponent) : "", "accent") +
      leaderCard("Highest single cricket game", L.highCricketGame, "MPR",
        L.highCricketGame ? "v " + D.playerName(L.highCricketGame.stats.bestCricket.opponent) : "", "accent-cool"));

    set("records-fun",
      '<div class="leader tint-accent-gold">' +
      '<div class="cat">The \u201cNice One\u201d Award</div>' +
      '<div class="val accent-gold">' + (L.niceOne ? U.num(L.niceOne.value) : "\u2013") + '</div>' +
      '<div class="who">' + (L.niceOne ? U.esc(L.niceOne.stats.player.flag + " " + L.niceOne.stats.player.name) : "Nobody yet") + '</div>' +
      '<div class="sub">Lowest 01 average in the league. Nice one.</div>' +
      '</div>' +
      '<div class="leader tint-accent-plum">' +
      '<div class="cat">Excellent Grouping, Mr Speaker</div>' +
      '<div class="val accent-plum">' + (L.mrSpeaker ? "+" + U.num(L.mrSpeaker.value) : "\u2013") + '</div>' +
      '<div class="who">' + (L.mrSpeaker ? U.esc(L.mrSpeaker.stats.player.flag + " " + L.mrSpeaker.stats.player.name) : "Nobody yet") + '</div>' +
      '<div class="sub">Biggest gap between their best game and their average \u2014 three lovely darts, three terrible numbers.</div>' +
      '</div>');

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

    /* -------------------------------------------------- career averages --- */
    var history = D.history || [];
    var careerRows = statsRowsFrom(D.allCareerStats());

    set("career-intro", history.length
      ? 'Every league and tournament on record combined \u2014 this season plus ' +
        history.length + ' logged result' + (history.length === 1 ? '' : 's') + ' from before it. ' +
        'Add old results to data/history.js (or a History sheet) and these numbers update themselves.'
      : 'This will combine every season and tournament a player has ever played, the moment old ' +
        'results go into data/history.js (or a History sheet). Right now it just matches this season, ' +
        'because nothing has been logged yet.');

    var CL = D.careerLeaders();
    leaderTint = 0;
    set("records-alltime",
      leaderCard("Best overall index \u2014 career", CL.bestOverall, "DATSU Index") +
      leaderCard("Best 01 average \u2014 career", CL.best01, "01 Avg") +
      leaderCard("Best cricket average \u2014 career", CL.bestCricket, "Cricket Avg"));

    buildSortableStatsTable("career-table", "careerTable", careerRows, "played");
  };

  /* ========================================================== PLAYERS === */

  D.pages.players = function () {
    var groups = D.groups();
    var active = D.activePlayers();
    var countries = {};
    active.forEach(function (p) { if (p.country) countries[p.country] = 1; });

    set("players-intro",
      'All ' + active.length + ' of us, from ' + Object.keys(countries).length +
      ' countries, split into ' + groups.length + ' group' + (groups.length === 1 ? '' : 's') +
      '. Averages update automatically as results come in.');

    set("player-groups", groups.map(function (g, i) {
      var rows = D.standings(g);
      return '<section class="section" style="padding-top:0">' +
        groupHeading(g, i) +
        '<div class="grid grid-3">' +
        rows.map(function (r) {
          var p = r.player, s = r.stats;
          return '<div class="card">' +
            '<div class="player-card">' + D.avatarHtml(p, true) +
            '<div class="meta">' +
            '<div class="nm">' + U.esc(p.name) + '</div>' +
            '<div class="dl">' + U.esc(p.dartslive) + '</div>' +
            '<div class="muted tiny">' + U.esc(p.flag) + ' ' + U.esc(p.country) + ' \u00b7 Group ' + U.esc(p.group) + '</div>' +
            '</div></div>' +
            '<div class="chips">' +
            '<span class="chip">Record <strong>' + s.won + '\u2013' + s.lost + '</strong></span>' +
            '<span class="chip">PPD <strong>' + U.num(s.ppd) + '</strong></span>' +
            '<span class="chip">MPR <strong>' + U.num(s.mpr) + '</strong></span>' +
            '<span class="chip">Index <strong>' + U.num(s.index, 1) + '</strong></span>' +
            '</div>' +
            (p.notes && p.notes.length
              ? '<ul class="notes">' + p.notes.map(function (n) { return '<li>' + U.esc(n) + '</li>'; }).join("") + '</ul>'
              : '') +
            '</div>';
        }).join("") +
        '</div></section>';
    }).join(""));
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

    var html = "";

    html += '<p class="eyebrow">' + U.esc(a.type === "tournament" ? "Tournament" : "League") + ' \u00b7 ' + U.esc(a.dates) + '</p>';
    html += '<h1>' + U.esc(a.name) + '</h1>';
    if (a.blurb) html += '<p class="hero-sub">' + U.esc(a.blurb) + '</p>';

    html += '<div class="chips">' +
      '<span class="chip">Champion <strong class="accent-good">' + U.esc(a.champion || "TBC") + '</strong></span>' +
      (a.runnerUp ? '<span class="chip">Runner-up <strong>' + U.esc(a.runnerUp) + '</strong></span>' : '') +
      (a.venue ? '<span class="chip">' + U.esc(a.venue) + '</span>' : '') +
      '</div>';

    if (a.highlights && a.highlights.length) {
      html += '<div class="section"><h2>Highlights</h2><div class="grid grid-3">' +
        a.highlights.map(function (h) {
          return '<div class="card"><p class="eyebrow">' + U.esc(h.label) + '</p><p><strong>' + U.esc(h.value) + '</strong></p></div>';
        }).join("") + '</div></div>';
    }

    if (a.results && a.results.length) {
      html += '<div class="section"><h2>Knockout results</h2>';
      html += a.results.map(function (r) {
        return '<div class="card" style="margin-bottom:10px"><p class="eyebrow">' + U.esc(r.round) + '</p><p>' + U.esc(r.text) + '</p></div>';
      }).join("");
      html += '</div>';
    }

    if (a.finalTable && a.finalTable.length) {
      html += '<div class="section"><h2>Final table</h2><div class="table-wrap"><table class="data">' +
        '<thead><tr><th>#</th><th>Player</th><th>Grp</th><th class="num">W</th><th class="num">L</th>' +
        '<th class="num">Pts</th><th class="num">PPD</th><th class="num">MPR</th></tr></thead><tbody>' +
        a.finalTable.map(function (r) {
          return '<tr><td><span class="pos">' + U.esc(r.pos) + '</span></td>' +
            '<td>' + U.esc(r.player) + '</td>' +
            '<td class="muted">' + U.esc(r.group || "\u2013") + '</td>' +
            '<td class="num">' + U.esc(r.w) + '</td>' +
            '<td class="num">' + U.esc(r.l) + '</td>' +
            '<td class="num"><strong>' + U.esc(r.pts) + '</strong></td>' +
            '<td class="num">' + U.num(r.ppd) + '</td>' +
            '<td class="num">' + U.num(r.mpr) + '</td></tr>';
        }).join("") + '</tbody></table></div></div>';
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
    var unit = defaultGame === "cricket" ? "MPR" : "PPD";
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
      '<div class="field"><label id="rf-g' + n + '-a-label" for="rf-g' + n + '-a">' + unit + ' (A)</label>' +
      '<input type="number" step="0.01" min="0" inputmode="decimal" id="rf-g' + n + '-a"></div>' +
      '<div class="field"><label id="rf-g' + n + '-b-label" for="rf-g' + n + '-b">' + unit + ' (B)</label>' +
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
      '<div class="field"><label for="rf-group">Group</label><select id="rf-group">' + groupOpts + '</select></div>' +
      '<div class="field checkbox-field"><label><input type="checkbox" id="rf-backfill"> Old result, from before this season</label></div>' +
      '</div>' +
      '<div class="field-row">' +
      '<div class="field"><label for="rf-a">Player A</label><select id="rf-a">' + playerOpts + '</select></div>' +
      '<div class="field"><label for="rf-b">Player B</label><select id="rf-b">' + playerOpts + '</select></div>' +
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

    $("rf-a").addEventListener("change", function () {
      refreshWinnerOptions();
      var groupSel = $("rf-group");
      if (!groupSel.dataset.touched && this.value) groupSel.value = D.player(this.value).group || "";
    });
    $("rf-b").addEventListener("change", refreshWinnerOptions);
    $("rf-group").addEventListener("change", function () { this.dataset.touched = "1"; });

    [1, 2, 3].forEach(function (n) {
      $("rf-g" + n + "-game").addEventListener("change", function () {
        var unit = this.value === "cricket" ? "MPR" : "PPD";
        $("rf-g" + n + "-a-label").textContent = unit + " (A)";
        $("rf-g" + n + "-b-label").textContent = unit + " (B)";
      });
    });

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
            delete $("rf-group").dataset.touched;
            [1, 2, 3].forEach(function (n) {
              $("rf-g" + n + "-a-label").textContent = (n === 2 ? "MPR" : "PPD") + " (A)";
              $("rf-g" + n + "-b-label").textContent = (n === 2 ? "MPR" : "PPD") + " (B)";
            });
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
