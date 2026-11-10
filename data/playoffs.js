/* ===========================================================================
   DATSU — FINALIZED PLAYOFF SEEDS (optional)
   ---------------------------------------------------------------------------
   Leave this file exactly as it is and the playoff bracket is worked out
   from the league tables every time the page loads — which is what the
   "as if the season ended today" projection has always done.

   Once the regular season is over, freeze the bracket instead. That way a
   late result, a forfeit, or someone being marked inactive can't quietly
   move the seeds after you've announced them.

   You do not have to write this by hand. Open admin.html, click
   "Finalize bracket", and it generates the block below for you to paste in.

   Shape:

     DATSU.playoffs = {
       seasonId: "2026-fall",
       finalizedAt: "2026-11-07",
       seeds: [
         { id: "liam",  label: "A1", group: "A", pos: 1 },
         { id: "ken",   label: "B1", group: "B", pos: 1 },
         ...
       ]
     };

   `id` must match a player id in data/players.js. `label` is what shows on
   the bracket ("A1", "B2"), and `pos` is the finishing position in that
   group. The order of the array is the seed order: first entry is the top
   seed overall.
   =========================================================================== */

window.DATSU = window.DATSU || {};

DATSU.playoffs = {
  seasonId: "2026-fall",
  finalizedAt: "2026-11-09",
  seeds: [
    { id: "liam", label: "A1", group: "A", pos: 1 },
    { id: "brady", label: "B1", group: "B", pos: 1 },
    { id: "martin", label: "A2", group: "A", pos: 2 },
    { id: "ken", label: "B2", group: "B", pos: 2 },
    { id: "mathieu", label: "A3", group: "A", pos: 3 },
    { id: "sunagawa", label: "B3", group: "B", pos: 3 },
    { id: "jibril", label: "A4", group: "A", pos: 4 },
    { id: "patrick", label: "B4", group: "B", pos: 4 },
    { id: "stoney", label: "A5", group: "A", pos: 5 },
    { id: "rei", label: "B5", group: "B", pos: 5 },
    { id: "nanki", label: "A6", group: "A", pos: 6 },
    { id: "ben", label: "B6", group: "B", pos: 6 }
  ]
};
