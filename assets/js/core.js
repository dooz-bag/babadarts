/* ===========================================================================
   DATSU — CORE ENGINE
   ---------------------------------------------------------------------------
   Works out standings, averages, league bests and the playoff picture from
   the raw match results. You do not need to edit this file.
   =========================================================================== */

(function () {
  var D = (window.DATSU = window.DATSU || {});

  /* -------------------------------------------------------- utilities --- */

  D.util = {
    num: function (v, dp) {
      if (v === null || v === undefined || isNaN(v)) return "–";
      return Number(v).toFixed(dp === undefined ? 2 : dp);
    },
    signed: function (v) {
      if (v > 0) return "+" + v;
      return String(v);
    },
    date: function (iso) {
      if (!iso) return "";
      var p = String(iso).split("-");
      var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
      if (isNaN(d)) return iso;
      var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return d.getUTCDate() + " " + months[d.getUTCMonth()] + " " + d.getUTCFullYear();
    },
    weekday: function (iso) {
      if (!iso) return "";
      var p = String(iso).split("-");
      var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
      if (isNaN(d)) return "";
      return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getUTCDay()];
    },
    daysUntil: function (iso) {
      if (!iso) return null;
      var p = String(iso).split("-");
      var target = Date.UTC(+p[0], +p[1] - 1, +p[2]);
      var now = new Date();
      var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      return Math.round((target - today) / 86400000);
    },
    initials: function (name) {
      var clean = String(name || "").trim();
      // Japanese / CJK names: just take the first two characters
      if (/[\u3000-\u9fff\uff00-\uffef]/.test(clean)) return clean.slice(0, 2);
      var parts = clean.split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },
    esc: function (s) {
      return String(s === undefined || s === null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },
    // Deterministic colour per player so avatars stay the same every visit
    colourFor: function (key) {
      var palette = ["#3f6f74", "#7a4a52", "#6b6340", "#4a6a55", "#55507a", "#7a5c43"];
      var h = 0;
      for (var i = 0; i < String(key).length; i++) h = (h * 31 + String(key).charCodeAt(i)) % 9973;
      return palette[h % palette.length];
    }
  };

  /* ------------------------------------------------------ player lookup --- */

  D.player = function (id) {
    for (var i = 0; i < D.players.length; i++) if (D.players[i].id === id) return D.players[i];
    return { id: id, name: id, dartslive: "", country: "", flag: "", group: "?", avatar: "", notes: [] };
  };

  D.playerName = function (id) { return D.player(id).name; };

  // Everyone currently part of the league — i.e. not marked `active: false`.
  // A departed player still keeps their row in data/players.js (so career
  // stats keep their name, flag and avatar forever) but drops out of the
  // groups, standings, playoff bracket and this season's leaderboard.
  D.activePlayers = function () {
    return D.players.filter(function (p) { return p.active !== false; });
  };

  /* ------------------------------------------------------------- groups --- */

  // Whatever groups the ACTIVE players are actually in, in alphabetical order.
  // Nothing in the site assumes there are two of them, or how big they are.
  D.groups = function () {
    var seen = {}, out = [];
    D.activePlayers().forEach(function (p) {
      var g = p.group || "A";
      if (!seen[g]) { seen[g] = true; out.push(g); }
    });
    return out.sort();
  };

  D.groupSize = function (group) {
    return D.activePlayers().filter(function (p) { return p.group === group; }).length;
  };

  // Everyone plays everyone else in their group once.
  D.roundsInGroup = function (group) {
    return Math.max(0, D.groupSize(group) - 1);
  };

  /* ---------------------------------------------------- playoff shape --- */

  // How many qualify in total, and therefore how big the bracket has to be.
  D.playoffShape = function () {
    var groups = D.groups();
    // Clamp to the SMALLEST group, so an uneven season still produces a fair,
    // properly sized bracket instead of phantom empty slots.
    var sizes = groups.map(D.groupSize);
    var smallest = sizes.length ? Math.min.apply(null, sizes) : 0;
    var perGroup = Math.min(D.config.rules.playoffSpots, smallest);
    var qualifiers = perGroup * groups.length;

    // Smallest power of two that fits everyone, e.g. 12 qualifiers -> 16 slots
    var size = 1;
    while (size < qualifiers) size *= 2;
    if (qualifiers < 2) size = qualifiers;

    var byes = size - qualifiers;
    return {
      groups: groups,
      perGroup: perGroup,
      qualifiers: qualifiers,
      bracketSize: size,
      byes: byes,
      // Byes are handed out down the seed list, so this is how many players
      // in each group get one. Used to colour the league table.
      byesPerGroup: groups.length ? Math.floor(byes / groups.length) : 0,
      rounds: size > 1 ? Math.log(size) / Math.log(2) : 0
    };
  };

  /* ------------------------------------------------------------ matches --- */

  // How many legs each player won in a match
  D.legScore = function (match) {
    var a = 0, b = 0;
    (match.legs || []).forEach(function (leg) {
      if (leg.winner === match.a) a++; else if (leg.winner === match.b) b++;
    });
    return { a: a, b: b };
  };

  D.matchWinner = function (match) {
    var s = D.legScore(match);
    if (s.a === s.b) return null;
    return s.a > s.b ? match.a : match.b;
  };

  D.sortedMatches = function () {
    return D.matches.slice().sort(function (x, y) {
      return x.date < y.date ? 1 : x.date > y.date ? -1 : 0; // newest first
    });
  };

  /* Every match ever played: this season's results plus everything logged
     in data/history.js (or a History sheet). Used only for career totals —
     the current league table, playoffs etc. all stay scoped to D.matches so
     an old season never bleeds into this season's standings. */
  D.allMatchesEver = function () {
    return (D.matches || []).concat(D.history || []).sort(function (x, y) {
      return x.date < y.date ? 1 : x.date > y.date ? -1 : 0;
    });
  };

  // Groups matches into play nights: [{ date, matches:[...] }, ...] newest first
  D.matchNights = function () {
    var map = {}, order = [];
    D.sortedMatches().forEach(function (m) {
      if (!map[m.date]) { map[m.date] = []; order.push(m.date); }
      map[m.date].push(m);
    });
    return order.map(function (d) { return { date: d, matches: map[d] }; });
  };

  /* ------------------------------------------------- per-player numbers --- */

  // Shared by D.statsFor (this season only) and D.careerStatsFor (everything
  // ever played) — same maths, just a different list of matches fed in.
  function computeStats(pid, matches) {
    var out = {
      id: pid, played: 0, won: 0, lost: 0,
      legsFor: 0, legsAgainst: 0,
      ppdList: [], mprList: [],
      ppd: null, mpr: null, index: null,
      best01: null, bestCricket: null,
      games01: 0, gamesCricket: 0,
      form: [] // newest first, "W" / "L"
    };

    matches.forEach(function (m) {
      if (m.a !== pid && m.b !== pid) return;
      var isA = m.a === pid;
      var s = D.legScore(m);
      var mine = isA ? s.a : s.b;
      var theirs = isA ? s.b : s.a;

      out.played++;
      out.legsFor += mine;
      out.legsAgainst += theirs;
      if (mine > theirs) {
        out.won++;
        out.form.push("W");
      } else {
        out.lost++;
        out.form.push("L");
      }

      (m.legs || []).forEach(function (leg) {
        var v = isA ? leg.aStat : leg.bStat;
        if (typeof v !== "number" || isNaN(v)) return;
        var ctx = { value: v, date: m.date, opponent: isA ? m.b : m.a };
        if (String(leg.game).toLowerCase() === "cricket") {
          out.mprList.push(v);
          out.gamesCricket++;
          if (!out.bestCricket || v > out.bestCricket.value) out.bestCricket = ctx;
        } else {
          out.ppdList.push(v);
          out.games01++;
          if (!out.best01 || v > out.best01.value) out.best01 = ctx;
        }
      });
    });

    function avg(list) {
      if (!list.length) return null;
      var t = 0;
      list.forEach(function (n) { t += n; });
      return t / list.length;
    }
    out.ppd = avg(out.ppdList);
    out.mpr = avg(out.mprList);
    out.winPct = out.played ? (out.won / out.played) * 100 : null;

    // ダーツ INDEX — one number combining 01 and cricket form.
    // 60 PPD and 2.50 MPR would score 100.
    if (out.ppd !== null || out.mpr !== null) {
      var p = out.ppd !== null ? Math.max(0, out.ppd / 60) : null;
      var c = out.mpr !== null ? Math.max(0, out.mpr / 2.5) : null;
      if (p !== null && c !== null) out.index = (p * 50 + c * 50);
      else out.index = (p !== null ? p : c) * 100;
    }
    return out;
  }

  D.statsFor = function (pid) {
    return computeStats(pid, D.sortedMatches());
  };

  // Same numbers, but across every match this player has ever played —
  // this season plus whatever's in data/history.js (or a History sheet).
  D.careerStatsFor = function (pid) {
    return computeStats(pid, D.allMatchesEver());
  };

  // This season's leaderboard — active players only. A player who leaves
  // mid-season keeps everything they've already played in Career averages
  // (below), they just drop off this list and the current league table.
  D.allStats = function () {
    return D.activePlayers().map(function (p) {
      var s = D.statsFor(p.id);
      s.player = p;
      return s;
    });
  };

  // Everyone who has EVER played a match, current roster or not — a past
  // player who dropped out of players.js still keeps their career line.
  D.allCareerStats = function () {
    var ids = {};
    D.allMatchesEver().forEach(function (m) { ids[m.a] = true; ids[m.b] = true; });
    return Object.keys(ids).map(function (id) {
      var s = D.careerStatsFor(id);
      s.player = D.player(id);
      return s;
    });
  };

  // A quick glimpse of one player's CURRENT SEASON: every match they've
  // played so far (newest first) plus whoever is left in their group that
  // they haven't played yet. Powers the League Table's "tap a name" popup.
  D.playerSeasonGlimpse = function (pid) {
    var player = D.player(pid);
    var matches = D.sortedMatches().filter(function (m) { return m.a === pid || m.b === pid; });
    var playedIds = {};
    var legsFor = 0, legsAgainst = 0, won = 0, lost = 0;

    var completed = matches.map(function (m) {
      var isA = m.a === pid;
      var oppId = isA ? m.b : m.a;
      playedIds[oppId] = true;
      var s = D.legScore(m);
      var mine = isA ? s.a : s.b, theirs = isA ? s.b : s.a;
      var win = mine > theirs;
      legsFor += mine; legsAgainst += theirs;
      if (win) won++; else lost++;
      return { opponent: D.player(oppId), win: win, mine: mine, theirs: theirs, date: m.date };
    });

    // Whoever's left in their group that hasn't been played yet.
    var upcoming = D.activePlayers()
      .filter(function (p) { return p.id !== pid && p.group === player.group && !playedIds[p.id]; })
      .map(function (p) { return { opponent: p }; });

    return {
      player: player,
      completed: completed,
      upcoming: upcoming,
      record: { won: won, lost: lost, legsFor: legsFor, legsAgainst: legsAgainst, played: completed.length }
    };
  };

  // Find any already-recorded match between two players this season (regular season).
  D.findSeasonMatch = function (p1, p2) {
    if (!p1 || !p2) return null;
    var matches = D.sortedMatches();
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      if ((m.a === p1 && m.b === p2) || (m.a === p2 && m.b === p1)) {
        return m;
      }
    }
    return null;
  };

  /* ---------------------------------------------------------- standings --- */

  D.standings = function (group) {
    var rules = D.config.rules;
    var shape = D.playoffShape();
    var byeSpots = shape.byesPerGroup;
    var playoffSpots = shape.perGroup;
    var rows = D.activePlayers()
      .filter(function (p) { return p.group === group; })
      .map(function (p) {
        var s = D.statsFor(p.id);
        return {
          player: p, stats: s,
          played: s.played, won: s.won, lost: s.lost,
          legsFor: s.legsFor, legsAgainst: s.legsAgainst,
          legDiff: s.legsFor - s.legsAgainst,
          ppd: s.ppd, mpr: s.mpr
        };
      });

    rows.sort(function (x, y) {
      if (y.won !== x.won) return y.won - x.won;
      if (y.legDiff !== x.legDiff) return y.legDiff - x.legDiff;
      if (y.legsFor !== x.legsFor) return y.legsFor - x.legsFor;
      return (y.ppd || 0) - (x.ppd || 0);
    });

    // Matches per player comes from the size of the group itself, so adding
    // or dropping a player is handled automatically.
    var totalRounds = Math.max(0, rows.length - 1);

    rows.forEach(function (r, i) {
      r.pos = i + 1;
      r.remaining = Math.max(0, totalRounds - r.played);
      r.maxWins = r.won + r.remaining;
      r.zone = r.pos <= byeSpots ? "bye" : r.pos <= playoffSpots ? "playoff" : "out";
      // Flag ties that the league would have to break another way
      r.tied = rows.some(function (o) {
        return o !== r && o.won === r.won && o.legDiff === r.legDiff;
      });
    });

    // Playoff outlook.
    //   couldOutrankMe        - rivals who might still finish above me
    //   definitelyAboveMe     - rivals I can no longer catch
    // Players level on wins are separated by their current table position,
    // otherwise someone sitting 7th would be told they were safe.
    rows.forEach(function (r) {
      var couldOutrankMe = 0, definitelyAboveMe = 0;
      rows.forEach(function (o) {
        if (o === r) return;
        if (o.maxWins > r.won || (o.maxWins === r.won && o.pos < r.pos)) couldOutrankMe++;
        if (o.won > r.maxWins || (o.won === r.maxWins && o.pos < r.pos)) definitelyAboveMe++;
      });
      if (byeSpots > 0 && couldOutrankMe < byeSpots) r.outlook = "bye";
      else if (couldOutrankMe < playoffSpots) r.outlook = "in";
      else if (definitelyAboveMe >= playoffSpots) r.outlook = "out";
      else r.outlook = "hunt";
    });

    return rows;
  };

  D.outlookLabel = function (o) {
    return { bye: "BYE SECURED", in: "PLAYOFFS SECURED", hunt: "IN THE HUNT", out: "ELIMINATED" }[o] || "";
  };

  /* ------------------------------------------------------ league bests --- */

  // Works out the various "best of" leaders from any list of stats objects
  // (D.allStats() for this season, D.allCareerStats() for all-time).
  // `minGames` optionally requires a minimum number of matches played to qualify.
  D.leadersFrom = function (statsList, minGames) {
    var min = minGames || 1;
    var all = statsList.filter(function (s) { return s.played >= min; });

    function top(key, getter) {
      var best = null;
      all.forEach(function (s) {
        var v = getter(s);
        if (v === null || v === undefined || isNaN(v)) return;
        if (!best || v > best.value) best = { value: v, stats: s };
      });
      return best;
    }

    return {
      best01: top("ppd", function (s) { return s.ppd; }),
      bestCricket: top("mpr", function (s) { return s.mpr; }),
      bestOverall: top("index", function (s) { return s.index; }),
      mostWins: top("won", function (s) { return s.won; }),
      bestWinPct: top("winPct", function (s) { return s.played >= Math.max(min, 2) ? s.winPct : null; }),
      high01Game: top("best01", function (s) { return s.best01 ? s.best01.value : null; }),
      highCricketGame: top("bestCricket", function (s) { return s.bestCricket ? s.bestCricket.value : null; }),
      // Fun ones
      niceOne: (function () {
        var worst = null;
        all.forEach(function (s) {
          if (s.ppd === null) return;
          if (!worst || s.ppd < worst.value) worst = { value: s.ppd, stats: s };
        });
        return worst;
      })(),
      mrSpeaker: (function () {
        // Biggest gap between your best game and your average — wild inconsistency
        var w = null;
        all.forEach(function (s) {
          if (!s.best01 || s.ppd === null) return;
          var v = s.best01.value - s.ppd;
          if (!w || v > w.value) w = { value: v, stats: s };
        });
        return w;
      })()
    };
  };

  D.leaders = function () { return D.leadersFrom(D.allStats()); };

  // Best-of leaders across every match ever logged, not just this season.
  // Requires at least 5 games played to qualify for career leader cards.
  D.careerLeaders = function (minGames) {
    return D.leadersFrom(D.allCareerStats(), minGames !== undefined ? minGames : 5);
  };

  /* --------------------------------------------------- playoff bracket --- */

  /* Standard knockout slot order for a bracket of `n` places.
     seedOrder(8) -> [1,8,4,5,2,7,3,6], which is the usual arrangement that
     keeps the top seeds apart until as late as possible. */
  function seedOrder(n) {
    var arr = [1];
    while (arr.length < n) {
      var mirror = arr.length * 2 + 1, next = [];
      arr.forEach(function (s) { next.push(s, mirror - s); });
      arr = next;
    }
    return arr;
  }

  /* Names the rounds backwards from the final, so a bracket of any size gets
     sensible headings: ... Round of 16, Quarter-finals, Semi-finals, Final. */
  function roundName(roundIndex, totalRounds) {
    var fromEnd = totalRounds - roundIndex + 1; // 1 = the final
    if (fromEnd === 1) return "Final";
    if (fromEnd === 2) return "Semi-finals";
    if (fromEnd === 3) return "Quarter-finals";
    // The opening round usually has byes in it, so "Round of 16" would be a
    // lie when only 12 players are involved.
    if (roundIndex === 1) return "Round One";
    return "Round of " + Math.pow(2, fromEnd);
  }

  /* Short tag used in tie ids, e.g. "SF-1". */
  function roundCode(roundIndex, totalRounds) {
    var fromEnd = totalRounds - roundIndex + 1;
    if (fromEnd === 1) return "F";
    if (fromEnd === 2) return "SF";
    if (fromEnd === 3) return "QF";
    if (roundIndex === 1) return "R1";
    return "R" + Math.pow(2, fromEnd);
  }

  /* Picks the right format string from config for a given round. */
  function roundFormat(roundIndex, totalRounds) {
    var f = D.config.rules.playoffFormats || {};
    var fromEnd = totalRounds - roundIndex + 1;
    if (fromEnd === 1) return f.final || "";
    if (fromEnd === 2) return f.semiFinal || "";
    if (fromEnd === 3) return f.quarterFinal || "";
    return f.round1 || "";
  }

  /* -------------------------------------------------------------------------
     Builds the whole bracket from the league tables.

     Seeds are interleaved across the groups, so with two groups you get
     seed 1 = A1, seed 2 = B1, seed 3 = A2, seed 4 = B2, and so on. Feeding
     those into the standard slot order reproduces the league's own round-one
     pairings (A3-B6, A4-B5, B3-A6, B4-A5) without them being written down
     anywhere — so it still works if the groups change size.

     Returns: [{ name, format, ties:[...] }, ...]  one entry per round.
     ---------------------------------------------------------------------- */
  D.projectedBracket = function () {
    var shape = D.playoffShape();
    var groups = shape.groups;
    var tables = {};
    groups.forEach(function (g) { tables[g] = D.standings(g); });

    // seedList[0] is the top seed overall.
    var seedList = [];
    for (var pos = 1; pos <= shape.perGroup; pos++) {
      groups.forEach(function (g) {
        var r = tables[g][pos - 1];
        seedList.push(r ? {
          label: g + pos,
          name: r.player.name,
          id: r.player.id,
          flag: r.player.flag,
          outlook: r.outlook
        } : null);
      });
    }

    if (shape.bracketSize < 2) return [];

    var order = seedOrder(shape.bracketSize);
    var totalRounds = shape.rounds;
    var rounds = [];

    /* --- first round: walk the slot order two slots at a time -----------
       Because the bracket is the SMALLEST power of two that fits everyone,
       there are always fewer byes than slots, so this round always contains
       at least one real tie. Slots nobody qualified for become byes. */
    var firstCode = roundCode(1, totalRounds);
    var ties = [];
    for (var i = 0; i < order.length; i += 2) {
      var pTop = seedList[order[i] - 1] || null;
      var pBot = seedList[order[i + 1] - 1] || null;
      var id = firstCode + "-" + (i / 2 + 1);

      if (pTop && pBot) ties.push({ id: id, kind: "tie", home: pTop, away: pBot });
      else if (pTop || pBot) ties.push({ id: id, kind: "bye", home: pTop || pBot, away: null });
      else ties.push({ id: id, kind: "empty", home: null, away: null });
    }

    rounds.push({
      name: roundName(1, totalRounds),
      format: roundFormat(1, totalRounds),
      ties: ties
    });

    /* --- every later round: pair up whoever comes through --------------- */
    function advancing(tie) {
      if (!tie || tie.kind === "empty") return null;
      // A bye passes its player straight through to the next round.
      if (tie.kind === "bye") return tie.home;
      return { label: "", name: "Winner " + tie.id, id: null, flag: "", pending: true };
    }

    for (var round = 2; round <= totalRounds; round++) {
      var previous = rounds[rounds.length - 1].ties;
      var name = roundName(round, totalRounds);
      var prefix = roundCode(round, totalRounds);
      var next = [];

      for (var j = 0; j < previous.length; j += 2) {
        var h = advancing(previous[j]);
        var a = advancing(previous[j + 1]);
        next.push({
          id: prefix + "-" + (j / 2 + 1),
          kind: (h && a) ? "tie" : (h || a) ? "bye" : "empty",
          home: h, away: a
        });
      }

      rounds.push({ name: name, format: roundFormat(round, totalRounds), ties: next });
    }

    return rounds;
  };

  /* ------------------------------------------------------------ archive --- */

  D.archiveItem = function (id) {
    for (var i = 0; i < (D.archive || []).length; i++) if (D.archive[i].id === id) return D.archive[i];
    return null;
  };

  // True if an archive entry has actual documented content (photos, results,
  // final table, or logged match rows) rather than just a placeholder title.
  D.isArchivePopulated = function (itemOrId) {
    var a = typeof itemOrId === "string" ? D.archiveItem(itemOrId) : itemOrId;
    if (!a) return false;
    var hasPhotos = Array.isArray(a.photos) && a.photos.length > 0;
    var hasResults = Array.isArray(a.results) && a.results.length > 0;
    var hasTable = Array.isArray(a.finalTable) && a.finalTable.length > 0;
    var hasMatches = D.archiveMatches ? D.archiveMatches(a.id).length > 0 : false;
    return Boolean(hasPhotos || hasResults || hasTable || hasMatches);
  };

  // Matches tagged with a specific competition ID or name (from history or current season)
  D.archiveMatches = function (compId) {
    if (!compId) return [];
    var target = String(compId).trim().toLowerCase();
    var a = D.archiveItem(compId);
    var targetName = a && a.name ? a.name.trim().toLowerCase() : "";
    return (D.allMatchesEver() || []).filter(function (m) {
      if (!m.competition) return false;
      var c = String(m.competition).trim().toLowerCase();
      return c === target || (targetName && c === targetName);
    });
  };

  // Standings and stats calculated automatically from logged matches for a past competition.
  // Uses regular season matches (where round is empty) so playoff matches don't distort the table.
  D.archiveStats = function (compId, includePlayoffs) {
    var all = D.archiveMatches(compId);
    if (!all.length) return [];
    var regular = all.filter(function (m) { return !m.round; });
    var matches = (!includePlayoffs && regular.length) ? regular : all;
    var ids = {};
    matches.forEach(function (m) { ids[m.a] = true; ids[m.b] = true; });

    // Which group a player was actually in FOR THIS competition. A player's
    // group can be different from season to season (or from their current,
    // live-season group in data/players.js), so this is worked out purely
    // from the group column on their own rows in the History tab — whichever
    // group they show up against most often for this competition wins.
    var groupVotes = {};
    all.forEach(function (m) {
      var g = String(m.group || "").trim().toUpperCase();
      if (!g) return;
      [m.a, m.b].forEach(function (pid) {
        groupVotes[pid] = groupVotes[pid] || {};
        groupVotes[pid][g] = (groupVotes[pid][g] || 0) + 1;
      });
    });
    function groupFor(pid) {
      var votes = groupVotes[pid], best = "", bestCount = 0;
      Object.keys(votes || {}).sort().forEach(function (g) {
        if (votes[g] > bestCount) { best = g; bestCount = votes[g]; }
      });
      return best;
    }

    var stats = Object.keys(ids).map(function (id) {
      var s = computeStats(id, matches);
      s.player = D.player(id);
      s.group = groupFor(id);
      return s;
    });
    stats.sort(function (x, y) {
      if (y.won !== x.won) return y.won - x.won;
      var diffX = x.legsFor - x.legsAgainst, diffY = y.legsFor - y.legsAgainst;
      if (diffY !== diffX) return diffY - diffX;
      return (y.ppd || 0) - (x.ppd || 0);
    });
    return stats;
  };

  // Playoff knockout data extracted from matches with round = quarter/semi/final
  D.archivePlayoffs = function (compId) {
    var all = D.archiveMatches(compId);
    var playoffMatches = all.filter(function (m) { return !!m.round; });
    var quarters = playoffMatches.filter(function (m) { return m.round === "quarter"; });
    var semis = playoffMatches.filter(function (m) { return m.round === "semi"; });
    var finals = playoffMatches.filter(function (m) { return m.round === "final"; });

    // The History tab is just a flat list of results, usually in whatever
    // order they were actually played — it has no idea which quarter-final
    // feeds which semi, or which semi feeds the final. Drawn straight off
    // that order, a bracket can end up showing (say) QF-1's winner meeting
    // QF-3's winner in the semis, when the real bracket had them meeting
    // QF-2's winner. Fix: walk backwards from the final. For each match one
    // round up, pull its two competitors' own matches out of the previous
    // round and sit them side by side — that reconstructs the true bracket
    // shape no matter what order the results were entered in.
    function reorderToMatch(nextRound, prevRound) {
      if (!nextRound.length || !prevRound.length) return prevRound;
      var used = {};
      function take(pid) {
        for (var i = 0; i < prevRound.length; i++) {
          if (used[i]) continue;
          if (prevRound[i].a === pid || prevRound[i].b === pid) { used[i] = true; return prevRound[i]; }
        }
        return null;
      }
      var ordered = [];
      nextRound.forEach(function (m) {
        var first = take(m.a), second = take(m.b);
        if (first) ordered.push(first);
        if (second) ordered.push(second);
      });
      // Anything left over (e.g. this round isn't finished yet) is tacked
      // on at the end in its original order rather than silently dropped.
      prevRound.forEach(function (m, i) { if (!used[i]) ordered.push(m); });
      return ordered;
    }

    if (finals.length) semis = reorderToMatch(finals, semis);
    if (semis.length) quarters = reorderToMatch(semis, quarters);

    var champ = null, runnerUp = null;
    if (finals.length) {
      var fm = finals[0];
      var s = D.legScore(fm);
      if (s.a !== s.b) {
        champ = s.a > s.b ? D.player(fm.a) : D.player(fm.b);
        runnerUp = s.a > s.b ? D.player(fm.b) : D.player(fm.a);
      }
    }

    return {
      matches: playoffMatches,
      quarters: quarters,
      semis: semis,
      finals: finals,
      champion: champ,
      runnerUp: runnerUp
    };
  };

  /* ------------------------------------------- optional: google sheets --- */

  function parseCsv(text) {
    var rows = [], row = [], field = "", inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
        else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c !== "\r") field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ""; }); });
  }

  function toObjects(rows) {
    if (!rows.length) return [];
    var head = rows[0].map(function (h) { return String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, ""); });
    return rows.slice(1).map(function (r) {
      var o = {};
      head.forEach(function (h, i) { o[h] = (r[i] === undefined ? "" : String(r[i]).trim()); });
      return o;
    });
  }

  function numOrNull(v) {
    if (v === "" || v === undefined || v === null) return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  // Reads a loose true/false-ish CSV cell. Blank means "not set", so it
  // falls back to `def` — used to make the Players tab's `active` column
  // optional (blank = active) rather than forcing everyone to fill it in.
  function parseBool(v, def) {
    if (v === undefined || v === null || String(v).trim() === "") return def;
    var s = String(v).trim().toLowerCase();
    if (s === "false" || s === "no" || s === "n" || s === "0") return false;
    if (s === "true" || s === "yes" || s === "y" || s === "1") return true;
    return def;
  }

  // Shared by the Matches tab and the History tab.
  // Supports up to 5 legs (g1 through g5).
  // History tab can also optionally include:
  //   - `competition` / `season`: matches an archive item ID (e.g. "2026-spring")
  //   - `round`: "quarter", "semi", or "final" for playoff matches (blank = regular season)
  function rowsToMatches(objs) {
    return objs.map(function (r) {
      var legs = [];
      [1, 2, 3, 4, 5].forEach(function (n) {
        var g = r["g" + n + "game"], w = r["g" + n + "winner"];
        if (!w) return;
        g = g ? String(g).trim() : "leg";
        legs.push({
          game: g.toLowerCase(), winner: w,
          aStat: numOrNull(r["g" + n + "a"]), bStat: numOrNull(r["g" + n + "b"])
        });
      });
      var rawRound = String(r.round || r.stage || "").trim().toLowerCase();
      var normRound = "";
      if (/quarter|qf/.test(rawRound)) normRound = "quarter";
      else if (/semi|sf/.test(rawRound)) normRound = "semi";
      else if (/final|fn/.test(rawRound)) normRound = "final";
      return {
        date: r.date, group: (r.group || "").toUpperCase(),
        competition: (r.competition || r.season || r.comp || "").trim(),
        round: normRound,
        a: r.playera || r.a, b: r.playerb || r.b, legs: legs
      };
    }).filter(function (m) { return m.a && m.b && m.legs.length; });
  }

  function get(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    });
  }

  // Players + this season's matches. Controlled by sheet.enabled.
  function loadPlayersAndMatches(s) {
    if (!s.playersCsvUrl || !s.matchesCsvUrl) return Promise.resolve(false);
    return Promise.all([get(s.playersCsvUrl), get(s.matchesCsvUrl)])
      .then(function (res) {
        var pl = toObjects(parseCsv(res[0]));
        var mt = toObjects(parseCsv(res[1]));
        if (!pl.length || !mt.length) throw new Error("Sheet looks empty");

        D.players = pl.map(function (r) {
          return {
            id: r.id, name: r.name || r.id, dartslive: r.dartslive || "",
            country: r.country || "", flag: r.flag || "", group: (r.group || "A").toUpperCase(),
            avatar: r.avatar || "", active: parseBool(r.active, true),
            notes: (r.notes || "").split("|").map(function (x) { return x.trim(); }).filter(Boolean)
          };
        }).filter(function (p) { return p.id; });

        D.matches = rowsToMatches(mt);
        D.dataSource = "sheet";
        return true;
      })
      .catch(function (err) {
        // Never let a broken sheet take the site down — fall back to local data.
        console.warn("[DATSU] Google Sheet load failed, using local data files.", err);
        D.dataSource = "local-fallback";
        return false;
      });
  }

  // Career history is independent of the toggle above — you can keep this
  // season's results local and still pull old seasons from a sheet, or the
  // other way round. Same shape as the Matches tab, so the CSV is reusable.
  function loadHistory(url) {
    return get(url)
      .then(function (text) {
        var rows = toObjects(parseCsv(text));
        if (!rows.length) throw new Error("History sheet looks empty");
        D.history = rowsToMatches(rows);
        D.historySource = "sheet";
        return true;
      })
      .catch(function (err) {
        console.warn("[DATSU] History sheet load failed, using data/history.js instead.", err);
        D.historySource = "local-fallback";
        return false;
      });
  }

  D.loadFromSheet = function () {
    var s = D.config.sheet || {};
    var canFetch = typeof fetch === "function";

    var mainTask = (canFetch && s.enabled)
      ? loadPlayersAndMatches(s)
      : Promise.resolve(false);

    var historyTask = (canFetch && s.historyCsvUrl)
      ? loadHistory(s.historyCsvUrl)
      : Promise.resolve(false);

    return Promise.all([mainTask, historyTask]).then(function (res) { return res[0]; });
  };

  D.dataSource = "local";
  D.historySource = "local";
})();
