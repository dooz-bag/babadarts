/* ===========================================================================
   DATSU — MATCH RESULTS (everything before this season)
   ---------------------------------------------------------------------------
   This file is what powers "Career averages" on the Stats page — one PPD,
   one MPR, one win record per player, worked out across EVERY league and
   tournament they've ever played, not just the current one.

   You do not have to use it. Leave DATSU.history as an empty array and
   career averages will just equal this season's numbers, which is exactly
   what happens before anyone has bothered filling this in.

   HOW TO ADD OLD RESULTS — exactly the same shape as data/matches.js:

   m("2024-10-07", "A", "alex", "yuki", [
     ["701",     "alex", 23.8, 21.0],
     ["cricket", "yuki",  2.10, 2.35],
     ["701",     "yuki", 21.5, 22.9]
   ]),

   - The "group" can be left as "" if it was a knockout/tournament match
     rather than a league group game — career totals don't care about groups,
     that's only ever used for this season's tables.
   - Player ids must match an id in data/players.js (past or present). If
     someone has since left the league, add them back into players.js with
     a note like "Left 2024" so their name still shows up correctly.
   - Don't worry about getting this pixel-perfect from memory. A rough
     backfill of old PPD/MPR from old scoresheets or DARTSLIVE history is
     plenty — this is for bragging rights, not an audit.

   BULK-LOADING FROM A SPREADSHEET
   If you've got old results sitting in a spreadsheet already, it's usually
   quicker to paste them into a Google Sheet in this same shape and point
   `historyCsvUrl` at it in data/config.js, rather than typing them in here
   by hand. See data/history-example.csv for exactly what that looks like,
   and docs/GOOGLE-SHEET.md for the "History" tab instructions.
   =========================================================================== */

(function () {
  window.DATSU = window.DATSU || {};

  function m(date, group, a, b, legs, comp) {
    return {
      date: date,
      group: group,
      competition: comp || "",
      a: a,
      b: b,
      legs: legs.map(function (l) {
        return { game: l[0], winner: l[1], aStat: l[2], bStat: l[3] };
      })
    };
  }

  DATSU.history = [
    /* Nothing in here yet. Add old seasons/tournaments above this line,
       using the m(...) shape described above, e.g.:

       m("2024-10-07", "A", "alex", "yuki", [["701", "alex", 23.8, 21.0], ["cricket", "yuki", 2.10, 2.35], ["701", "yuki", 21.5, 22.9]]),
    */
  ];
})();
