/* ===========================================================================
   DATSU — MATCH RESULTS (current season)
   ---------------------------------------------------------------------------
   HOW TO ADD A RESULT — copy this shape:

   m("2025-04-29", "A", "alex", "yuki", [
     ["701",     "alex", 24.2, 21.8],   <- game, who won, alex's PPD, yuki's PPD
     ["cricket", "yuki",  2.05, 2.41],  <- game, who won, alex's MPR, yuki's MPR
     ["701",     "yuki", 22.0, 23.6]    <- only add a 3rd leg if it was needed
   ]),

   RULES OF THUMB
   - "701" legs take PPD (points per dart, straight off the DARTSLIVE screen)
   - "cricket" legs take MPR (marks per round)
   - The first number is ALWAYS the first player listed, the second number
     is ALWAYS the second player listed.
   - Whoever wins 2 legs wins the match. Stop at 2 legs if it was 2-0.
   - Newest results can go anywhere in the list — the site sorts by date.
   =========================================================================== */

(function () {
  window.DATSU = window.DATSU || {};

  function m(date, group, a, b, legs) {
    return {
      date: date,
      group: group,
      a: a,
      b: b,
      legs: legs.map(function (l) {
        return { game: l[0], winner: l[1], aStat: l[2], bStat: l[3] };
      })
    };
  }

  DATSU.matches = [
    /* ======================= WEEK 1 — 8 Apr 2025 ======================= */
    m("2025-04-08", "A", "alex", "yuki", [["701", "alex", 24.2, 21.8], ["cricket", "yuki", 2.05, 2.41], ["701", "yuki", 22.0, 23.6]]),
    m("2025-04-08", "A", "marco", "priya", [["701", "marco", 20.1, 18.4], ["cricket", "marco", 2.30, 1.88]]),
    m("2025-04-08", "A", "sam", "kenji", [["701", "kenji", 19.5, 23.1], ["cricket", "sam", 2.44, 2.10], ["cricket", "kenji", 2.02, 2.55]]),
    m("2025-04-08", "A", "brooke", "lucas", [["701", "brooke", 21.7, 19.0], ["cricket", "lucas", 1.95, 2.28], ["701", "brooke", 22.9, 20.4]]),
    m("2025-04-08", "A", "mei", "tom", [["701", "mei", 18.8, 17.2], ["cricket", "mei", 2.12, 1.79]]),

    m("2025-04-08", "B", "hana", "dave", [["701", "dave", 20.5, 26.1], ["cricket", "dave", 2.15, 2.62]]),
    m("2025-04-08", "B", "ana", "ryo", [["701", "ana", 19.9, 18.6], ["cricket", "ryo", 1.90, 2.33], ["701", "ana", 21.4, 19.1]]),
    m("2025-04-08", "B", "chloe", "nate", [["701", "nate", 17.6, 22.8], ["cricket", "chloe", 2.35, 2.01], ["cricket", "nate", 2.08, 2.47]]),
    m("2025-04-08", "B", "sofia", "daniel", [["701", "sofia", 21.2, 20.8], ["cricket", "sofia", 2.28, 2.14]]),
    m("2025-04-08", "B", "emma", "taka", [["701", "taka", 16.9, 19.8], ["cricket", "emma", 2.41, 1.85], ["701", "emma", 20.3, 18.2]]),

    /* ======================= WEEK 2 — 15 Apr 2025 ====================== */
    m("2025-04-15", "A", "yuki", "marco", [["701", "yuki", 25.0, 20.7], ["cricket", "yuki", 2.55, 2.19]]),
    m("2025-04-15", "A", "priya", "sam", [["701", "priya", 19.4, 18.9], ["cricket", "sam", 2.02, 2.31], ["701", "priya", 20.8, 17.5]]),
    m("2025-04-15", "A", "kenji", "brooke", [["701", "kenji", 23.6, 21.0], ["cricket", "brooke", 2.12, 2.40], ["cricket", "kenji", 2.61, 2.22]]),
    m("2025-04-15", "A", "lucas", "mei", [["701", "mei", 18.1, 19.6], ["cricket", "lucas", 2.20, 1.92], ["701", "lucas", 20.9, 18.7]]),
    m("2025-04-15", "A", "tom", "alex", [["701", "alex", 17.8, 24.9], ["cricket", "alex", 1.95, 2.48]]),

    m("2025-04-15", "B", "dave", "ana", [["701", "dave", 27.3, 19.2], ["cricket", "ana", 2.21, 2.38], ["701", "dave", 25.8, 20.1]]),
    m("2025-04-15", "B", "ryo", "chloe", [["701", "ryo", 20.2, 18.8], ["cricket", "ryo", 2.40, 2.05]]),
    m("2025-04-15", "B", "nate", "sofia", [["701", "sofia", 21.9, 22.4], ["cricket", "nate", 2.33, 2.00], ["701", "nate", 23.5, 21.1]]),
    m("2025-04-15", "B", "daniel", "emma", [["701", "emma", 19.1, 20.6], ["cricket", "daniel", 2.29, 2.08], ["cricket", "emma", 2.11, 2.44]]),
    m("2025-04-15", "B", "taka", "hana", [["701", "hana", 18.4, 21.7], ["cricket", "hana", 1.88, 2.52]]),

    /* ======================= WEEK 3 — 22 Apr 2025 ====================== */
    m("2025-04-22", "A", "alex", "marco", [["701", "alex", 26.4, 20.3], ["cricket", "marco", 2.10, 2.35], ["701", "alex", 25.1, 19.8]]),
    m("2025-04-22", "A", "yuki", "sam", [["701", "yuki", 24.8, 18.2], ["cricket", "yuki", 2.58, 2.15]]),
    m("2025-04-22", "A", "priya", "kenji", [["701", "kenji", 19.7, 23.9], ["cricket", "kenji", 2.05, 2.60]]),
    m("2025-04-22", "A", "brooke", "mei", [["701", "brooke", 22.3, 18.5], ["cricket", "mei", 2.05, 2.26], ["cricket", "brooke", 2.41, 2.12]]),
    m("2025-04-22", "A", "lucas", "tom", [["701", "lucas", 21.0, 17.4], ["cricket", "tom", 1.98, 2.19], ["701", "lucas", 20.5, 18.0]]),

    m("2025-04-22", "B", "hana", "ana", [["701", "hana", 22.6, 19.4], ["cricket", "hana", 2.49, 2.18]]),
    m("2025-04-22", "B", "dave", "ryo", [["701", "dave", 28.1, 20.0], ["cricket", "ryo", 2.24, 2.42], ["701", "dave", 26.0, 19.5]]),
    m("2025-04-22", "B", "chloe", "sofia", [["701", "sofia", 19.2, 21.0], ["cricket", "chloe", 2.37, 2.09], ["cricket", "chloe", 2.44, 2.15]]),
    m("2025-04-22", "B", "nate", "emma", [["701", "nate", 23.1, 20.2], ["cricket", "emma", 2.06, 2.38], ["701", "nate", 22.7, 19.6]]),
    m("2025-04-22", "B", "daniel", "taka", [["701", "daniel", 20.4, 18.9], ["cricket", "daniel", 2.31, 1.95]])
  ];
})();
