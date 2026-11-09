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

  /* ------------------------------------------------------- leg ceiling --- */

  /* The widest match the site can store. A best-of-7 is first to 4, so it
     can never run past seven legs — there is no such thing as leg 8. This
     is the single source of truth: the History tab is sized from it, the
     submit form is capped by it, and the CSV parser reads exactly this many
     leg columns. Raise it only if you also widen the History tab. */
  D.MAX_LEGS = 7;

  /* ------------------------------------------------------ index scaling --- */

  /* The ダーツ Index scores 100 at these two references. They live in
     config.index so the balance between 01 and cricket can be re-tuned
     without touching the maths. The defaults are the fallback if the
     config block is missing. */
  D.indexRef = function () {
    var c = (D.config && D.config.index) || {};
    return {
      ppd: Number(c.ppd) > 0 ? Number(c.ppd) : 60,
      mpr: Number(c.mpr) > 0 ? Number(c.mpr) : 2.2
    };
  };

  /* ------------------------------------------------------ player lookup --- */

  D.player = function (id) {
    for (var i = 0; i < D.players.length; i++) if (D.players[i].id === id) return D.players[i];
    return { id: id, name: id, dartslive: "", country: "", flag: "", group: "?", avatar: "", notes: [], active: true, forfeited: false };
  };

  D.playerName = function (id) { return D.player(id).name; };

  D.isPlayerForfeited = function (id) {
    if (!id) return false;
    var p = D.player(id);
    if (p && p.forfeited) return true;
    var list = (D.config && D.config.forfeitedPlayers) || [];
    return list.indexOf(id) !== -1;
  };

  D.isPlayerWithdrawn = function (id) {
    if (!id) return false;
    var p = D.player(id);
    if (p && p.withdrawn) return true;
    var list = (D.config && D.config.withdrawnPlayers) || [];
    return list.indexOf(id) !== -1;
  };

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

  D.competingPlayers = function () {
    return D.activePlayers().filter(function (p) { return !D.isPlayerWithdrawn(p.id) && !D.isPlayerForfeited(p.id); });
  };

  D.groupSize = function (group) {
    return D.competingPlayers().filter(function (p) { return p.group === group; }).length;
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
    var fa = D.isPlayerForfeited(match.a);
    var fb = D.isPlayerForfeited(match.b);
    if (fa && !fb) return { a: 0, b: 2, forfeited: match.a };
    if (fb && !fa) return { a: 2, b: 0, forfeited: match.b };
    var a = 0, b = 0;
    (match.legs || []).forEach(function (leg) {
      if (leg.winner === match.a) a++; else if (leg.winner === match.b) b++;
    });
    return { a: a, b: b };
  };

  D.rawLegScore = function (match) {
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
    var list = (D.matches || []).slice();
    var active = D.activePlayers();
    var forfeitedPlayers = active.filter(function (p) { return D.isPlayerForfeited(p.id); });

    forfeitedPlayers.forEach(function (fp) {
      var groupPeers = active.filter(function (p) { return p.id !== fp.id && p.group === fp.group; });
      groupPeers.forEach(function (peer) {
        var already = list.some(function (m) {
          return (m.a === fp.id && m.b === peer.id) || (m.a === peer.id && m.b === fp.id);
        });
        if (!already) {
          list.push({
            date: "",
            group: fp.group,
            a: peer.id,
            b: fp.id,
            legs: [],
            isUnplayedForfeit: true
          });
        }
      });
    });

    return list.sort(function (x, y) {
      if (x.isUnplayedForfeit && !y.isUnplayedForfeit) return 1;
      if (!x.isUnplayedForfeit && y.isUnplayedForfeit) return -1;
      return x.date < y.date ? 1 : x.date > y.date ? -1 : 0;
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
      if (m.isUnplayedForfeit || !m.date) return;
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
    // Both games score 100 at the reference in config.index, which is set so
    // the two references are equally far above the league's own averages.
    if (out.ppd !== null || out.mpr !== null) {
      var ref = D.indexRef();
      var p = out.ppd !== null ? Math.max(0, out.ppd / ref.ppd) : null;
      var c = out.mpr !== null ? Math.max(0, out.mpr / ref.mpr) : null;
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

  // Player match history: either this season only (careerMode = false) or
  // all logged matches across career (careerMode = true).
  D.playerMatches = function (pid, careerMode) {
    var player = D.player(pid);
    var pool = careerMode ? D.allMatchesEver() : D.sortedMatches();
    var matches = pool.filter(function (m) { return m.a === pid || m.b === pid; });
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

      var legDetails = (m.legs || []).map(function (leg) {
        var myStat = isA ? leg.aStat : leg.bStat;
        var oppStat = isA ? leg.bStat : leg.aStat;
        var g = String(leg.game || "leg").toLowerCase();
        var isCricket = g === "cricket";
        return {
          game: leg.game && leg.game !== "leg" ? leg.game : (isCricket ? "Cricket" : ((D.config.rules && D.config.rules.game1) || "01")),
          isCricket: isCricket,
          winner: leg.winner,
          iWon: leg.winner === pid,
          myStat: (typeof myStat === "number" && !isNaN(myStat)) ? myStat : null,
          oppStat: (typeof oppStat === "number" && !isNaN(oppStat)) ? oppStat : null,
          unit: isCricket ? "MPR" : "PPD"
        };
      });

      var round = String(m.round || "").trim().toLowerCase();
      var isPlayoff = /quarter|qf|semi|sf|final|fn|playoff/.test(round) || /playoff/.test(String(m.competition || "").toLowerCase());
      var roundLabel = "";
      if (/final|fn/.test(round)) roundLabel = "Playoff Final";
      else if (/semi|sf/.test(round)) roundLabel = "Playoff Semi-Final";
      else if (/quarter|qf/.test(round)) roundLabel = "Playoff Quarter-Final";
      else if (isPlayoff) roundLabel = "Playoff Match";

      return {
        opponent: D.player(oppId),
        win: win,
        mine: mine,
        theirs: theirs,
        date: m.date,
        competition: m.competition || "",
        round: round,
        roundLabel: roundLabel,
        isPlayoff: isPlayoff,
        legs: legDetails,
        rawLegs: m.legs || [],
        isForfeit: !!s.forfeited,
        forfeitedPlayerId: s.forfeited || null,
        isUnplayedForfeit: !!m.isUnplayedForfeit
      };
    });

    var upcoming = [];
    if (!careerMode) {
      upcoming = D.activePlayers()
        .filter(function (p) {
          if (p.id === pid || p.group !== player.group || playedIds[p.id]) return false;
          // Withdrawn or forfeited players don't have upcoming playable matches
          if (D.isPlayerWithdrawn(p.id) || D.isPlayerWithdrawn(pid)) return false;
          if (D.isPlayerForfeited(p.id) || D.isPlayerForfeited(pid)) return false;
          return true;
        })
        .map(function (p) { return { opponent: p }; });
    }

    return {
      player: player,
      isCareer: !!careerMode,
      completed: completed,
      upcoming: upcoming,
      record: { won: won, lost: lost, legsFor: legsFor, legsAgainst: legsAgainst, played: completed.length }
    };
  };

  D.playerSeasonGlimpse = function (pid) {
    return D.playerMatches(pid, false);
  };

  D.playerCareerGlimpse = function (pid) {
    return D.playerMatches(pid, true);
  };

  // Find any already-recorded match between two players this season (regular season).
  D.findSeasonMatch = function (p1, p2) {
    if (!p1 || !p2) return null;
    var matches = D.sortedMatches();
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      if (m.isUnplayedForfeit) continue;
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
    var groupPlayers = D.activePlayers().filter(function (p) { return p.group === group; });

    var rows = groupPlayers.map(function (p) {
      var s = D.statsFor(p.id);
      var isWithdrawn = D.isPlayerWithdrawn(p.id);
      var isForfeited = D.isPlayerForfeited(p.id);
      return {
        player: p, stats: s,
        isWithdrawn: isWithdrawn,
        isForfeited: isForfeited,
        played: s.played, won: s.won, lost: s.lost,
        legsFor: s.legsFor, legsAgainst: s.legsAgainst,
        legDiff: s.legsFor - s.legsAgainst,
        ppd: s.ppd, mpr: s.mpr
      };
    });

    rows.sort(function (x, y) {
      // Withdrawn and forfeited players stay at the bottom of the table
      var bottomX = x.isWithdrawn || x.isForfeited;
      var bottomY = y.isWithdrawn || y.isForfeited;
      if (bottomX && !bottomY) return 1;
      if (!bottomX && bottomY) return -1;
      if (y.won !== x.won) return y.won - x.won;
      if (y.legDiff !== x.legDiff) return y.legDiff - x.legDiff;
      if (y.legsFor !== x.legsFor) return y.legsFor - x.legsFor;
      return (y.ppd || 0) - (x.ppd || 0);
    });

    // Calculate playable remaining matches for each player.
    // An opponent is playable if they are in the same group, active, not withdrawn, not forfeited, and not yet played.
    rows.forEach(function (r, i) {
      r.pos = i + 1;
      r.isForfeited = D.isPlayerForfeited(r.player.id);

      var playableOpponents = groupPlayers.filter(function (p) {
        return p.id !== r.player.id && !D.isPlayerWithdrawn(p.id) && !D.isPlayerForfeited(p.id);
      });

      var unplayedPlayable = playableOpponents.filter(function (opp) {
        return !D.findSeasonMatch(r.player.id, opp.id);
      }).length;

      var playedMatches = r.played;
      r.remaining = (r.isWithdrawn || r.isForfeited) ? 0 : unplayedPlayable;
      r.totalRounds = playedMatches + r.remaining;
      r.isComplete = (r.isWithdrawn || r.isForfeited) ? true : (r.remaining === 0 && r.totalRounds > 0);
      r.maxWins = r.won + r.remaining;
      r.zone = (r.isWithdrawn || r.isForfeited) ? "out" : (r.pos <= byeSpots ? "bye" : r.pos <= playoffSpots ? "playoff" : "out");

      // Flag ties that the league would have to break another way
      r.tied = rows.some(function (o) {
        return o !== r && !o.isWithdrawn && !r.isWithdrawn && !o.isForfeited && !r.isForfeited && o.won === r.won && o.legDiff === r.legDiff;
      });
    });

    // Playoff outlook.
    //   couldOutrankMe        - active rivals who might still finish above me
    //   definitelyAboveMe     - active rivals I can no longer catch
    // Withdrawn and forfeited players are automatically marked eliminated ("out") and
    // do not consume qualification spots or compete with active contenders.
    var competingRows = rows.filter(function (r) { return !r.isWithdrawn && !r.isForfeited; });

    rows.forEach(function (r) {
      if (r.isWithdrawn || r.isForfeited) {
        r.outlook = "out";
        return;
      }
      var couldOutrankMe = 0, definitelyAboveMe = 0;
      competingRows.forEach(function (o) {
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

  /* ------------------------------------------------------------- awards --- */

  /* Season superlatives, worked out from any list of matches. The same
     function powers the current season and every archived competition, so
     an old season gets the same awards without anything being written down.

     Returns an array of:
       { key, title, blurb, winner: { player, value, display, detail } | null }

     `winner` is null when nobody qualifies (e.g. no deciders played yet), so
     the page can show a friendly "not enough matches" card instead. */
  D.awards = function (matches, opts) {
    opts = opts || {};
    var cfg = (D.config && D.config.awards) || {};
    var minGames = opts.minGames !== undefined ? opts.minGames
      : (cfg.minGames !== undefined ? cfg.minGames : 4);
    var excludeInactive = opts.excludeInactive !== false;

    var list = (matches || []).filter(function (m) {
      return m && m.a && m.b && !m.isUnplayedForfeit;
    });

    function skip(pid) {
      if (!excludeInactive) return false;
      return D.isPlayerForfeited(pid) || D.isPlayerWithdrawn(pid);
    }

    /* --- pass 1: raw totals ------------------------------------------- */
    var acc = {};
    function get(pid) {
      if (!acc[pid]) {
        acc[pid] = {
          id: pid, played: 0, won: 0, lost: 0,
          legsFor: 0, legsAgainst: 0,
          ppd: [], mpr: [], ppdSeries: [],
          deciders: 0, deciderWins: 0,
          closeLosses: 0, straightLosses: 0,
          winsOverHigher: 0, winsOverHigherGap: 0, bestScalp: null
        };
      }
      return acc[pid];
    }

    list.forEach(function (m) {
      if (skip(m.a) || skip(m.b)) return;
      var A = get(m.a), B = get(m.b);
      var s = D.legScore(m);
      var aWin = s.a > s.b, bWin = s.b > s.a;

      A.played++; B.played++;
      A.legsFor += s.a; A.legsAgainst += s.b;
      B.legsFor += s.b; B.legsAgainst += s.a;
      if (aWin) { A.won++; B.lost++; } else if (bWin) { B.won++; A.lost++; }

      if ((m.legs || []).length === 3) {
        A.deciders++; B.deciders++;
        if (aWin) A.deciderWins++; else if (bWin) B.deciderWins++;
      }
      if (bWin && s.a === 1) A.closeLosses++;
      if (aWin && s.b === 1) B.closeLosses++;
      if (bWin && s.a === 0) A.straightLosses++;
      if (aWin && s.b === 0) B.straightLosses++;

      (m.legs || []).forEach(function (leg) {
        var isCricket = String(leg.game).toLowerCase() === "cricket";
        if (typeof leg.aStat === "number" && !isNaN(leg.aStat)) {
          if (isCricket) A.mpr.push(leg.aStat);
          else { A.ppd.push(leg.aStat); A.ppdSeries.push({ v: leg.aStat, date: m.date || "" }); }
        }
        if (typeof leg.bStat === "number" && !isNaN(leg.bStat)) {
          if (isCricket) B.mpr.push(leg.bStat);
          else { B.ppd.push(leg.bStat); B.ppdSeries.push({ v: leg.bStat, date: m.date || "" }); }
        }
      });
    });

    function avg(a) {
      if (!a.length) return null;
      var t = 0;
      for (var i = 0; i < a.length; i++) t += a[i];
      return t / a.length;
    }
    function sd(a) {
      if (a.length < 2) return null;
      var m = avg(a), t = 0;
      for (var i = 0; i < a.length; i++) t += (a[i] - m) * (a[i] - m);
      return Math.sqrt(t / a.length);
    }

    var rows = Object.keys(acc).map(function (id) {
      var p = acc[id];
      p.ppdAvg = avg(p.ppd);
      p.mprAvg = avg(p.mpr);
      p.ppdSd = sd(p.ppd);
      p.winPct = p.played ? (p.won / p.played) * 100 : null;
      p.legDiff = p.legsFor - p.legsAgainst;
      p.deciderPct = p.deciders ? (p.deciderWins / p.deciders) * 100 : null;
      var ref = D.indexRef();
      p.index01 = p.ppdAvg === null ? null : (p.ppdAvg / ref.ppd) * 100;
      p.indexCricket = p.mprAvg === null ? null : (p.mprAvg / ref.mpr) * 100;
      p.specialistGap = (p.index01 !== null && p.indexCricket !== null)
        ? p.indexCricket - p.index01 : null;

      // First half vs second half of the season, in date order, for the
      // improvement / fade awards.
      var series = p.ppdSeries.slice().sort(function (x, y) {
        return x.date < y.date ? -1 : x.date > y.date ? 1 : 0;
      });
      if (series.length >= 6) {
        var half = Math.floor(series.length / 2);
        var first = avg(series.slice(0, half).map(function (x) { return x.v; }));
        var second = avg(series.slice(half).map(function (x) { return x.v; }));
        p.trend = second - first;
        p.trendFirst = first;
        p.trendSecond = second;
      } else {
        p.trend = null;
      }
      return p;
    });

    /* --- pass 2: table position and 01-average rank -------------------- */
    var table = rows.slice().sort(function (x, y) {
      if (y.won !== x.won) return y.won - x.won;
      if (y.legDiff !== x.legDiff) return y.legDiff - x.legDiff;
      if (y.legsFor !== x.legsFor) return y.legsFor - x.legsFor;
      return (y.ppdAvg || 0) - (x.ppdAvg || 0);
    });
    table.forEach(function (p, i) { p.tablePos = i + 1; });

    var byPpd = rows.filter(function (p) { return p.ppdAvg !== null; })
      .sort(function (x, y) { return y.ppdAvg - x.ppdAvg; });
    byPpd.forEach(function (p, i) { p.ppdRank = i + 1; });

    /* --- pass 3: wins over higher-placed opponents ---------------------
       Weighted by how far above you they finished, so beating the leader
       from 6th counts for more than beating 12th from 13th. */
    list.forEach(function (m) {
      if (skip(m.a) || skip(m.b)) return;
      var s = D.legScore(m);
      var A = acc[m.a], B = acc[m.b];
      if (!A || !B) return;
      if (s.a > s.b && A.tablePos > B.tablePos) {
        var gapA = A.tablePos - B.tablePos;
        A.winsOverHigher++;
        A.winsOverHigherGap += gapA;
        if (!A.bestScalp || gapA > A.bestScalp.gap) A.bestScalp = { id: m.b, gap: gapA };
      }
      if (s.b > s.a && B.tablePos > A.tablePos) {
        var gapB = B.tablePos - A.tablePos;
        B.winsOverHigher++;
        B.winsOverHigherGap += gapB;
        if (!B.bestScalp || gapB > B.bestScalp.gap) B.bestScalp = { id: m.a, gap: gapB };
      }
    });

    /* --- pass 4: pick the winners -------------------------------------- */
    var eligible = rows.filter(function (p) { return p.played >= minGames; });

    function ordinal(n) {
      var s = ["th", "st", "nd", "rd"], v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    /* dir "max" picks the highest score, "min" the lowest. Ties are broken
       by whatever the score function already encodes. */
    function pick(key, title, blurb, pool, score, format, detail, dir) {
      var best = null;
      pool.forEach(function (p) {
        var v = score(p);
        if (v === null || v === undefined || isNaN(v)) return;
        if (!best || (dir === "min" ? v < best.v : v > best.v)) best = { v: v, p: p };
      });
      return {
        key: key, title: title, blurb: blurb,
        winner: best ? {
          player: D.player(best.p.id),
          value: best.v,
          display: format(best.v, best.p),
          detail: detail ? detail(best.p) : ""
        } : null
      };
    }

    var withPpd = eligible.filter(function (p) { return p.ppdAvg !== null; });
    var withDeciders = eligible.filter(function (p) { return p.deciders >= 3; });
    var withSpread = eligible.filter(function (p) { return p.ppdSd !== null && p.ppd.length >= 6; });
    var withTrend = eligible.filter(function (p) { return p.trend !== null; });
    var withBoth = eligible.filter(function (p) { return p.specialistGap !== null; });
    // One lucky win isn't a giant-killing season — you need at least two.
    var withScalps = eligible.filter(function (p) { return p.winsOverHigher >= 2; });

    var all = [
      pick("unlucky", "Unlucky",
        "A good average, a bad record. The table is lying to them.",
        withPpd,
        function (p) { return p.tablePos - p.ppdRank; },
        function (v, p) { return D.util.num(p.ppdAvg) + " 01 avg"; },
        function (p) {
          return ordinal(p.ppdRank) + " best 01 average, " + ordinal(p.tablePos) + " in the table";
        }),

      pick("dominance", "Dominance",
        "Fewest defeats of anyone. Barely worth turning up against.",
        eligible,
        function (p) { return -p.lost * 1000 + (p.winPct || 0); },
        function (v, p) { return p.won + "\u2013" + p.lost; },
        function (p) { return D.util.num(p.winPct, 0) + "% win rate"; }),

      pick("heartbreak", "Heartbreak",
        "Lost on the deciding leg more than anyone. So close, so often.",
        eligible,
        function (p) { return p.closeLosses; },
        function (v) { return v + (v === 1 ? " one-leg loss" : " one-leg losses"); },
        function (p) { return "of " + p.lost + " defeats"; }),

      pick("clutch", "Clutch",
        "When it goes to a decider, they find another gear.",
        withDeciders,
        function (p) { return p.deciderPct * 1000 + p.deciders; },
        function (v, p) { return p.deciderWins + "/" + p.deciders; },
        function (p) { return D.util.num(p.deciderPct, 0) + "% of deciders won"; }),

      pick("bottler", "Bottler",
        "The decider is where their evening tends to end.",
        withDeciders,
        function (p) { return p.deciderPct * 1000 - p.deciders; },
        function (v, p) { return p.deciderWins + "/" + p.deciders; },
        function (p) { return D.util.num(p.deciderPct, 0) + "% of deciders won"; },
        "min"),

      pick("metronome", "Metronome",
        "Same number, every single leg. Deeply unsettling.",
        withSpread,
        function (p) { return p.ppdSd; },
        function (v) { return "\u00b1" + D.util.num(v); },
        function (p) { return "PPD spread over " + p.ppd.length + " legs"; },
        "min"),

      pick("rollercoaster", "Rollercoaster",
        "World-beater one leg, world-beaten the next.",
        withSpread,
        function (p) { return p.ppdSd; },
        function (v) { return "\u00b1" + D.util.num(v); },
        function (p) { return "PPD spread over " + p.ppd.length + " legs"; }),

      pick("improved", "Most Improved",
        "Started the season badly and finished it properly.",
        withTrend,
        function (p) { return p.trend; },
        function (v) { return (v > 0 ? "+" : "") + D.util.num(v); },
        function (p) {
          return D.util.num(p.trendFirst) + " \u2192 " + D.util.num(p.trendSecond) + " PPD";
        }),

      pick("fader", "Fader",
        "Peaked in September. It is not September.",
        withTrend,
        function (p) { return p.trend; },
        function (v) { return (v > 0 ? "+" : "") + D.util.num(v); },
        function (p) {
          return D.util.num(p.trendFirst) + " \u2192 " + D.util.num(p.trendSecond) + " PPD";
        },
        "min"),

      pick("giant-killer", "Giant Killer",
        "Beats the people above them and loses to the people below.",
        withScalps,
        function (p) { return p.winsOverHigherGap; },
        function (v, p) { return p.winsOverHigher + (p.winsOverHigher === 1 ? " scalp" : " scalps"); },
        function (p) {
          var best = p.bestScalp ? D.player(p.bestScalp.id) : null;
          return "worth " + p.winsOverHigherGap + " places" +
            (best ? ", best was " + best.name + " (" + p.bestScalp.gap + " above)" : "");
        }),

      pick("specialist", "Specialist",
        "One game is carrying the other.",
        withBoth,
        function (p) { return Math.abs(p.specialistGap); },
        function (v, p) {
          return p.specialistGap > 0 ? "Cricket" : "01";
        },
        function (p) {
          var gap = Math.abs(p.specialistGap);
          return D.util.num(gap, 0) + " index points better at " +
            (p.specialistGap > 0 ? "cricket" : "01");
        })
    ];

    // Awards switched off in config are dropped here rather than deleted, so
    // turning one back on is a one-word edit and archived seasons follow suit.
    var hidden = (D.config && D.config.awards && D.config.awards.hiddenAwards) || [];
    var shown = hidden.length
      ? all.filter(function (a) { return hidden.indexOf(a.key) === -1; })
      : all;

    /* Which awards only look at 01 legs. The site never blends 01 and
       cricket into one average, so the cards that do use an average say
       which one — otherwise "69.13 avg" is ambiguous next to a cricket
       average. Match-record awards (wins, deciders) need no label. */
    var basis = {
      unlucky: "01 only",
      metronome: "01 only",
      rollercoaster: "01 only",
      improved: "01 only",
      fader: "01 only"
    };
    shown.forEach(function (a) { a.basis = basis[a.key] || ""; });
    return shown;
  };

  // This season's awards, from the live match list.
  D.seasonAwards = function () {
    return D.awards(D.sortedMatches());
  };

  // Awards for a past competition, from its History rows. Regular-season
  // matches only, so a playoff run doesn't skew the "most improved" split.
  D.awardsForSeason = function (compId) {
    var all = D.archiveMatches(compId);
    if (!all.length) return [];
    var regular = all.filter(function (m) { return !m.round; });
    return D.awards(regular.length ? regular : all, { excludeInactive: false });
  };

  /* -------------------------------------------------------------- phase --- */

  /* Where the league is up to: "league" while matches are being played,
     "playoffs" once the bracket is finalized. `playoffsStarted` is the old
     name for the same thing, so it still works if it's the only one set. */
  D.phase = function () {
    var st = (D.config && D.config.status) || {};
    if (st.phase === "playoffs" || st.phase === "league") return st.phase;
    return st.playoffsStarted ? "playoffs" : "league";
  };

  /* A one-day tournament is a separate competition, not a stage of the
     league — so it's its own switch, and can be on during either phase. */
  D.isTournament = function () {
    var st = (D.config && D.config.status) || {};
    return !!st.tournamentMode;
  };

  /* The archive id this season's results get tagged with when they're moved
     into the History tab. Set explicitly in config; otherwise guessed from
     the season name ("Fall 2026 League" -> "2026-fall"). */
  D.currentSeasonId = function () {
    var st = (D.config && D.config.status) || {};
    if (st.seasonId) return String(st.seasonId).trim().toLowerCase();

    var name = String(st.seasonName || "");
    var year = (name.match(/\b(20\d{2})\b/) || [])[1];
    var seasons = ["winter", "spring", "summer", "fall", "autumn"];
    var season = "";
    for (var i = 0; i < seasons.length; i++) {
      if (new RegExp(seasons[i], "i").test(name)) { season = seasons[i]; break; }
    }
    if (season === "autumn") season = "fall";
    if (year && season) return year + "-" + season;
    return "";
  };

  /* The competition id a tournament's results get tagged with. */
  D.tournamentId = function () {
    var t = (D.config && D.config.tournament) || {};
    return String(t.archiveId || "").trim().toLowerCase();
  };

  /* Whether the Submit Result page should offer a "Tournament match" option.
     Off by default: a one-day tournament often isn't run off the site, and
     offering a form nobody uses is worse than not offering one. Turn it on
     with tournament.submitResults in data/config.js. */
  D.canSubmitTournament = function () {
    var t = (D.config && D.config.tournament) || {};
    return !!t.submitResults && !!D.tournamentId();
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
     Builds a bracket from a seed list, optionally filling in real results.

     Seeds are interleaved across the groups, so with two groups you get
     seed 1 = A1, seed 2 = B1, seed 3 = A2, seed 4 = B2, and so on. Feeding
     those into the standard slot order reproduces the league's own round-one
     pairings (A3-B6, A4-B5, B3-A6, B4-A5) without them being written down
     anywhere — so it still works if the groups change size.

     `lookup(homeId, awayId)` returns a played match for that pair, or null.
     When it returns one, the tie gets scores, a `won` flag on the winning
     side and a `winner` reference, which the next round then picks up.

     Returns: [{ name, format, ties:[...] }, ...]  one entry per round.
     ---------------------------------------------------------------------- */
  function buildBracket(seedList, shape, lookup) {
    if (shape.bracketSize < 2) return [];

    var order = seedOrder(shape.bracketSize);
    var totalRounds = shape.rounds;
    var rounds = [];

    function sideFromSeed(s) {
      if (!s) return null;
      return { label: s.label, name: s.name, id: s.id, flag: s.flag, outlook: s.outlook };
    }

    /* Fill in a round's results from the match list, if we have one. */
    function resolveRound(r) {
      if (!lookup) return;
      r.ties.forEach(function (tie) {
        if (tie.kind !== "tie" || !tie.home || !tie.away) return;
        if (!tie.home.id || !tie.away.id) return;
        var m = lookup(tie.home.id, tie.away.id);
        if (!m) return;
        var s = D.legScore(m);
        tie.match = m;
        tie.home.score = s.a;
        tie.away.score = s.b;
        if (s.a > s.b) { tie.home.won = true; tie.winner = tie.home; }
        else if (s.b > s.a) { tie.away.won = true; tie.winner = tie.away; }
      });
    }

    /* Whoever comes out of a tie and into the next round. */
    function advancing(tie) {
      if (!tie || tie.kind === "empty") return null;
      // A bye passes its player straight through to the next round.
      if (tie.kind === "bye") return tie.home;
      if (tie.winner) return tie.winner;
      return { label: "", name: "Winner " + tie.id, id: null, flag: "", pending: true };
    }

    /* --- first round: walk the slot order two slots at a time -----------
       Because the bracket is the SMALLEST power of two that fits everyone,
       there are always fewer byes than slots, so this round always contains
       at least one real tie. Slots nobody qualified for become byes. */
    var firstCode = roundCode(1, totalRounds);
    var ties = [];
    for (var i = 0; i < order.length; i += 2) {
      var pTop = sideFromSeed(seedList[order[i] - 1] || null);
      var pBot = sideFromSeed(seedList[order[i + 1] - 1] || null);
      var id = firstCode + "-" + (i / 2 + 1);

      if (pTop && pBot) ties.push({ id: id, kind: "tie", home: pTop, away: pBot });
      else if (pTop || pBot) ties.push({ id: id, kind: "bye", home: pTop || pBot, away: null });
      else ties.push({ id: id, kind: "empty", home: null, away: null });
    }

    var first = { name: roundName(1, totalRounds), format: roundFormat(1, totalRounds), ties: ties };
    resolveRound(first);
    rounds.push(first);

    /* --- every later round: pair up whoever comes through --------------- */
    for (var round = 2; round <= totalRounds; round++) {
      var previous = rounds[rounds.length - 1].ties;
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

      var r = { name: roundName(round, totalRounds), format: roundFormat(round, totalRounds), ties: next };
      resolveRound(r);
      rounds.push(r);
    }

    return rounds;
  }

  /* The seeds for this season's playoffs. If data/playoffs.js has frozen a
     snapshot (see the admin page), that wins — so a late result can't move
     the bracket after it's been finalized. Otherwise they're worked out from
     the current tables, which is what the "as if the season ended today"
     projection has always done. */
  D.playoffSeeds = function () {
    var frozen = D.playoffs;
    if (frozen && frozen.seeds && frozen.seeds.length) {
      return frozen.seeds.map(function (s) {
        var p = D.player(s.id);
        return {
          label: s.label, name: p.name, id: s.id, flag: p.flag,
          group: s.group, pos: s.pos
        };
      });
    }

    var shape = D.playoffShape();
    var tables = {};
    shape.groups.forEach(function (g) { tables[g] = D.standings(g); });

    var out = [];
    for (var pos = 1; pos <= shape.perGroup; pos++) {
      shape.groups.forEach(function (g) {
        var r = tables[g][pos - 1];
        if (r) out.push({
          label: g + pos, name: r.player.name, id: r.player.id,
          flag: r.player.flag, group: g, pos: pos, outlook: r.outlook
        });
      });
    }
    return out;
  };

  // True once the bracket has been frozen into data/playoffs.js.
  D.bracketFinalized = function () {
    return !!(D.playoffs && D.playoffs.seeds && D.playoffs.seeds.length);
  };

  /* Playoff matches for the current season. These live in the History tab
     tagged with the season id and a round, so they never touch the league
     table. A row with a round but no competition is treated as this
     season's, which keeps hand-entered rows working. */
  D.playoffMatches = function () {
    var seasonId = D.currentSeasonId();
    var pool = (D.matches || []).concat(D.history || []);
    function key(s) { return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""); }
    var target = key(seasonId);
    return pool.filter(function (m) {
      if (!m.round) return false;
      var c = key(m.competition);
      if (!c) return true;
      return !target || c === target;
    });
  };

  /* The bracket with real results filled in. Unplayed ties keep their
     "Winner QF-1" placeholder, so a half-finished bracket still reads.

     When the seeds are frozen we size the bracket from the frozen list, not
     from the live tables — otherwise marking a player inactive after the
     season ends would silently shrink a bracket that's already been played. */
  D.playoffBracket = function () {
    var seeds = D.playoffSeeds();
    var shape = D.bracketFinalized()
      ? shapeFromSeedCount(seeds.length)
      : D.playoffShape();
    var matches = D.playoffMatches();

    function lookup(a, b) {
      for (var i = 0; i < matches.length; i++) {
        var m = matches[i];
        if ((m.a === a && m.b === b) || (m.a === b && m.b === a)) return m;
      }
      return null;
    }

    return buildBracket(seeds, shape, lookup);
  };

  /* The bracket geometry for a given number of qualifiers, with no reference
     to groups or the live tables. */
  function shapeFromSeedCount(qualifiers) {
    var size = 1;
    while (size < qualifiers) size *= 2;
    if (qualifiers < 2) size = qualifiers;
    return {
      qualifiers: qualifiers,
      bracketSize: size,
      byes: size - qualifiers,
      rounds: size > 1 ? Math.log(size) / Math.log(2) : 0
    };
  }

  /* The projection: same bracket, no results, seeds straight from today's
     tables. Used while the league is still running. */
  D.projectedBracket = function () {
    return buildBracket(D.playoffSeeds(), D.playoffShape(), null);
  };

  /* --------------------------------------------------------- tournament --- */

  /* A one-day tournament is a flat knockout — no groups, no byes handed out
     by finishing position. Entrants come from config.tournament.entrants if
     it's filled in, otherwise every active player. Results come from the
     History tab, tagged with the tournament's archive id. */
  D.tournamentShape = function () {
    var t = (D.config && D.config.tournament) || {};
    var entrants = (t.entrants && t.entrants.length)
      ? t.entrants.slice()
      : D.activePlayers().map(function (p) { return p.id; });

    var shape = shapeFromSeedCount(entrants.length);
    shape.entrants = entrants;
    return shape;
  };

  D.tournamentMatches = function () {
    var id = D.tournamentId();
    if (!id) return [];
    function key(s) { return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""); }
    var target = key(id);
    return (D.allMatchesEver() || []).filter(function (m) {
      return key(m.competition) === target;
    });
  };

  D.tournamentBracket = function () {
    var shape = D.tournamentShape();
    var seeds = shape.entrants.map(function (id, i) {
      var p = D.player(id);
      return { label: String(i + 1), name: p.name, id: p.id, flag: p.flag };
    });
    var matches = D.tournamentMatches();

    function lookup(a, b) {
      for (var i = 0; i < matches.length; i++) {
        var m = matches[i];
        if ((m.a === a && m.b === b) || (m.a === b && m.b === a)) return m;
      }
      return null;
    }

    return buildBracket(seeds, shape, lookup);
  };

  /* ------------------------------------------------------------ archive --- */

  D.archiveItem = function (id) {
    for (var i = 0; i < (D.archive || []).length; i++) if (D.archive[i].id === id) return D.archive[i];
    return null;
  };

  /* Entries marked `hidden: true` in data/archive.js still exist — they keep
     their champion in the Roll of Honour and their results in the career
     averages — but they get no card on the Archive page, no link in the
     Archive menu, and no page of their own. Use it for a competition that
     happened but doesn't have enough behind it to fill a page. */
  D.archiveVisible = function () {
    return (D.archive || []).filter(function (a) { return !a.hidden; });
  };

  D.isArchiveHidden = function (itemOrId) {
    var a = typeof itemOrId === "string" ? D.archiveItem(itemOrId) : itemOrId;
    return Boolean(a && a.hidden);
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
    // Compare loosely: "2026-world-cup", "2026-worldcup" and "2026 World Cup"
    // are all the same competition, and a stray hyphen shouldn't silently
    // hide a whole archive page.
    function key(s) {
      return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    var target = key(compId);
    var a = D.archiveItem(compId);
    var targetName = a && a.name ? key(a.name) : "";
    return (D.allMatchesEver() || []).filter(function (m) {
      if (!m.competition) return false;
      var c = key(m.competition);
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

  /* Playoff knockout data for a past competition.

     The History tab is a flat list of results with a round code on each row.
     It has no idea which quarter-final feeds which semi, so drawing a bracket
     straight off row order can pair the wrong players together. Instead we
     rebuild the bracket from the round codes: group the rows by round, order
     the rounds from the earliest to the final, then walk forwards — each
     match in round N+1 is matched to the two round-N matches whose winners
     are its two players. That reconstructs the true shape whatever order the
     results were entered in, and works for any bracket size (R1, R16, QF,
     SF, F) rather than only ever knowing about quarters, semis and finals.

     Returns the same shape as before — `quarters`/`semis`/`finals` are kept
     so existing callers keep working, and `rounds` is the general version. */
  D.archivePlayoffs = function (compId) {
    var all = D.archiveMatches(compId);
    var playoffMatches = all.filter(function (m) { return !!m.round; });

    // Canonical order, earliest round first. Anything unrecognised is
    // treated as an opening round so it still shows up somewhere.
    var ORDER = ["R64", "R32", "R16", "R1", "R2", "QF", "SF", "F"];
    function rank(code) {
      var i = ORDER.indexOf(code);
      return i === -1 ? 0 : i;
    }

    var byRound = {};
    playoffMatches.forEach(function (m) {
      var code = m.round || "R1";
      (byRound[code] = byRound[code] || []).push(m);
    });

    var codes = Object.keys(byRound).sort(function (x, y) { return rank(x) - rank(y); });

    /* Walk forwards: for each match in the next round, find the two matches
       in the previous round that produced its two players, and put them in
       that order. Anything unmatched is appended so nothing is lost. */
    function orderPrevious(nextRound, prevRound) {
      if (!nextRound.length || !prevRound.length) return prevRound;
      var used = {};
      function take(pid) {
        for (var i = 0; i < prevRound.length; i++) {
          if (used[i]) continue;
          var m = prevRound[i];
          if (m.a === pid || m.b === pid) { used[i] = true; return m; }
        }
        return null;
      }
      var ordered = [];
      nextRound.forEach(function (m) {
        var first = take(m.a), second = take(m.b);
        if (first) ordered.push(first);
        if (second) ordered.push(second);
      });
      prevRound.forEach(function (m, i) { if (!used[i]) ordered.push(m); });
      return ordered;
    }

    // Work backwards from the final so each round is ordered to feed the next.
    var ordered = {};
    for (var i = codes.length - 1; i >= 0; i--) {
      var code = codes[i];
      var next = codes[i + 1] ? ordered[codes[i + 1]] : null;
      ordered[code] = next ? orderPrevious(next, byRound[code]) : byRound[code];
    }

    var rounds = codes.map(function (code) {
      return {
        code: code,
        name: roundNameForCode(code),
        matches: ordered[code]
      };
    });

    var finals = ordered["F"] || [];
    var semis = ordered["SF"] || [];
    var quarters = ordered["QF"] || [];

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
      rounds: rounds,
      quarters: quarters,
      semis: semis,
      finals: finals,
      champion: champ,
      runnerUp: runnerUp
    };
  };

  /* Human name for a round code, used by the archive bracket. */
  function roundNameForCode(code) {
    if (code === "F") return "Final";
    if (code === "SF") return "Semi-finals";
    if (code === "QF") return "Quarter-finals";
    if (code === "R1") return "Round One";
    if (code === "R2") return "Round Two";
    var m = String(code).match(/^R(\d+)$/);
    if (m) return "Round of " + m[1];
    return code;
  }
  D.roundNameForCode = roundNameForCode;

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

  /* Turns whatever someone typed in the `round` column into one of our
     canonical codes. Accepts the friendly words ("quarter", "semi", "final")
     and the bracket codes ("QF", "SF", "F", "R1", "R16"), in any case, with
     or without spaces or hyphens. Returns "" for a regular-season row. */
  function normaliseRound(raw) {
    var s = String(raw || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
    if (!s) return "";
    if (/^(f|fn|final)$/.test(s)) return "F";
    if (/^(sf|semi|semifinal|semifinals)$/.test(s)) return "SF";
    if (/^(qf|quarter|quarterfinal|quarterfinals)$/.test(s)) return "QF";
    var m = s.match(/^(?:r|round)(\d+)$/);
    if (m) {
      var n = parseInt(m[1], 10);
      if (n === 1) return "R1";
      if (n === 2) return "R2";
      if (n === 4) return "QF";
      if (n === 8) return "SF";
      if (n === 16) return "R16";
      if (n === 32) return "R32";
      if (n === 64) return "R64";
      return "R" + n;
    }
    if (/^(r1|roundone|firstround)$/.test(s)) return "R1";
    return "";
  }

  // Shared by the Matches tab and the History tab.
  // Reads up to D.MAX_LEGS legs (g1 through g7), which covers a best-of-7
  // playoff final. History tab can also optionally include:
  //   - `competition` / `season`: matches an archive item ID (e.g. "2026-spring")
  //   - `round`: "quarter", "semi", "final", "r1", "r16" ... (blank = regular season)
  function rowsToMatches(objs) {
    return objs.map(function (r) {
      var legs = [];
      for (var n = 1; n <= D.MAX_LEGS; n++) {
        var g = r["g" + n + "game"], w = r["g" + n + "winner"];
        if (!w) continue;
        g = g ? String(g).trim() : "leg";
        legs.push({
          game: g.toLowerCase(), winner: w,
          aStat: numOrNull(r["g" + n + "a"]), bStat: numOrNull(r["g" + n + "b"])
        });
      }
      return {
        date: r.date, group: (r.group || "").toUpperCase(),
        competition: (r.competition || r.season || r.comp || "").trim(),
        round: normaliseRound(r.round || r.stage),
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

        var localForfeited = {};
        var localWithdrawn = {};
        (D.players || []).forEach(function (p) {
          if (p.forfeited) localForfeited[p.id] = true;
          if (p.withdrawn) localWithdrawn[p.id] = true;
        });

        D.players = pl.map(function (r) {
          var isForfeit = false;
          if (r.forfeited !== undefined && r.forfeited !== null && String(r.forfeited).trim() !== "") {
            isForfeit = parseBool(r.forfeited, false);
          } else if (r.forfeit !== undefined && r.forfeit !== null && String(r.forfeit).trim() !== "") {
            isForfeit = parseBool(r.forfeit, false);
          } else if (localForfeited[r.id]) {
            isForfeit = true;
          }

          var isWithdrawn = false;
          if (r.withdrawn !== undefined && r.withdrawn !== null && String(r.withdrawn).trim() !== "") {
            isWithdrawn = parseBool(r.withdrawn, false);
          } else if (localWithdrawn[r.id]) {
            isWithdrawn = true;
          }

          return {
            id: r.id, name: r.name || r.id, dartslive: r.dartslive || "",
            country: r.country || "", flag: r.flag || "", group: (r.group || "A").toUpperCase(),
            avatar: r.avatar || "", active: parseBool(r.active, true),
            forfeited: isForfeit,
            withdrawn: isWithdrawn,
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
