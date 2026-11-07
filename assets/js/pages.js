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
  var ACCENTS = ["accent", "accent-cool", "accent-warm", "accent-good", "accent-violet"];
  function groupAccent(i) { return ACCENTS[i % ACCENTS.length]; }

  function playerCellHtml(player, clickable) {
    var inner = D.avatarHtml(player) +
      '<span><span class="flag">' + U.esc(player.flag) + '</span> ' + U.esc(player.name) +
      '<br><span class="dl">' + U.esc(player.dartslive) + '</span></span>';
    if (clickable) {
      return '<button type="button" class="player-cell player-cell-link" data-player-id="' +
        U.esc(player.id) + '" aria-label="See ' + U.esc(player.name) + '\u2019s games this season">' +
        inner + '</button>';
    }
    return '<span class="player-cell">' + inner + '</span>';
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
      var playedHtml = r.isComplete
        ? r.played + ' <span class="played-done" title="All ' + r.totalRounds + ' matches played">\u2713</span>'
        : String(r.played);
      return '<tr class="zone-' + r.zone + (cut ? ' cutline' : '') + '">' +
        '<td><span class="pos">' + r.pos + '</span></td>' +
        '<td>' + playerCellHtml(r.player, opts.clickable) + '</td>' +
        '<td class="num">' + playedHtml + '</td>' +
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
      (opts.showAverages === false ? '' : '<th class="num" title="01 average, points per dart (PPD)">01 Avg</th><th class="num" title="Cricket average, marks per round (MPR)">Cricket Avg</th>') +
      (opts.showOutlook === false ? '' : '<th>Outlook</th>') +
      '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  function resultRowHtml(m) {
    var pa = D.player(m.a), pb = D.player(m.b);
    var s = D.legScore(m);
    var legs = (m.legs || []).map(function (leg) {
      var isCricket = String(leg.game).toLowerCase() === "cricket";
      var unit = isCricket ? "Cricket Avg" : "01 Avg";
      var label = isCricket ? "Cricket" : (leg.game && leg.game !== "leg" ? U.esc(leg.game) : U.esc(D.config.rules.game1));
      var hasStats = (typeof leg.aStat === "number" && !isNaN(leg.aStat)) || (typeof leg.bStat === "number" && !isNaN(leg.bStat));
      var statsSpan = hasStats ? ' <span class="muted">(' + U.num(leg.aStat) + " / " + U.num(leg.bStat) + ' ' + unit + ')</span>' : '';
      return '<span class="leg-pill">' + label + ' \u2192 ' + U.esc(D.player(leg.winner).name) + statsSpan + '</span>';
    }).join("");

    if (s.forfeited) {
      legs += ' <span class="leg-pill forfeit-pill" style="color:#f59e0b;border-color:rgba(245,158,11,0.35)">Forfeit (0\u20132)</span>';
    }

    var round = String(m.round || "").trim().toLowerCase();
    var isPlayoff = /quarter|qf|semi|sf|final|fn|playoff/.test(round) || /playoff/.test(String(m.competition || "").toLowerCase());
    var roundLabel = "";
    if (/final|fn/.test(round)) roundLabel = "Playoff Final";
    else if (/semi|sf/.test(round)) roundLabel = "Playoff Semi-Final";
    else if (/quarter|qf/.test(round)) roundLabel = "Playoff Quarter-Final";
    else if (isPlayoff) roundLabel = "Playoffs";

    if (roundLabel) {
      legs = '<span class="leg-pill regal-pill">👑 ' + roundLabel + '</span> ' + legs;
    }

    return '<div class="result-row' + (isPlayoff ? ' is-playoff' : '') + '">' +
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
    return '<div class="bracket-cell"><div class="tie' + (tie.match ? ' is-played' : '') + '">' +
      bracketSideHtml(tie.home) + bracketSideHtml(tie.away) +
      '<div class="fmt"><span>' + U.esc(tie.id) + '</span>' +
      (tie.match ? '<span>' + U.esc(U.date(tie.match.date)) + '</span>' : '') +
      '</div>' +
      '</div></div>';
  }

  /* Renders any bracket array (projected, live, or tournament) as HTML. */
  function bracketRoundsHtml(rounds) {
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

  function bracketHtml() {
    return bracketRoundsHtml(D.projectedBracket());
  }

  function tournamentBracketHtml() {
    return bracketRoundsHtml(D.tournamentBracket());
  }

  /* One award, as a card. `award.winner` is null when nobody has played
     enough matches to qualify, so the card says so rather than vanishing. */
  var AWARD_ICONS = {
    unlucky: "\ud83c\udf40",
    dominance: "\ud83d\udc51",
    heartbreak: "\ud83d\udc94",
    clutch: "\ud83c\udfaf",
    bottler: "\ud83e\udd0c",
    metronome: "\u23f1\ufe0f",
    rollercoaster: "\ud83c\udfa2",
    improved: "\ud83d\udcc8",
    fader: "\ud83d\udcc9",
    "giant-killer": "\u2694\ufe0f",
    specialist: "\ud83c\udf9a\ufe0f"
  };

  function awardCardHtml(award, tint) {
    var icon = AWARD_ICONS[award.key] || "\ud83c\udfc6";
    var colour = tint || "accent";
    if (!award.winner) {
      return '<div class="award-card tint-' + colour + '">' +
        '<div class="award-head"><span class="award-icon">' + icon + '</span>' +
        '<span class="award-name">' + U.esc(award.title) + '</span></div>' +
        '<p class="award-blurb">' + U.esc(award.blurb) + '</p>' +
        '<p class="award-empty">Not enough matches yet</p>' +
        '</div>';
    }
    var p = award.winner.player;
    return '<div class="award-card tint-' + colour + '">' +
      '<div class="award-head"><span class="award-icon">' + icon + '</span>' +
      '<span class="award-name">' + U.esc(award.title) + '</span></div>' +
      '<p class="award-blurb">' + U.esc(award.blurb) + '</p>' +
      '<div class="award-winner">' +
      '<span class="award-who">' + U.esc(p.flag ? p.flag + " " : "") + U.esc(p.name) + '</span>' +
      '<span class="award-value">' + U.esc(award.winner.display) + '</span>' +
      '</div>' +
      (award.winner.detail ? '<p class="award-detail">' + U.esc(award.winner.detail) + '</p>' : '') +
      '</div>';
  }

  var AWARD_TINTS = ["accent", "accent-cool", "accent-warm", "accent-good",
    "accent-gold", "accent-plum", "accent-violet"];

  function awardsGridHtml(awards) {
    if (!awards || !awards.length) return "";
    return '<div class="grid grid-3">' + awards.map(function (a, i) {
      return awardCardHtml(a, AWARD_TINTS[i % AWARD_TINTS.length]);
    }).join("") + '</div>';
  }

  /* ============================================================= HOME === */

  /* One thing only: what's on right now, and what it's called.
     Green when a league is running, gold once the playoffs are live, and
     violet while a one-day tournament is taking over the site. */
  function statusBadgeHtml() {
    var st = D.config.status;
    var tournament = D.isTournament();
    var playoffs = D.phase() === "playoffs";
    var on = st.running !== false;

    var cls, label, sub;
    if (tournament) {
      cls = "is-tournament";
      label = (D.config.tournament && D.config.tournament.name) || "Tournament";
      sub = "Tournament day";
    } else if (playoffs) {
      cls = "is-playoffs";
      label = st.seasonName;
      sub = "Playoffs";
    } else {
      cls = on ? "is-on" : "is-off";
      label = st.seasonName;
      sub = on ? "Running now" : "Not running at the moment";
    }

    return '<div class="status-badge ' + cls + '">' +
      '<span class="status-dot"></span>' +
      '<span class="status-text">' +
      '<strong>' + U.esc(label) + '</strong>' +
      '<span>' + U.esc(sub) + '</span>' +
      '</span>' +
      '</div>';
  }

  D.pages.home = function () {
    var cfg = D.config;
    var groups = D.groups();
    var shape = D.playoffShape();
    var tournament = D.isTournament();

    var words = cfg.leagueName.split(" ");
    set("hero-title", '<span class="accent">' + U.esc(words[0]) + '</span> ' +
      U.esc(words.slice(1).join(" ")));
    set("hero-sub", U.esc(cfg.tagline) + " Soft tip darts, plenty of alcohol, and a running commentary nobody asked for.");
    set("hero-art", D.logoSvg("100%"));

    if (tournament) {
      var t = cfg.tournament || {};
      set("hero-chips",
        '<span class="chip"><strong>' + U.esc(t.name || "Tournament") + '</strong></span>' +
        (t.dates ? '<span class="chip">' + U.esc(t.dates) + '</span>' : '') +
        (t.format ? '<span class="chip">' + U.esc(t.format) + '</span>' : '') +
        '<span class="chip">' + U.esc(cfg.venue.name) + '</span>');
    } else {
      set("hero-chips",
        '<span class="chip"><strong>' + D.activePlayers().length + '</strong> players</span>' +
        '<span class="chip"><strong>' + groups.length + '</strong> group' + (groups.length === 1 ? '' : 's') + '</span>' +
        '<span class="chip"><strong>' + U.esc(cfg.rules.matchFormat) + '</strong></span>' +
        '<span class="chip" title="The third leg\u2019s game is picked by whoever wins the cork toss">' +
        U.esc(cfg.rules.game1) + ' \u2192 ' + U.esc(cfg.rules.game2) + ' \u2192 <strong>Decider</strong></span>' +
        '<span class="chip">' + U.esc(cfg.venue.name) + '</span>');
    }

    set("status-board", statusBadgeHtml());

    /* A single quip, quietly, instead of a scrolling marquee */
    var quip = cfg.quips[Math.floor(Math.random() * cfg.quips.length)];
    set("quip-line", '<div class="wrap"><em>\u201c</em>' + U.esc(quip) + '<em>\u201d</em></div>');

    /* The most recent results, however long ago that was. In tournament
       mode we only show the tournament's own matches. */
    var nights = D.matchNights();
    if (tournament) {
      var tId = D.tournamentId();
      var tMatches = (D.allMatchesEver() || []).filter(function (m) {
        return tId && String(m.competition || "").trim().toLowerCase() === tId;
      }).sort(function (x, y) { return x.date < y.date ? 1 : x.date > y.date ? -1 : 0; });
      if (tMatches.length) {
        set("latest-results",
          '<p class="date-head">Tournament results</p>' +
          tMatches.map(resultRowHtml).join(""));
      } else {
        set("latest-results", '<div class="card"><p class="muted">No tournament results in yet. Get corking.</p></div>');
      }
    } else if (nights.length) {
      var n = nights[0];
      set("latest-results",
        '<p class="date-head">' + U.esc(U.weekday(n.date)) + ' ' + U.esc(U.date(n.date)) + '</p>' +
        n.matches.map(resultRowHtml).join(""));
    } else {
      set("latest-results", '<div class="card"><p class="muted">No results in yet. Get corking.</p></div>');
    }

    /* Group tables — one per group, however many there are. In tournament
       mode the "race" becomes the live tournament bracket instead. */
    if (tournament) {
      set("race-intro", "Live tournament bracket");
      set("mini-tables", '<div style="grid-column:1/-1">' + tournamentBracketHtml() + '</div>');
      var mtT = $("mini-tables");
      if (mtT) mtT.className = "grid";
    } else {
      set("race-intro", 'Top ' + shape.perGroup + ' in each group make the playoffs.');
      set("mini-tables", groups.map(function (g, i) {
        return '<div>' +
          '<h3 class="' + groupAccent(i) + '">Group ' + U.esc(g) + '</h3>' +
          standingsTable(g, { showAverages: false, showOutlook: false, clickable: true }) +
          '</div>';
      }).join(""));

      var mt = $("mini-tables");
      if (mt) {
        // Two across on a wide screen, one per row on a narrow one
        mt.className = "grid " + (groups.length >= 3 ? "grid-3" : "grid-2");
      }
    }

    /* Leaders snapshot */
    var L = D.leaders();
    leaderTint = 0;
    set("home-leaders",
      leaderCard("Best 01 average", L.best01, "01 Avg") +
      leaderCard("Best cricket average", L.bestCricket, "Cricket Avg") +
      leaderCard("Best overall index", L.bestOverall, "ダーツ Index", null, "accent-violet"));

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
        standingsTable(g, { clickable: true }) + legend +
        '</section>';
    }).join(""));

    /* --------------------------------- this season's stats & leaders --- */
    buildSortableStatsTable("season-stats-table", "seasonStatsTable", statsRowsFrom(D.allStats()), "index", { clickable: true });

    set("season-stats-help",
      '<div class="card card-accent-cool"><h3>What am I looking at?</h3>' +
      '<p><strong>01 Avg (PPD)</strong> \u2014 points per dart in the ' + U.esc(D.config.rules.game1) +
      ' legs, stats from DARTSLIVE result screen. Higher is better.</p>' +
      '<p><strong>Cricket Avg (MPR)</strong> \u2014 marks per round in cricket.</p>' +
      '<p><strong>ダーツ Index</strong> \u2014 our single rating combining the two, where a 01 Avg of 60 and a ' +
      'Cricket Avg of 2.5 would both score 100.</p>' +
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
      leaderCard("Highest single 01 game", L.high01Game, "01 Avg",
        L.high01Game ? "v " + D.playerName(L.high01Game.stats.best01.opponent) : "", "accent") +
      leaderCard("Highest single cricket game", L.highCricketGame, "Cricket Avg",
        L.highCricketGame ? "v " + D.playerName(L.highCricketGame.stats.bestCricket.opponent) : "", "accent-cool"));

    /* ------------------------------------------- season awards --- */
    set("season-awards", awardsGridHtml(D.seasonAwards()));
    set("season-awards-note",
      'Worked out from the results above \u2014 nothing to fill in. ' +
      'Players need at least <strong>' + ((D.config.awards && D.config.awards.minGames) || 4) +
      '</strong> matches to qualify, and forfeited or withdrawn players are left out.');

    /* ------------------------------ this season's match history collapse --- */
    var seasonMatches = (D.sortedMatches() || []).filter(function (m) { return !m.isUnplayedForfeit; });
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

  /* Three things this page can be, decided by the two switches:

       tournamentMode on   -> the one-day tournament bracket
       phase "playoffs"    -> the real, finalized league bracket
       otherwise           -> the projection ("as if the season ended today")

     The projection keeps the outlook cards, because while the league is
     still running "who's safe, who's sweating" is the whole point. Once the
     bracket is real, those cards are replaced by the actual results. */
  D.pages.playoffs = function () {
    if (D.isTournament()) return renderTournamentPage();
    if (D.phase() === "playoffs") return renderLiveBracketPage();
    return renderProjectionPage();
  };

  /* ------------------------------------------------- the projection --- */

  function renderProjectionPage() {
    var shape = D.playoffShape();
    var rounds = D.projectedBracket();

    set("playoff-eyebrow", "The business end");
    set("playoff-title", "Playoff Picture");
    set("bracket-heading", "Projected bracket");
    set("outlook-heading", "Who's safe, who's sweating");
    document.body.setAttribute("data-title", "Playoffs");

    set("playoff-intro",
      'The league is still running, so this is the bracket <strong>as if the season ended today</strong>. ' +
      'It updates itself the moment new results go in. ' +
      '<strong>' + shape.qualifiers + '</strong> players qualify (top ' + shape.perGroup +
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
        if (!r.isWithdrawn && !r.isForfeited) {
          buckets[r.outlook].push({ row: r, group: g });
        }
      });
    });

    // Sort every bucket by wins descending so the top-performing players appear first
    Object.keys(buckets).forEach(function (k) {
      buckets[k].sort(function (a, b) {
        if (b.row.won !== a.row.won) return b.row.won - a.row.won;
        // Tie-breaker: leg diff descending
        var diffA = a.row.legsFor - a.row.legsAgainst;
        var diffB = b.row.legsFor - b.row.legsAgainst;
        if (diffB !== diffA) return diffB - diffA;
        return a.row.pos - b.row.pos;
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
  }

  /* ------------------------------------------------- the real bracket --- */

  /* Everything the bracket needs to describe itself: how many ties are
     played, how many are still to come, and who's left standing. */
  function bracketProgress(rounds) {
    var played = 0, total = 0, champion = null;
    rounds.forEach(function (r) {
      r.ties.forEach(function (t) {
        if (t.kind !== "tie") return;
        total++;
        if (t.match) played++;
      });
    });
    var last = rounds.length ? rounds[rounds.length - 1] : null;
    if (last && last.ties.length === 1 && last.ties[0].winner) {
      champion = last.ties[0].winner;
    }
    return { played: played, total: total, champion: champion };
  }

  function renderLiveBracketPage() {
    var rounds = D.playoffBracket();
    var progress = bracketProgress(rounds);
    var seasonName = (D.config.status && D.config.status.seasonName) || "the season";
    // Count from the frozen seeds, not the live tables — after a rollover
    // everyone may be marked inactive, which would otherwise read as zero.
    var qualifiers = D.playoffSeeds().length;

    set("playoff-eyebrow", "The bracket");
    set("playoff-title", "The Bracket");
    set("bracket-heading", "The bracket");
    set("outlook-heading", "Results so far");
    document.body.setAttribute("data-title", "The Bracket");

    var intro;
    if (progress.champion) {
      intro = '<strong>' + U.esc(progress.champion.flag ? progress.champion.flag + " " : "") +
        U.esc(progress.champion.name) + '</strong> is the ' + U.esc(seasonName) + ' champion. ' +
        'The full bracket is below.';
    } else if (progress.played) {
      intro = 'The bracket is live \u2014 <strong>' + progress.played + '</strong> of <strong>' +
        progress.total + '</strong> ties played. Results go in as they happen.';
    } else {
      intro = 'The bracket is set. <strong>' + qualifiers + '</strong> players qualified, ' +
        'and the first results will appear here as they come in.';
    }
    set("playoff-intro", intro);

    set("bracket", bracketRoundsHtml(rounds));

    set("bracket-note", rounds.length
      ? 'Formats: ' + rounds.map(function (r) { return U.esc(r.name) + ' \u2014 ' + U.esc(r.format); }).join(' \u00b7 ') +
        '. Scroll sideways on a phone to follow it across.'
      : '');

    /* The outlook cards are meaningless once the bracket is real, so they
       become a results list instead. */
    var playoffMatches = D.playoffMatches().slice().sort(function (x, y) {
      return x.date < y.date ? 1 : x.date > y.date ? -1 : 0;
    });

    if (playoffMatches.length) {
      set("outlook-cards",
        '<div style="grid-column:1/-1">' +
        '<h3 style="margin-bottom:12px">Road to the final</h3>' +
        playoffMatches.map(resultRowHtml).join("") +
        '</div>');
    } else {
      set("outlook-cards",
        '<div class="card" style="grid-column:1/-1"><p class="muted">' +
        'No playoff results logged yet. Use the button below once the first match is done.</p></div>');
    }
    var oc = $("outlook-cards");
    if (oc) oc.className = "grid";

    set("scenario-note",
      '<div class="card card-accent-cool"><h3>Logging a playoff result</h3>' +
      '<p>Playoff matches go in through the same form as league matches \u2014 pick ' +
      '<strong>Playoff match</strong> at the top, choose the round, and enter the score and ' +
      'averages exactly as normal.</p>' +
      '<p class="muted tiny">They are stored in the History tab tagged with this season, so they ' +
      'never disturb the league table.</p>' +
      '<p><a class="btn" href="submit.html?mode=playoff">Log a playoff result</a></p>' +
      '</div>');
  }

  /* ---------------------------------------------------- the tournament --- */

  function renderTournamentPage() {
    var t = D.config.tournament || {};
    var shape = D.tournamentShape();
    var rounds = D.tournamentBracket();
    var progress = bracketProgress(rounds);

    set("playoff-eyebrow", "Tournament day");
    set("playoff-title", t.name || "Tournament");
    set("bracket-heading", "The bracket");
    set("outlook-heading", "Results so far");
    document.body.setAttribute("data-title", t.name || "Tournament");

    var intro = '<strong>' + U.esc(t.name || "Tournament") + '</strong>';
    if (t.dates) intro += ' \u00b7 ' + U.esc(t.dates);
    if (t.format) intro += ' \u00b7 ' + U.esc(t.format);
    intro += '. <strong>' + shape.qualifiers + '</strong> entrants';
    if (progress.champion) {
      intro += ' \u2014 <strong>' + U.esc(progress.champion.flag ? progress.champion.flag + " " : "") +
        U.esc(progress.champion.name) + '</strong> takes it.';
    } else if (progress.played) {
      intro += ' \u2014 <strong>' + progress.played + '</strong> of <strong>' + progress.total + '</strong> ties played.';
    } else {
      intro += '.';
    }
    set("playoff-intro", intro);

    set("bracket", bracketRoundsHtml(rounds));

    set("bracket-note", rounds.length
      ? 'Scroll sideways on a phone to follow it across.'
      : '');

    var tMatches = D.tournamentMatches().slice().sort(function (x, y) {
      return x.date < y.date ? 1 : x.date > y.date ? -1 : 0;
    });

    if (tMatches.length) {
      set("outlook-cards",
        '<div style="grid-column:1/-1">' +
        '<h3 style="margin-bottom:12px">Tournament results</h3>' +
        tMatches.map(resultRowHtml).join("") +
        '</div>');
    } else {
      set("outlook-cards",
        '<div class="card" style="grid-column:1/-1"><p class="muted">' +
        'No results yet. First cork thrown shortly.</p></div>');
    }
    var oc = $("outlook-cards");
    if (oc) oc.className = "grid";

    set("scenario-note",
      D.canSubmitTournament()
        ? '<div class="card card-accent-cool"><h3>Logging a tournament result</h3>' +
          '<p>Pick <strong>Tournament match</strong> at the top of the form, choose the round, and ' +
          'enter the score and averages as normal.</p>' +
          '<p class="muted tiny">Results are tagged with <code>' + U.esc(D.tournamentId() || "the tournament") +
          '</code> in the History tab, so they show up on the archive page and count toward career stats.</p>' +
          '<p><a class="btn" href="submit.html?mode=tournament">Log a tournament result</a></p>' +
          '</div>'
        : '<div class="card card-accent-cool"><h3>Results are logged afterwards</h3>' +
          '<p>This tournament isn\u2019t being run through the site, so there\u2019s nothing to submit ' +
          'here on the day. The bracket fills in once the results are added to the ' +
          '<code>History</code> tab.</p>' +
          '<p class="muted tiny">Results are tagged with <code>' + U.esc(D.tournamentId() || "the tournament") +
          '</code>, so they show up on the archive page and count toward career stats.</p>' +
          '</div>');
  }

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
          '<td>' + playerCellHtml(r.player, opts.clickable) + '</td>' +
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
      leaderCard("All-time high 01 game", CL.high01Game, "01 Avg",
        CL.high01Game && CL.high01Game.stats && CL.high01Game.stats.best01 ? "v " + D.playerName(CL.high01Game.stats.best01.opponent) : "", "accent") +
      leaderCard("All-time high cricket game", CL.highCricketGame, "Cricket Avg",
        CL.highCricketGame && CL.highCricketGame.stats && CL.highCricketGame.stats.bestCricket ? "v " + D.playerName(CL.highCricketGame.stats.bestCricket.opponent) : "", "accent-cool"));

    /* Sortable overall career table (without Group column) */
    buildSortableStatsTable("stats-table", "careerStatsTable", careerRows, "played", { showGroup: false, clickable: true });

    set("stats-help",
      '<div class="card card-accent-cool"><h3>What am I looking at?</h3>' +
      '<p><strong>01 Avg (PPD)</strong> — career points per dart in 01 legs across all games.</p>' +
      '<p><strong>Cricket Avg (MPR)</strong> — career marks per round in cricket across all games.</p>' +
      '<p><strong>ダーツ Index</strong> — our single rating combining the two, where a 01 Avg of 60 and a ' +
      'Cricket Avg of 2.5 would both score 100.</p>' +
      '<p class="muted tiny"><strong>* Note on career leaderboards:</strong> A minimum of <strong>5 matches played</strong> is required to qualify for career leader cards. Tap any column heading to re-sort the table. Looking for this season only? Head over to the <a href="league.html#season-stats">League Table</a> page.</p></div>');

    /* Roll of honour from the archive (trophy case badges) */
    var champs = (D.archive || []).filter(function (a) { return a.champion; });

    // Same data, told as a trophy case. League titles
    // get a gold medal and a glow; one-day tournaments get a medal too,
    // just a smaller, quieter one — still worth a badge, not a crown.
    set("honour-badges", champs.length
      ? '<div class="honour-badges">' +
        champs.map(function (a) {
          var isTournament = a.type === "tournament";
          var isPopulated = D.isArchivePopulated ? D.isArchivePopulated(a) : (a.photos && a.photos.length);
          var badgeCls = "honour-badge " + (isTournament ? "tournament" : "league") + (isPopulated ? " is-populated" : "");
          return '<a class="' + badgeCls + '" ' +
            'href="season.html?s=' + encodeURIComponent(a.id) + '">' +
            '<div class="medal">' + (isTournament ? "\ud83c\udfaf" : "\ud83c\udfc6") + '</div>' +
            '<p class="event">' + U.esc(isTournament ? "Tournament" : "League") + '</p>' +
            '<p class="champ">' + U.esc(a.champion) + '</p>' +
            '<p class="when">' + U.esc(a.name) + '</p>' +
            (isPopulated ? '<span class="archive-pill">\u25ce Full Story &amp; Photos</span>' : '') +
            '</a>';
        }).join("") + '</div>'
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
      var isPopulated = D.isArchivePopulated ? D.isArchivePopulated(a) : (a.photos && a.photos.length);
      var cardCls = "card " + (isPopulated ? "archive-card-featured" : "card-accent");
      var badge = isPopulated ? '<span class="archive-pill featured-badge">\u25ce Full Story &amp; Photos</span>' : '';
      var photoCount = (a.photos || []).length;
      var resultsCount = (a.results || []).length;
      var metaStr = (photoCount || resultsCount)
        ? (photoCount + ' photo(s) \u00b7 ' + resultsCount + ' round(s) of results')
        : 'Summary documented';

      return '<a class="' + cardCls + '" href="season.html?s=' + encodeURIComponent(a.id) + '" style="display:block;color:inherit">' +
        badge +
        '<p class="eyebrow">' + U.esc(a.type === "tournament" ? "Tournament" : "League") + ' \u00b7 ' + U.esc(a.dates) + '</p>' +
        '<h3>' + U.esc(a.name) + '</h3>' +
        '<p><span class="muted tiny">Champion</span><br><strong class="accent-good">' + U.esc(a.champion || "TBC") + '</strong></p>' +
        (a.runnerUp ? '<p class="muted tiny">Runner-up: ' + U.esc(a.runnerUp) + '</p>' : '') +
        '<p class="muted tiny">' + U.esc(metaStr) + '</p>' +
        '<p class="accent-cool">' + (isPopulated ? 'Explore season \u2192' : 'View summary \u2192') + '</p>' +
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

    // Playoff knockout bracket. `playoffs.rounds` is the general version —
    // it works for any bracket size (R1, R16, QF, SF, F) rather than only
    // ever knowing about quarters, semis and finals.
    var poRounds = (playoffs.rounds || []).map(function (r) {
      return {
        name: r.name,
        ties: r.matches.map(function (m, i) {
          var s = D.legScore(m);
          var pa = D.player(m.a), pb = D.player(m.b);
          return {
            id: r.code + "-" + (i + 1),
            home: { name: pa.name, flag: pa.flag, score: s.a, won: s.a > s.b },
            away: { name: pb.name, flag: pb.flag, score: s.b, won: s.b > s.a }
          };
        })
      };
    });

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

    // Season awards, worked out from this competition's own results. Same
    // engine as the live League page, so an old season gets the same
    // treatment without anything being written down by hand.
    if (autoMatches.length) {
      var seasonAwards = D.awardsForSeason(a.id);
      if (seasonAwards.length) {
        html += '<div class="section"><h2>Season awards</h2>' +
          awardsGridHtml(seasonAwards) + '</div>';
      }
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

  function legFieldsetHtml(n, defaultGame, bestOf) {
    var g1 = U.esc(D.config.rules.game1), g2 = U.esc(D.config.rules.game2);
    var total = bestOf || 3;
    var needed = legsToWin(total);
    // The last leg of a best-of-N is the decider, and only exists if the
    // match actually went that far.
    var isDecider = n === total && total > 2;
    var note = isDecider
      ? ' <span class="muted">\u2014 only if it went to a decider</span>'
      : (n > needed ? ' <span class="muted">\u2014 only if needed</span>' : '');
    return '<fieldset class="leg-fields">' +
      '<legend>Leg ' + n + note + '</legend>' +
      '<div class="field-row">' +
      '<div class="field"><label for="rf-g' + n + '-game">Game</label>' +
      '<select id="rf-g' + n + '-game">' +
      '<option value="701"' + (defaultGame === "701" ? ' selected' : '') + '>' + g1 + '</option>' +
      '<option value="cricket"' + (defaultGame === "cricket" ? ' selected' : '') + '>' + g2 + '</option>' +
      '</select></div>' +
      '<div class="field"><label for="rf-g' + n + '-winner">Winner</label>' +
      '<select id="rf-g' + n + '-winner"><option value="">\u2013</option></select></div>' +
      '<div class="field"><label id="rf-g' + n + '-a-label" for="rf-g' + n + '-a">Avg (Player A) <span class="muted">\u2014 optional</span></label>' +
      '<input type="number" step="0.01" min="0" inputmode="decimal" id="rf-g' + n + '-a"></div>' +
      '<div class="field"><label id="rf-g' + n + '-b-label" for="rf-g' + n + '-b">Avg (Player B) <span class="muted">\u2014 optional</span></label>' +
      '<input type="number" step="0.01" min="0" inputmode="decimal" id="rf-g' + n + '-b"></div>' +
      '</div></fieldset>';
  }

  function submitSuccessCardHtml(summary) {
    var roundLabel = summary.round ? D.roundNameForCode(summary.round) : "";
    var meta = [];
    if (summary.mode === "tournament") meta.push("Tournament");
    else if (summary.mode === "playoff") meta.push("Playoff");
    if (roundLabel) meta.push(roundLabel);
    if (summary.group) meta.push("Group " + summary.group);
    meta.push(U.date ? U.date(summary.date) : summary.date);

    return '<div class="card submit-success-card">' +
      '<div class="submit-success-icon">\u2713</div>' +
      '<h2 class="submit-success-title">Result Submitted!</h2>' +
      '<p class="submit-success-summary">' + U.esc(summary.winnerName) + ' defeated ' + U.esc(summary.loserName) + ' (' + U.esc(summary.score) + ')</p>' +
      '<p class="submit-success-meta">' + U.esc(meta.join(' \u00b7 ')) + '</p>' +
      '<p class="muted tiny" style="max-width:380px;margin:0 auto 22px">Nice one! The result has been written to the Google Sheet. It may take a couple of minutes for Google\u2019s cache to reflect on the standings page.</p>' +
      '<div class="btn-row"><button type="button" class="btn" id="rf-submit-another">Log another match</button></div>' +
      '</div>';
  }

  /* The kinds of match the form can log. `target` is which sheet tab the row
     goes to; playoff and tournament rows go to History so they never touch
     the league table.

     The tournament option only appears when tournament.submitResults is on —
     a one-day event often isn't run off the site, and a form nobody uses is
     worse than no form. Playoffs are always available. */
  function submitModes() {
    var modes = [
      {
        key: "league", label: "League match", target: "matches",
        blurb: "A normal group match in the current season."
      },
      {
        key: "playoff", label: "Playoff match", target: "history",
        blurb: "A knockout match in this season's bracket."
      }
    ];
    if (D.canSubmitTournament()) {
      modes.push({
        key: "tournament", label: "Tournament match", target: "history",
        blurb: "A match in " + (D.config.tournament.name || "the tournament") + "."
      });
    }
    return modes;
  }

  /* Round options for the playoff/tournament selectors, derived from the
     bracket shape so a 16-player bracket offers R1 as well as QF/SF/F. */
  function roundOptionsHtml(mode) {
    var rounds;
    if (mode === "tournament") {
      rounds = D.tournamentBracket();
    } else {
      rounds = D.bracketFinalized() ? D.playoffBracket() : D.projectedBracket();
    }
    var seen = {};
    var opts = '<option value="">\u2013</option>';
    rounds.forEach(function (r) {
      var code = r.ties && r.ties.length ? r.ties[0].id.split("-")[0] : "";
      if (!code || seen[code]) return;
      seen[code] = true;
      opts += '<option value="' + U.esc(code) + '">' + U.esc(r.name) + '</option>';
    });
    return opts;
  }

  /* How many legs a knockout match can run to, from the round's format
     string ("Best of 7" -> 7). Falls back to 5, which is what every round
     uses unless config says otherwise. */
  function bestOfForRound(mode, code) {
    var rounds;
    if (mode === "tournament") {
      rounds = D.tournamentBracket();
    } else {
      rounds = D.bracketFinalized() ? D.playoffBracket() : D.projectedBracket();
    }
    var found = null;
    rounds.forEach(function (r) {
      var c = r.ties && r.ties.length ? r.ties[0].id.split("-")[0] : "";
      if (c === code) found = r;
    });
    var m = found && String(found.format || "").match(/(\d+)/);
    var n = m ? parseInt(m[1], 10) : 5;
    if (!n || n < 1) n = 5;
    if (n > 9) n = 9;
    return n;
  }

  /* The number of legs needed to win a best-of-N match. */
  function legsToWin(bestOf) {
    return Math.floor(bestOf / 2) + 1;
  }

  /* Builds the leg fieldsets. League matches are always best of 3; knockout
     matches can run to whatever the round's format says (up to best of 9),
     so the form grows and shrinks with the round. */
  function legFieldsHtml(mode, roundCode) {
    var bestOf = mode === "league" ? 3 : bestOfForRound(mode, roundCode);
    var html = "";
    for (var n = 1; n <= bestOf; n++) {
      var defaultGame = n === 1 ? "701" : (n === 2 ? "cricket" : "701");
      html += legFieldsetHtml(n, defaultGame, bestOf);
    }
    return html;
  }

  function submitFormHtml() {
    var players = D.activePlayers().slice().sort(function (x, y) { return x.name.localeCompare(y.name); });
    var groups = D.groups();
    var cfg = D.config;
    var modes = submitModes();

    var playerOpts = '<option value="">Choose\u2026</option>' + players.map(function (p) {
      return '<option value="' + U.esc(p.id) + '">' + U.esc(p.flag) + ' ' + U.esc(p.name) + '</option>';
    }).join("");

    var groupOpts = '<option value="">\u2013</option>' + groups.map(function (g) {
      return '<option value="' + U.esc(g) + '">Group ' + U.esc(g) + '</option>';
    }).join("");

    var modeHtml = '<div class="segmented" id="rf-mode" role="tablist">' +
      modes.map(function (m, i) {
        return '<button type="button" class="segmented-btn' + (i === 0 ? ' is-active' : '') +
          '" data-mode="' + U.esc(m.key) + '" role="tab" aria-selected="' + (i === 0) + '">' +
          U.esc(m.label) + '</button>';
      }).join("") +
      '</div>' +
      '<p class="muted tiny" id="rf-mode-blurb" style="margin:-6px 0 16px">' + U.esc(modes[0].blurb) + '</p>';

    var sheetWarning = (!cfg.sheet || !cfg.sheet.enabled)
      ? '<p class="muted tiny">Heads up: this site is currently reading this season\u2019s results from ' +
        '<code>data/matches.js</code>, not the Google Sheet, so anything submitted here won\u2019t show up on ' +
        'the site until <code>sheet.enabled</code> is turned on in <code>data/config.js</code> ' +
        '(see <code>docs/GOOGLE-SHEET.md</code>). It still saves to the sheet either way.</p>'
      : '';

    var scanCardHtml = (cfg.resultsForm && cfg.resultsForm.scanUrl)
      ? '<div class="scan-card">' +
        '  <div class="scan-card-info">' +
        '    <h3>\ud83d\udcf8 Scan Machine Screen</h3>' +
        '    <p>Snap photo(s) of the DARTSLIVE screens (Match Summary and/or Stats page) \u2014 names, winners, and leg averages will be recognized and filled into the form for you.</p>' +
        '  </div>' +
        '  <label class="btn scan-upload-btn" id="rf-scan-btn">' +
        '    <span id="rf-scan-label">\ud83d\udcf7 Select 1 or 2 Photos</span>' +
        '    <input type="file" id="rf-scan-input" accept="image/*" multiple>' +
        '  </label>' +
        '</div>' +
        '<div class="submit-divider">or fill in by hand</div>'
      : '';

    return '<div id="submit-form-wrap">' +
      sheetWarning +
      scanCardHtml +
      '<form id="resultForm" class="card">' +
      modeHtml +
      '<div class="field-row">' +
      '<div class="field"><label for="rf-date">Date</label><input type="date" id="rf-date" value="' + todayIso() + '" required></div>' +
      '<div class="field" id="rf-group-field"><label for="rf-group">Group</label><select id="rf-group">' + groupOpts + '</select></div>' +
      '<div class="field" id="rf-round-field" style="display:none"><label for="rf-round">Round</label>' +
      '<select id="rf-round">' + roundOptionsHtml("playoff") + '</select></div>' +
      '</div>' +
      '<div class="field-row">' +
      '<div class="field"><label for="rf-a">Player A</label><select id="rf-a">' + playerOpts + '</select></div>' +
      '<div class="field"><label for="rf-b">Player B</label><select id="rf-b"><option value="">Choose Player A first\u2026</option></select></div>' +
      '</div>' +
      '<div id="rf-matchup-note" style="display:none"></div>' +
      '<details class="submit-history-toggle">' +
      '<summary>\u25b8 Need to log an older match from before this season?</summary>' +
      '<div class="history-box">' +
      '<input type="checkbox" id="rf-backfill"> ' +
      '<label for="rf-backfill">Yes, this is a past competition/tournament match (saves to History)</label>' +
      '</div>' +
      '</details>' +
      '<div id="rf-legs">' + legFieldsHtml("league", "") + '</div>' +
      '<div class="field-row">' +
      '<div class="field"><label for="rf-passcode">League passcode</label>' +
      '<input type="password" id="rf-passcode" autocomplete="off" required></div>' +
      '</div>' +
      '<div id="rf-msg" class="form-msg" aria-live="polite"></div>' +
      '<div class="btn-row"><button type="submit" class="btn" id="rf-submit">Submit result</button></div>' +
      '</form>' +
      '</div>';
  }

  function wireSubmitForm(submitUrl) {
    var form = $("resultForm");
    if (!form) return;
    var msg = $("rf-msg"), btn = $("rf-submit");
    var abortCtrl = null;

    /* Which kind of match we're logging. "league" writes to the Matches tab;
       "playoff" and "tournament" write to History tagged with a competition
       and a round, so they never disturb the league table. */
    var mode = "league";

    function modeTarget() {
      return mode === "league" ? "matches" : "history";
    }

    function modeCompetition() {
      if (mode === "playoff") return D.currentSeasonId();
      if (mode === "tournament") return D.tournamentId();
      return "";
    }

    function showMsg(kind, text) {
      msg.className = "form-msg is-" + kind;
      msg.textContent = text;
    }
    function showErr(text) { showMsg("err", text); return false; }
    function showWarn(text) { showMsg("warn", text); }

    /* How many legs the current match can run to. League is always best of
       3; a knockout match follows its round's format. */
    function currentBestOf() {
      if (mode === "league") return 3;
      var sel = $("rf-round");
      return bestOfForRound(mode, sel ? sel.value : "");
    }

    /* Rebuilds the leg fieldsets for the current mode and round, keeping
       anything already typed in for legs that still exist. */
    function rebuildLegs() {
      var wrap = $("rf-legs");
      if (!wrap) return;

      var kept = [];
      for (var n = 1; n <= 9; n++) {
        var w = $("rf-g" + n + "-winner");
        if (!w) break;
        kept.push({
          game: $("rf-g" + n + "-game").value,
          winner: w.value,
          a: $("rf-g" + n + "-a").value,
          b: $("rf-g" + n + "-b").value
        });
      }

      var code = mode === "league" ? "" : ($("rf-round") ? $("rf-round").value : "");
      wrap.innerHTML = legFieldsHtml(mode, code);

      kept.forEach(function (v, i) {
        var n = i + 1;
        if (!$("rf-g" + n + "-winner")) return;
        $("rf-g" + n + "-game").value = v.game;
        $("rf-g" + n + "-a").value = v.a;
        $("rf-g" + n + "-b").value = v.b;
      });

      refreshWinnerOptions();
      refreshAvgLabels();
    }

    function setMode(next) {
      mode = next;
      var modes = submitModes();
      var chosen = null;
      modes.forEach(function (m) { if (m.key === next) chosen = m; });

      Array.prototype.forEach.call(document.querySelectorAll("#rf-mode .segmented-btn"), function (b) {
        var on = b.getAttribute("data-mode") === next;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });

      var blurb = $("rf-mode-blurb");
      if (blurb && chosen) blurb.textContent = chosen.blurb;

      // League matches pick a group; knockout matches pick a round.
      var groupField = $("rf-group-field");
      var roundField = $("rf-round-field");
      if (groupField) groupField.style.display = next === "league" ? "" : "none";
      if (roundField) {
        roundField.style.display = next === "league" ? "none" : "";
        var sel = $("rf-round");
        if (sel) sel.innerHTML = roundOptionsHtml(next);
      }

      // A knockout match is always a History row, so the "older match"
      // checkbox is redundant there.
      var backfill = $("rf-backfill");
      if (backfill) {
        if (next !== "league") backfill.checked = false;
        var toggle = backfill.closest(".submit-history-toggle");
        if (toggle) toggle.style.display = next === "league" ? "" : "none";
      }

      rebuildLegs();
      refreshPlayerBOptions();
    }

    function refreshWinnerOptions() {
      var aId = $("rf-a").value, bId = $("rf-b").value;
      for (var n = 1; n <= 9; n++) {
        var sel = $("rf-g" + n + "-winner");
        if (!sel) break;
        var current = sel.value;
        sel.innerHTML = '<option value="">\u2013</option>' +
          (aId ? '<option value="' + U.esc(aId) + '">' + U.esc(D.player(aId).name) + '</option>' : '') +
          (bId ? '<option value="' + U.esc(bId) + '">' + U.esc(D.player(bId).name) + '</option>' : '');
        sel.value = (current === aId || current === bId) ? current : "";
      }
    }

    function refreshAvgLabels() {
      var aId = $("rf-a").value, bId = $("rf-b").value;
      var aName = aId ? D.player(aId).name : "Player A";
      var bName = bId ? D.player(bId).name : "Player B";
      for (var n = 1; n <= 9; n++) {
        var la = $("rf-g" + n + "-a-label");
        if (!la) break;
        la.innerHTML = "Avg (" + U.esc(aName) + ") <span class=\"muted\">\u2014 optional</span>";
        $("rf-g" + n + "-b-label").innerHTML = "Avg (" + U.esc(bName) + ") <span class=\"muted\">\u2014 optional</span>";
      }
    }

    function refreshPlayerBOptions() {
      var aId = $("rf-a").value;
      var bSel = $("rf-b");
      var prevB = bSel.value;
      var isHistory = mode !== "league" || $("rf-backfill").checked;
      var noteEl = $("rf-matchup-note");

      if (!aId) {
        bSel.innerHTML = '<option value="">Choose Player A first\u2026</option>';
        bSel.disabled = false;
        if (noteEl) noteEl.style.display = "none";
        refreshWinnerOptions();
        refreshAvgLabels();
        return;
      }

      var playerA = D.player(aId);
      var candidates = D.activePlayers().filter(function (p) { return p.id !== aId; });

      // A tournament can have its own entrant list, which may include people
      // who aren't in the league groups.
      if (mode === "tournament") {
        var entrants = D.tournamentShape().entrants;
        if (entrants && entrants.length) {
          candidates = entrants.filter(function (id) { return id !== aId; })
            .map(function (id) { return D.player(id); });
        }
      }

      // In regular season mode, filter opponents strictly to player A's group
      if (mode === "league" && !isHistory && playerA.group && playerA.group !== "?") {
        candidates = candidates.filter(function (p) { return p.group === playerA.group; });
      }
      candidates.sort(function (x, y) { return x.name.localeCompare(y.name); });

      var optsHtml = '<option value="">Choose Player B\u2026</option>';
      candidates.forEach(function (p) {
        var existing = (mode === "league" && !isHistory && D.findSeasonMatch)
          ? D.findSeasonMatch(aId, p.id) : null;
        if (existing) {
          var s = D.legScore(existing);
          var legStr = (existing.a === aId) ? (s.a + "\u2013" + s.b) : (s.b + "\u2013" + s.a);
          optsHtml += '<option value="' + U.esc(p.id) + '" disabled>' +
            U.esc(p.flag) + ' ' + U.esc(p.name) + ' (Already played: ' + legStr + ' on ' + U.esc(existing.date) + ')</option>';
        } else {
          optsHtml += '<option value="' + U.esc(p.id) + '">' + U.esc(p.flag) + ' ' + U.esc(p.name) + '</option>';
        }
      });

      bSel.innerHTML = optsHtml;
      bSel.disabled = false;

      // Keep previous selection only if still valid and not disabled
      var matchOpt = bSel.querySelector('option[value="' + prevB + '"]:not([disabled])');
      if (matchOpt) bSel.value = prevB; else bSel.value = "";

      checkMatchupWarning();
      refreshWinnerOptions();
      refreshAvgLabels();
    }

    function checkMatchupWarning() {
      var aId = $("rf-a").value, bId = $("rf-b").value;
      var noteEl = $("rf-matchup-note");
      if (!noteEl) return;
      var isHistory = mode !== "league" || $("rf-backfill").checked;

      if (!aId || !bId || isHistory) {
        noteEl.style.display = "none";
        noteEl.innerHTML = "";
        return;
      }

      var existing = D.findSeasonMatch ? D.findSeasonMatch(aId, bId) : null;
      if (existing) {
        var s = D.legScore(existing);
        var dateFormatted = U.date ? U.date(existing.date) : existing.date;
        noteEl.className = "matchup-note is-played";
        noteEl.innerHTML = '\u26a0\ufe0f <strong>Match already recorded:</strong> ' +
          U.esc(D.playerName(existing.a)) + ' (' + s.a + ') v ' +
          U.esc(D.playerName(existing.b)) + ' (' + s.b + ') on ' + U.esc(dateFormatted) + '.';
        noteEl.style.display = "flex";
      } else {
        noteEl.style.display = "none";
        noteEl.innerHTML = "";
      }
    }

    $("rf-a").addEventListener("change", function () {
      var aId = this.value;
      var groupSel = $("rf-group");
      if (!groupSel.dataset.touched && aId) {
        var p = D.player(aId);
        if (p && p.group && p.group !== "?") groupSel.value = p.group;
      }
      refreshPlayerBOptions();
    });

    $("rf-b").addEventListener("change", function () {
      checkMatchupWarning();
      refreshWinnerOptions();
      refreshAvgLabels();
    });

    $("rf-group").addEventListener("change", function () { this.dataset.touched = "1"; });

    var roundSel = $("rf-round");
    if (roundSel) {
      roundSel.addEventListener("change", function () { rebuildLegs(); });
    }

    $("rf-backfill").addEventListener("change", function () {
      refreshPlayerBOptions();
    });

    Array.prototype.forEach.call(document.querySelectorAll("#rf-mode .segmented-btn"), function (b) {
      b.addEventListener("click", function () {
        setMode(b.getAttribute("data-mode"));
      });
    });

    /* Deep link: submit.html?mode=playoff / ?mode=tournament preselects the
       mode, so the bracket page can send people straight here. */
    var wanted = new URLSearchParams(window.location.search).get("mode");
    if (wanted && submitModes().some(function (m) { return m.key === wanted; })) {
      setMode(wanted);
    } else if (D.isTournament() && submitModes().some(function (m) { return m.key === "tournament"; })) {
      setMode("tournament");
    } else if (D.phase() === "playoffs") {
      setMode("playoff");
    }

    /* --- Vision OCR / Screen Scanner --- */
    var scanInput = $("rf-scan-input");
    var scanLabel = $("rf-scan-label");

    function resizeImage(file, maxDimension, callback) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var canvas = document.createElement("canvas");
          var width = img.width, height = img.height;
          if (width > height) {
            if (width > maxDimension) { height = Math.round((height * maxDimension) / width); width = maxDimension; }
          } else {
            if (height > maxDimension) { width = Math.round((width * maxDimension) / height); height = maxDimension; }
          }
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          callback(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function showScanConfirmModal(data, previewDataUrls) {
      var existingModal = $("scan-confirm-modal");
      if (existingModal) existingModal.remove();

      var modal = document.createElement("div");
      modal.id = "scan-confirm-modal";
      modal.className = "glimpse-modal open";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");

      function renderModalContent() {
        var pA = (data.playerA && data.playerA !== "unknown") ? (D.player(data.playerA) || { name: data.playerA, flag: "" }) : null;
        var pB = (data.playerB && data.playerB !== "unknown") ? (D.player(data.playerB) || { name: data.playerB, flag: "" }) : null;

        var playerHeader = "";
        if (pA && pB) {
          playerHeader = '<span class="scan-player-tag">' + (pA.flag ? pA.flag + " " : "") + U.esc(pA.name) + '</span> ' +
            '<span class="muted">vs</span> ' +
            '<span class="scan-player-tag">' + (pB.flag ? pB.flag + " " : "") + U.esc(pB.name) + '</span>' +
            '<button type="button" class="btn btn-quiet btn-sm scan-swap-btn" id="rf-scan-swap-sides" title="Swap Player A and B">⇄ Swap Sides</button>';
        } else if (pA) {
          playerHeader = (pA.flag ? pA.flag + " " : "") + U.esc(pA.name) + ' <span class="muted">vs [Unknown opponent - select below]</span>';
        } else {
          playerHeader = '<span class="muted">[Select players below in form]</span>';
        }

        var legsHtml = (data.legs && data.legs.length)
          ? data.legs.map(function (l, idx) {
              var w = (l.winner && l.winner !== "unknown") ? (D.player(l.winner) || { name: l.winner }) : { name: "\u2013" };
              var canToggle = (data.playerA && data.playerB && data.playerA !== "unknown" && data.playerB !== "unknown");
              var winnerBtn = canToggle
                ? '<button type="button" class="scan-winner-toggle" data-leg-idx="' + idx + '" title="Tap to flip winner"><strong class="accent-good">' + U.esc(w.name) + '</strong> <span class="muted tiny">⟳</span></button>'
                : '<strong class="accent-good">' + U.esc(w.name) + '</strong>';

              return '<tr>' +
                '<td><strong>Leg ' + (idx + 1) + '</strong> (' + U.esc(l.game || "") + ')</td>' +
                '<td>' + winnerBtn + '</td>' +
                '<td class="mono">' + (l.aStat != null ? l.aStat : "\u2013") + ' / ' + (l.bStat != null ? l.bStat : "\u2013") + '</td>' +
                '</tr>';
            }).join("")
          : '<tr><td colspan="3" class="muted">No legs detected</td></tr>';

        var previewsHtml = previewDataUrls.map(function (url) {
          return '<img src="' + url + '" class="scan-preview-img" alt="Screen photo preview" style="max-height:160px;margin-bottom:8px">';
        }).join("");

        modal.innerHTML =
          '<div class="glimpse-backdrop"></div>' +
          '<div class="glimpse-dialog">' +
          '  <button type="button" class="glimpse-close" id="rf-scan-close" aria-label="Close">&times;</button>' +
          '  <h3 style="margin:0 0 4px">Are these results correct?</h3>' +
          '  <p class="muted tiny" style="margin:0 0 10px">Tap <strong>⇄ Swap Sides</strong> or tap any <strong>Winner ⟳</strong> to flip if needed.</p>' +
          '  <div style="display:flex;gap:8px;overflow-x:auto">' + previewsHtml + '</div>' +
          '  <div class="scan-header-wrap" style="font-size:1.05rem;font-weight:600;margin:10px 0 6px;display:flex;align-items:center;flex-wrap:wrap;gap:8px">' + playerHeader + '</div>' +
          '  <div class="scan-legs-summary">' +
          '    <table>' +
          '      <thead><tr><th>Leg / Game</th><th>Winner (Tap to toggle)</th><th>Averages (' + (pA ? U.esc(pA.name) : "P1") + ' / ' + (pB ? U.esc(pB.name) : "P2") + ')</th></tr></thead>' +
          '      <tbody>' + legsHtml + '</tbody>' +
          '    </table>' +
          '  </div>' +
          '  <div class="btn-row" style="margin-top:16px">' +
          '    <button type="button" class="btn" id="rf-scan-accept">Looks good! Populate Form</button>' +
          '    <button type="button" class="btn btn-quiet" id="rf-scan-reject">Cancel / Edit by hand</button>' +
          '  </div>' +
          '</div>';

        wireModalEvents();
      }

      function wireModalEvents() {
        $("rf-scan-close").addEventListener("click", closeModal);
        $("rf-scan-reject").addEventListener("click", closeModal);
        $("rf-scan-accept").addEventListener("click", acceptAndPopulate);

        var swapBtn = $("rf-scan-swap-sides");
        if (swapBtn) {
          swapBtn.addEventListener("click", function () {
            var tmpA = data.playerA;
            data.playerA = data.playerB;
            data.playerB = tmpA;
            (data.legs || []).forEach(function (l) {
              var tmpStat = l.aStat;
              l.aStat = l.bStat;
              l.bStat = tmpStat;
            });
            renderModalContent();
          });
        }

        modal.querySelectorAll(".scan-winner-toggle").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var idx = parseInt(btn.getAttribute("data-leg-idx"), 10);
            if (isNaN(idx) || !data.legs || !data.legs[idx]) return;
            var l = data.legs[idx];
            if (l.winner === data.playerA) {
              l.winner = data.playerB;
            } else {
              l.winner = data.playerA;
            }
            renderModalContent();
          });
        });
      }

      function closeModal() {
        modal.remove();
        document.body.classList.remove("lightbox-locked");
      }

      function acceptAndPopulate() {
        closeModal();

        // Populate Player A
        if (data.playerA && data.playerA !== "unknown" && D.player(data.playerA)) {
          $("rf-a").value = data.playerA;
          var p = D.player(data.playerA);
          if (p && p.group && p.group !== "?") {
            $("rf-group").value = p.group;
            $("rf-group").dataset.touched = "1";
          }
          refreshPlayerBOptions();
        }

        // Populate Player B
        if (data.playerB && data.playerB !== "unknown" && D.player(data.playerB)) {
          $("rf-b").value = data.playerB;
          checkMatchupWarning();
          refreshWinnerOptions();
          refreshAvgLabels();
        }

        // Populate Legs
        if (data.legs && data.legs.length) {
          data.legs.forEach(function (l, idx) {
            var n = idx + 1;
            if (!$("rf-g" + n + "-winner")) return;
            if (l.game) {
              var gVal = l.game.toLowerCase().includes("cricket") ? "cricket" : "701";
              var gSel = $("rf-g" + n + "-game");
              if (gSel) gSel.value = gVal;
            }
            if (l.winner && l.winner !== "unknown") {
              var wSel = $("rf-g" + n + "-winner");
              if (wSel) wSel.value = l.winner;
            }
            if (l.aStat != null) {
              var aInp = $("rf-g" + n + "-a");
              if (aInp) aInp.value = l.aStat;
            }
            if (l.bStat != null) {
              var bInp = $("rf-g" + n + "-b");
              if (bInp) bInp.value = l.bStat;
            }
          });
        }

        showMsg("ok", "\u2713 Screen data imported into the form! Verify the fields below, enter the league passcode, and submit.");
        var formTop = form.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: formTop, behavior: "smooth" });
      }

      renderModalContent();
    }

    if (scanInput && D.config.resultsForm && D.config.resultsForm.scanUrl) {
      scanInput.addEventListener("change", function (ev) {
        var files = ev.target.files;
        if (!files || !files.length) return;

        var fileArr = Array.prototype.slice.call(files).slice(0, 2); // max 2 files

        scanInput.disabled = true;
        scanLabel.textContent = "\u23f3 Scanning " + fileArr.length + " screen(s)\u2026";
        showMsg("pending", "Analyzing " + fileArr.length + " photo(s) with AI\u2026 please wait.");

        var resizedImages = [];
        var loaded = 0;

        fileArr.forEach(function (file, idx) {
          resizeImage(file, 1200, function (dataUrl) {
            resizedImages[idx] = dataUrl;
            loaded++;
            if (loaded === fileArr.length) {
              var payload = {
                images: resizedImages,
                players: D.activePlayers().map(function (p) {
                  return { id: p.id, name: p.name, dartslive: p.dartslive || p.name };
                })
              };

              fetch(D.config.resultsForm.scanUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                  scanInput.disabled = false;
                  scanLabel.textContent = "\ud83d\udcf7 Select 1 or 2 Photos";
                  scanInput.value = "";

                  if (res && res.ok && res.data) {
                    showMsg("", "");
                    showScanConfirmModal(res.data, resizedImages);
                  } else {
                    showMsg("err", (res && res.error) || "Couldn\u2019t parse the screen(s) \u2014 try again or enter the score manually.");
                  }
                })
                .catch(function (err) {
                  scanInput.disabled = false;
                  scanLabel.textContent = "\ud83d\udcf7 Select 1 or 2 Photos";
                  scanInput.value = "";
                  showMsg("err", "Error connecting to screen scanner (" + (err.message || err) + "). You can still enter the result manually below.");
                });
            }
          });
        });
      });
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      showMsg("", "");

      var date = $("rf-date").value;
      var isHistory = mode !== "league" || $("rf-backfill").checked;
      var group = $("rf-group").value;
      var round = mode === "league" ? "" : ($("rf-round") ? $("rf-round").value : "");
      var aId = $("rf-a").value, bId = $("rf-b").value;
      var passcode = $("rf-passcode").value;

      if (!date) return showErr("Pick a date.");
      if (!aId || !bId) return showErr("Pick both players.");
      if (aId === bId) return showErr("Player A and Player B can\u2019t be the same person.");
      if (mode === "league" && !isHistory && !group) {
        return showErr("Pick a group \u2014 or tick \u201cOld result\u201d if this isn\u2019t part of the current season.");
      }
      if (mode !== "league" && !round) {
        return showErr("Pick which round this " + (mode === "tournament" ? "tournament" : "playoff") + " match is.");
      }

      // Check if this match was already recorded this season
      if (mode === "league" && !isHistory) {
        var existing = D.findSeasonMatch ? D.findSeasonMatch(aId, bId) : null;
        if (existing) {
          var proceed = window.confirm(
            "A match between " + D.playerName(aId) + " and " + D.playerName(bId) +
            " was already logged on " + existing.date + ".\n\nAre you sure you want to submit another?"
          );
          if (!proceed) return showMsg("", "");
        }
      }

      // Check recent submission cache to protect against rapid double-clicks / pub wifi confusion
      var lastSubRaw = sessionStorage.getItem("datsu_last_sub");
      if (lastSubRaw) {
        try {
          var lastSub = JSON.parse(lastSubRaw);
          var elapsedSec = Math.round((Date.now() - (lastSub.time || 0)) / 1000);
          var isSameMatch = ((lastSub.a === aId && lastSub.b === bId) || (lastSub.a === bId && lastSub.b === aId));
          if (isSameMatch && elapsedSec < 300) {
            var minAgo = Math.max(1, Math.round(elapsedSec / 60));
            var allowDup = window.confirm(
              "You just submitted a match for " + D.playerName(aId) + " v " + D.playerName(bId) +
              " about " + minAgo + " minute(s) ago.\n\nDid you mean to submit another, or did you accidentally tap submit twice?"
            );
            if (!allowDup) return showMsg("", "");
          }
        } catch (e) {}
      }

      var bestOf = currentBestOf();
      var needed = legsToWin(bestOf);

      var legs = [];
      var noAvgLegs = [];
      for (var n = 1; n <= bestOf; n++) {
        var game = $("rf-g" + n + "-game").value;
        var winner = $("rf-g" + n + "-winner").value;
        var aStat = $("rf-g" + n + "-a").value;
        var bStat = $("rf-g" + n + "-b").value;
        var statsGiven = aStat !== "" || bStat !== "";
        var statsComplete = aStat !== "" && bStat !== "";

        if (statsGiven && !statsComplete) {
          return showErr("Leg " + n + " has an average for one player but not the other \u2014 fill in both, or leave them both blank.");
        }

        if (!winner) {
          if (statsGiven) return showErr("Leg " + n + " has an average filled in but no winner picked.");
          // A leg with no winner is only allowed once the match is already
          // decided — i.e. after the winner has reached `needed` legs.
          var soFarA = legs.filter(function (l) { return l.winner === aId; }).length;
          var soFarB = legs.filter(function (l) { return l.winner === bId; }).length;
          if (Math.max(soFarA, soFarB) < needed) {
            return showErr("Pick a winner for leg " + n + ".");
          }
          continue;
        }

        if (!statsComplete) noAvgLegs.push(n);
        legs.push({
          game: game, winner: winner,
          aStat: statsComplete ? parseFloat(aStat) : null,
          bStat: statsComplete ? parseFloat(bStat) : null
        });
      }

      var winsA = legs.filter(function (l) { return l.winner === aId; }).length;
      var winsB = legs.filter(function (l) { return l.winner === bId; }).length;
      var maxWins = Math.max(winsA, winsB);
      var minWins = Math.min(winsA, winsB);

      if (maxWins < needed) {
        return showErr("Nobody has won " + needed + " legs yet \u2014 a best-of-" + bestOf +
          " needs " + needed + " to win. Add the missing leg" + (needed - maxWins > 1 ? "s" : "") + ".");
      }
      if (maxWins > needed) {
        return showErr("That\u2019s " + maxWins + " legs to " + minWins + ", but a best-of-" + bestOf +
          " ends at " + needed + ". Double check the winners.");
      }

      if (noAvgLegs.length) {
        var allMissing = noAvgLegs.length === legs.length;
        var warnWhich = allMissing ? "this result" : "leg" + (noAvgLegs.length > 1 ? "s " : " ") + noAvgLegs.join(" & ");
        var ok = window.confirm("No game averages recorded for " + warnWhich +
          " \u2014 the win/loss and legs still count fine, you\u2019ll just skip this match in the 01 Avg/Cricket Avg stats. Submit anyway?");
        if (!ok) return showMsg("", "");
      }

      var payload = {
        passcode: passcode,
        target: modeTarget(),
        date: date,
        group: mode === "league" ? group : "",
        a: aId, b: bId, legs: legs
      };
      // Knockout rows carry a competition and a round so they land on the
      // right archive page and never count toward the league table.
      if (mode !== "league") {
        payload.competition = modeCompetition();
        payload.round = round;
      }

      // Summary details for the confirmation screen
      var matchWinnerId = winsA > winsB ? aId : bId;
      var matchLoserId = winsA > winsB ? bId : aId;
      var matchScore = Math.max(winsA, winsB) + "\u2013" + Math.min(winsA, winsB);
      var subSummary = {
        winnerName: D.playerName(matchWinnerId),
        loserName: D.playerName(matchLoserId),
        score: matchScore,
        group: mode === "league" ? group : "",
        date: date,
        round: round,
        mode: mode
      };

      btn.disabled = true;
      btn.textContent = "Chucking dart at sheet\u2026";
      showMsg("pending", "Whispering your score to the Google Sheet across the pub Wi-Fi\u2026 don\u2019t panic.");

      // 20-second timeout to handle poor pub Wi-Fi gracefully without permanently hanging
      if (window.AbortController) {
        abortCtrl = new AbortController();
      }
      var timeoutId = setTimeout(function () {
        if (abortCtrl) abortCtrl.abort();
      }, 20000);

      var fetchOpts = {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      };
      if (abortCtrl) fetchOpts.signal = abortCtrl.signal;

      fetch(submitUrl, fetchOpts)
        .then(function (r) { return r.json(); })
        .then(function (res) {
          clearTimeout(timeoutId);
          btn.disabled = false;
          btn.textContent = "Submit result";

          if (res && res.ok) {
            // Save to session cache to prevent rapid double-clicks
            try {
              sessionStorage.setItem("datsu_last_sub", JSON.stringify({
                a: aId, b: bId, time: Date.now()
              }));
            } catch (e) {}

            // Replace the form with a clear success card
            var wrap = $("submit-form-wrap");
            if (wrap) {
              wrap.innerHTML = submitSuccessCardHtml(subSummary);
              var anotherBtn = $("rf-submit-another");
              if (anotherBtn) {
                anotherBtn.addEventListener("click", function () {
                  wrap.outerHTML = submitFormHtml();
                  wireSubmitForm(submitUrl);
                });
              }
            }
          } else {
            showMsg("err", (res && res.error) || "The sheet said no \u2014 check the passcode and try again.");
          }
        })
        .catch(function (err) {
          clearTimeout(timeoutId);
          btn.disabled = false;
          btn.textContent = "Retry submission";

          var isTimeout = err && err.name === "AbortError";
          if (isTimeout) {
            showWarn(
              "\ud83c\udf7a 20 seconds and no answer \u2014 HUB\u2019s Wi-Fi has clearly had one pint too many! " +
              "The sheet might have actually taken the score before passing out, so please refresh the results to double check before you smash submit again."
            );
          } else {
            showWarn(
              "\ud83c\udfaf Couldn\u2019t reach the sheet \u2014 HUB\u2019s Wi-Fi is throwing darts in the dark again. " +
              "Your score might have snuck through anyway, so refresh the results to double check before having another go."
            );
          }
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

  /* ============================================================ ADMIN === */
  /* Two once-a-season jobs, both of which would otherwise mean hand-editing
     seventy rows in a spreadsheet:

       1. Season rollover — review this season's rows, fix anything wrong,
          then append them to the History tab tagged with the season id and
          clear the Matches tab.
       2. Finalize bracket — freeze the current standings into
          data/playoffs.js so a late result can't move the seeds.

     Nothing here writes to the site's own files (a static page can't). It
     generates the blocks you paste in, and talks to the Apps Script for the
     sheet work.                                                          */

  function adminSeasonId() {
    return D.currentSeasonId() || "2026-fall";
  }

  /* The rows we'd move, in the shape the History tab expects. */
  function rolloverRows() {
    return (D.matches || []).filter(function (m) { return !m.isUnplayedForfeit; })
      .map(function (m) {
        return {
          date: m.date || "",
          group: m.group || "",
          a: m.a,
          b: m.b,
          legs: (m.legs || []).map(function (l) {
            return { game: l.game, winner: l.winner, aStat: l.aStat, bStat: l.bStat };
          }),
          round: m.round || ""
        };
      });
  }

  /* Everything that would make a row land wrong in the History tab. */
  function validateRow(row, index, seen) {
    var problems = [];
    if (!row.date) problems.push("no date");
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) problems.push("date isn't YYYY-MM-DD");

    if (!row.a || !row.b) problems.push("missing a player");
    if (row.a && row.b && row.a === row.b) problems.push("same player twice");

    [row.a, row.b].forEach(function (id) {
      if (!id) return;
      var p = D.player(id);
      if (!p || p.name === id) problems.push("unknown player \u201c" + id + "\u201d");
    });

    if (!row.legs.length) problems.push("no legs");

    var winsA = 0, winsB = 0;
    row.legs.forEach(function (l, i) {
      if (!l.winner) problems.push("leg " + (i + 1) + " has no winner");
      else if (l.winner !== row.a && l.winner !== row.b) {
        problems.push("leg " + (i + 1) + " winner isn't one of the two players");
      }
      if (l.winner === row.a) winsA++;
      if (l.winner === row.b) winsB++;
    });

    if (row.legs.length === 2 && winsA === 1 && winsB === 1) {
      problems.push("two legs at 1\u20131 \u2014 a decider is missing");
    }
    if (row.legs.length >= 3 && Math.max(winsA, winsB) < 2) {
      problems.push("nobody reached two legs");
    }

    var key = row.date + "|" + [row.a, row.b].sort().join("|");
    if (seen[key]) problems.push("duplicate of row " + seen[key]);
    else seen[key] = index + 1;

    return problems;
  }

  /* Safe, mechanical fixes: trim ids, uppercase groups, ISO dates, drop
     empty legs, and normalise the round code. Anything that needs a human
     decision (a missing winner, an unknown player) is left alone and
     re-flagged. */
  function normaliseRow(row) {
    var out = {
      date: String(row.date || "").trim(),
      group: String(row.group || "").trim().toUpperCase(),
      a: String(row.a || "").trim().toLowerCase(),
      b: String(row.b || "").trim().toLowerCase(),
      round: String(row.round || "").trim().toUpperCase(),
      legs: []
    };

    // 2026/11/07 or 7 Nov 2026 -> 2026-11-07
    var d = out.date;
    var slash = d.match(/^(\d{4})[\/.](\d{1,2})[\/.](\d{1,2})$/);
    if (slash) {
      out.date = slash[1] + "-" + pad2(+slash[2]) + "-" + pad2(+slash[3]);
    }

    (row.legs || []).forEach(function (l) {
      if (!l || !l.winner) return;
      out.legs.push({
        game: String(l.game || "leg").trim().toLowerCase(),
        winner: String(l.winner).trim().toLowerCase(),
        aStat: (typeof l.aStat === "number" && !isNaN(l.aStat)) ? l.aStat : null,
        bStat: (typeof l.bStat === "number" && !isNaN(l.bStat)) ? l.bStat : null
      });
    });

    return out;
  }

  /* The History tab is 42 columns wide (best of 9, so a best-of-7 final
     fits); the Matches tab is 16. Getting this wrong is what silently
     misaligns rows, so it's built in one place. */
  function historyRowArray(row, competition) {
    var out = [competition, row.date, row.group || "", row.a, row.b];
    for (var n = 0; n < 9; n++) {
      var leg = row.legs[n];
      out.push(leg ? leg.game : "", leg ? leg.winner : "",
        leg && leg.aStat !== null ? leg.aStat : "",
        leg && leg.bStat !== null ? leg.bStat : "");
    }
    out.push(row.round || "");
    return out;
  }

  function historyCsvLine(row, competition) {
    return historyRowArray(row, competition).map(function (v) {
      var s = String(v === null || v === undefined ? "" : v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(",");
  }

  var HISTORY_HEADER = "competition,date,group,playerA,playerB," +
    "g1game,g1winner,g1a,g1b,g2game,g2winner,g2a,g2b," +
    "g3game,g3winner,g3a,g3b,g4game,g4winner,g4a,g4b," +
    "g5game,g5winner,g5a,g5b,g6game,g6winner,g6a,g6b," +
    "g7game,g7winner,g7a,g7b,g8game,g8winner,g8a,g8b," +
    "g9game,g9winner,g9a,g9b,round";

  /* -------------------------------------------------- the rollover tool --- */

  function adminRolloverHtml() {
    var seasonId = adminSeasonId();
    var rows = rolloverRows();

    if (!rows.length) {
      return '<div class="card"><h3>Nothing to roll over</h3>' +
        '<p class="muted">There are no matches in this season\u2019s Matches tab right now.</p></div>';
    }

    return '<div class="card">' +
      '<h3>1. Review the rows</h3>' +
      '<p class="muted tiny">These are the ' + rows.length + ' matches currently in the Matches tab. ' +
      'Fix anything wrong before committing \u2014 a bad row here becomes a bad row in the archive forever.</p>' +
      '<div class="field-row" style="margin:16px 0">' +
      '<div class="field"><label for="ad-season">Competition id</label>' +
      '<input type="text" id="ad-season" value="' + U.esc(seasonId) + '"></div>' +
      '<div class="field"><label for="ad-round">Default round for every row</label>' +
      '<select id="ad-round"><option value="">Regular season</option>' +
      '<option value="R1">Round One</option><option value="R16">Round of 16</option>' +
      '<option value="QF">Quarter-finals</option><option value="SF">Semi-finals</option>' +
      '<option value="F">Final</option></select></div>' +
      '</div>' +
      '<div class="btn-row" style="margin-top:0;margin-bottom:16px">' +
      '<button type="button" class="btn btn-quiet" id="ad-normalise">Normalize rows</button>' +
      '<button type="button" class="btn btn-quiet" id="ad-revalidate">Re-check</button>' +
      '</div>' +
      '<div id="ad-table"></div>' +
      '<div id="ad-summary" style="margin-top:16px"></div>' +
      '</div>' +
      '<div class="card" style="margin-top:16px">' +
      '<h3>2. Commit</h3>' +
      '<p class="muted tiny">This appends every row to the <strong>History</strong> tab tagged with the ' +
      'competition id above, then clears the <strong>Matches</strong> tab (header row kept). ' +
      'It refuses to clear anything if the append fails.</p>' +
      '<div class="field-row" style="margin:16px 0">' +
      '<div class="field"><label for="ad-passcode">League passcode</label>' +
      '<input type="password" id="ad-passcode" autocomplete="off"></div>' +
      '<div class="field"><label for="ad-confirm">Type the competition id to confirm</label>' +
      '<input type="text" id="ad-confirm" placeholder="' + U.esc(seasonId) + '" autocomplete="off"></div>' +
      '</div>' +
      '<div class="btn-row" style="margin-top:0">' +
      '<button type="button" class="btn btn-quiet" id="ad-preview">Preview (writes nothing)</button>' +
      '<button type="button" class="btn" id="ad-commit">Commit rollover</button>' +
      '</div>' +
      '<div id="ad-msg" class="form-msg" aria-live="polite"></div>' +
      '</div>' +
      '<div class="card" style="margin-top:16px">' +
      '<h3>3. Paste these in afterwards</h3>' +
      '<p class="muted tiny">The site can\u2019t edit its own files, so these two blocks are yours to paste.</p>' +
      '<div id="ad-generated"></div>' +
      '</div>';
  }

  function adminTableHtml(rows, problems) {
    var body = rows.map(function (row, i) {
      var p = problems[i] || [];
      var cls = p.length ? " class=\"row-bad\"" : "";
      var legs = row.legs.map(function (l) {
        return U.esc(l.game) + " \u2192 " + U.esc(D.playerName(l.winner));
      }).join(", ");
      return '<tr' + cls + '>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + U.esc(row.date) + '</td>' +
        '<td>' + U.esc(row.group || "\u2013") + '</td>' +
        '<td>' + U.esc(D.playerName(row.a)) + ' <span class="muted">v</span> ' +
        U.esc(D.playerName(row.b)) +
        '<div class="admin-legs">' + legs + '</div></td>' +
        '<td>' + (p.length
          ? '<span class="accent-warm">' + U.esc(p.join("; ")) + '</span>'
          : '<span class="accent-good">\u2713</span>') + '</td>' +
        '</tr>';
    }).join("");

    return '<div class="table-wrap"><table class="data admin-table">' +
      '<thead><tr><th>#</th><th>Date</th><th>Grp</th><th>Match</th>' +
      '<th>Check</th></tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  function adminGeneratedHtml(rows, seasonId) {
    var csv = [HISTORY_HEADER].concat(rows.map(function (r) {
      return historyCsvLine(r, seasonId);
    })).join("\n");

    var archiveEntry =
      '  {\n' +
      '    id: "' + seasonId + '",\n' +
      '    type: "league",\n' +
      '    name: "' + (D.config.status.seasonName || seasonId) + '",\n' +
      '    dates: "' + (D.config.status.seasonName || seasonId) + '",\n' +
      '    venue: "' + (D.config.venue.name || "") + '",\n' +
      '    champion: "",\n' +
      '    runnerUp: "",\n' +
      '    playoffSpots: ' + (D.config.rules.playoffSpots || 6) + ',\n' +
      '    byesPerGroup: 0,\n' +
      '    blurb: "",\n' +
      '    highlights: [],\n' +
      '    finalTable: [],\n' +
      '    results: [],\n' +
      '    photos: []\n' +
      '  },';

    var resetMatches =
      '/* ===========================================================================\n' +
      '   DATSU — MATCH RESULTS (current season)\n' +
      '   ---------------------------------------------------------------------------\n' +
      '   Fresh season. Copy the m(...) shape from the top of the old file, or from\n' +
      '   docs/UPDATING.md, and add results as you play them.\n' +
      '   =========================================================================== */\n\n' +
      'window.DATSU = window.DATSU || {};\n\n' +
      'DATSU.matches = [\n' +
      '  /* Add results here. */\n' +
      '];\n';

    return '<p class="eyebrow" style="margin-top:18px">History tab rows (CSV)</p>' +
      '<p class="muted tiny">Paste into the History tab, replacing the header if it isn\u2019t already there.</p>' +
      '<textarea class="admin-code" readonly rows="8">' + U.esc(csv) + '</textarea>' +
      '<p class="eyebrow" style="margin-top:18px">data/archive.js entry</p>' +
      '<p class="muted tiny">Add to the top of the <code>DATSU.archive</code> array, then fill in the champion.</p>' +
      '<textarea class="admin-code" readonly rows="16">' + U.esc(archiveEntry) + '</textarea>' +
      '<p class="eyebrow" style="margin-top:18px">data/matches.js (reset)</p>' +
      '<p class="muted tiny">Replaces the whole file once the season is safely in History.</p>' +
      '<textarea class="admin-code" readonly rows="10">' + U.esc(resetMatches) + '</textarea>';
  }

  /* ------------------------------------------------- finalize the bracket --- */

  function adminBracketHtml() {
    var seeds = D.playoffSeeds();
    var finalized = D.bracketFinalized();

    var seedList = seeds.map(function (s, i) {
      return '<li>' + (i + 1) + '. <strong>' + U.esc(s.label) + '</strong> ' +
        U.esc(s.flag ? s.flag + " " : "") + U.esc(s.name) + '</li>';
    }).join("");

    var block =
      'DATSU.playoffs = {\n' +
      '  seasonId: "' + adminSeasonId() + '",\n' +
      '  finalizedAt: "' + todayIso() + '",\n' +
      '  seeds: [\n' +
      seeds.map(function (s) {
        return '    { id: "' + s.id + '", label: "' + s.label + '", group: "' +
          (s.group || "") + '", pos: ' + (s.pos || 0) + ' }';
      }).join(",\n") +
      '\n  ]\n' +
      '};';

    return '<div class="card">' +
      '<h3>Finalize the bracket</h3>' +
      '<p class="muted tiny">Freezes the seeds below into <code>data/playoffs.js</code>. ' +
      'After that, a late result or a forfeit can\u2019t quietly move the bracket.</p>' +
      (finalized
        ? '<p class="accent-good tiny">\u2713 A bracket is already frozen' +
          (D.playoffs.finalizedAt ? ' (finalized ' + U.esc(D.playoffs.finalizedAt) + ')' : '') +
          '. Pasting the block below replaces it.</p>'
        : '<p class="accent-warm tiny">No bracket frozen yet \u2014 the page is still projecting from the live tables.</p>') +
      '<ol class="admin-seeds">' + seedList + '</ol>' +
      '<p class="eyebrow" style="margin-top:18px">data/playoffs.js</p>' +
      '<textarea class="admin-code" readonly rows="' + (seeds.length + 6) + '">' + U.esc(block) + '</textarea>' +
      '<p class="eyebrow" style="margin-top:18px">Then flip the site over</p>' +
      '<p class="muted tiny">In <code>data/config.js</code>:</p>' +
      '<textarea class="admin-code" readonly rows="4">' +
      U.esc('status: {\n  phase: "playoffs",\n  ...\n}') + '</textarea>' +
      '</div>';
  }

  D.pages.admin = function () {
    var cfg = D.config.resultsForm || {};
    var rows = rolloverRows();
    var problems = [];
    var seen = {};

    function revalidate() {
      problems = [];
      seen = {};
      rows.forEach(function (r, i) { problems.push(validateRow(r, i, seen)); });
    }
    revalidate();

    function drawTable() {
      set("ad-table", adminTableHtml(rows, problems));
      var bad = problems.filter(function (p) { return p.length; }).length;
      set("ad-summary",
        bad
          ? '<p class="accent-warm tiny">\u26a0\ufe0f ' + bad + ' row' + (bad === 1 ? '' : 's') +
            ' need attention before committing.</p>'
          : '<p class="accent-good tiny">\u2713 All ' + rows.length + ' rows look clean.</p>');
    }

    set("admin-body",
      '<div class="card card-accent-warm" style="margin-bottom:16px">' +
      '<h3 class="accent-warm">Read this first</h3>' +
      '<p>Rolling over is the one destructive thing on this site. It appends every row to ' +
      '<strong>History</strong> and then <strong>clears the Matches tab</strong>. ' +
      'Use <em>Preview</em> first \u2014 it writes nothing and shows exactly what would happen.</p>' +
      '<p class="muted tiny">Google caches published sheets for a few minutes, so the site may keep ' +
      'showing the old season for a little while after a successful rollover. That\u2019s Google, not a bug.</p>' +
      '</div>' +
      adminRolloverHtml() +
      '<div style="margin-top:16px">' + adminBracketHtml() + '</div>');

    drawTable();
    set("ad-generated", adminGeneratedHtml(rows, adminSeasonId()));

    /* --- buttons ------------------------------------------------------- */

    var normaliseBtn = $("ad-normalise");
    if (normaliseBtn) {
      normaliseBtn.addEventListener("click", function () {
        var defaultRound = $("ad-round") ? $("ad-round").value : "";
        rows = rows.map(function (r) {
          var n = normaliseRow(r);
          if (!n.round && defaultRound) n.round = defaultRound;
          return n;
        });
        revalidate();
        drawTable();
        set("ad-generated", adminGeneratedHtml(rows, $("ad-season").value || adminSeasonId()));
      });
    }

    var revalidateBtn = $("ad-revalidate");
    if (revalidateBtn) {
      revalidateBtn.addEventListener("click", function () {
        revalidate();
        drawTable();
      });
    }

    var seasonInput = $("ad-season");
    if (seasonInput) {
      seasonInput.addEventListener("change", function () {
        set("ad-generated", adminGeneratedHtml(rows, seasonInput.value || adminSeasonId()));
      });
    }

    function adminMsg(kind, text) {
      var el = $("ad-msg");
      if (!el) return;
      el.className = "form-msg is-" + kind;
      el.textContent = text;
    }

    function payloadFor(action) {
      return {
        action: action,
        passcode: $("ad-passcode").value,
        competition: $("ad-season").value || adminSeasonId(),
        rows: rows.map(function (r) {
          return {
            date: r.date, group: r.group, a: r.a, b: r.b,
            round: r.round || "",
            legs: r.legs
          };
        })
      };
    }

    function post(action) {
      var url = cfg.submitUrl;
      if (!url) {
        adminMsg("err", "No Apps Script URL is set in data/config.js \u2192 resultsForm.submitUrl.");
        return Promise.resolve(null);
      }
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payloadFor(action))
      }).then(function (r) { return r.json(); });
    }

    var previewBtn = $("ad-preview");
    if (previewBtn) {
      previewBtn.addEventListener("click", function () {
        var bad = problems.filter(function (p) { return p.length; }).length;
        if (bad) {
          adminMsg("err", bad + " row(s) still need fixing \u2014 see the Check column.");
          return;
        }
        adminMsg("pending", "Asking the sheet what it would do\u2026");
        post("preview").then(function (res) {
          if (!res) return;
          if (res.ok) {
            adminMsg("ok", "\u2713 Preview: " + (res.wouldWrite || rows.length) +
              " rows would be appended to History as \u201c" + ($("ad-season").value || adminSeasonId()) +
              "\u201d, then the Matches tab would be cleared. Nothing has been written.");
          } else {
            adminMsg("err", res.error || "The sheet said no.");
          }
        }).catch(function (err) {
          adminMsg("err", "Couldn\u2019t reach the sheet: " + (err.message || err));
        });
      });
    }

    var commitBtn = $("ad-commit");
    if (commitBtn) {
      commitBtn.addEventListener("click", function () {
        var seasonId = $("ad-season").value || adminSeasonId();
        var typed = $("ad-confirm").value.trim();
        var bad = problems.filter(function (p) { return p.length; }).length;

        if (bad) {
          adminMsg("err", bad + " row(s) still need fixing \u2014 see the Check column.");
          return;
        }
        if (typed !== seasonId) {
          adminMsg("err", "Type \u201c" + seasonId + "\u201d in the confirm box to unlock the commit.");
          return;
        }
        if (!window.confirm(
          "This will append " + rows.length + " rows to the History tab as \u201c" + seasonId +
          "\u201d and then CLEAR the Matches tab.\n\nHave you run Preview and checked the rows?\n\n" +
          "This cannot be undone from the website.")) return;

        adminMsg("pending", "Rolling over\u2026 don\u2019t close this tab.");
        post("rollover").then(function (res) {
          if (!res) return;
          if (res.ok) {
            adminMsg("ok", "\u2713 Done. " + (res.written || rows.length) +
              " rows moved to History. Now paste the blocks below into data/archive.js and data/matches.js.");
          } else {
            adminMsg("err", res.error || "The sheet said no \u2014 nothing was cleared.");
          }
        }).catch(function (err) {
          adminMsg("err", "Couldn\u2019t reach the sheet: " + (err.message || err) +
            " \u2014 nothing was cleared.");
        });
      });
    }
  };
})();
