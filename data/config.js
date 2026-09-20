/* ===========================================================================
   DATSU — LEAGUE SETTINGS
   ---------------------------------------------------------------------------
   This is the "control panel" for the whole website.
   Change the text between the 'quote marks' and save the file. That's it.
   Don't delete the commas, quotes or curly brackets.
   =========================================================================== */

window.DATSU = window.DATSU || {};

DATSU.config = {
  /* ---- Branding ------------------------------------------------------- */
  leagueName: "Takadanobaba Darts League",
  leagueShortName: "TDL",
  tagline: "Two groups. One very loud bar.",

  /* ---- Who to contact ------------------------------------------------
     TODO: put the real LINE details in here. Either is enough:
       lineUrl  - a LINE invite link (line.me/ti/p/~something), makes the
                  button clickable
       lineId   - the plain @id, shown as text people can search for      */
  contact: {
    name: "",
    lineId: "",
    lineUrl: ""
  },

  /* ---- The venue ------------------------------------------------------ */
  venue: {
    name: "HUB Takadanobaba",
    nameJa: "HUB 高田馬場店",
    address: "Takadanobaba, Shinjuku-ku, Tokyo",
    mapsUrl: "https://maps.google.com/?q=HUB+Takadanobaba",
    note: "Downstairs, past the ¥290 pints. Listen for the swearing."
  },

  /* ---- CURRENT LEAGUE STATUS (the badge on the front page) ------------
     Two things only:

       running    true  = a league is on   -> green badge
                  false = nothing running  -> amber badge
       seasonName whatever you want it called                            */
  status: {
    running: true,
    seasonName: "Fall 2026 League",

    /* Set to true when the league is finished and you want the playoff
       bracket page to show the real bracket instead of a projection.   */
    playoffsStarted: false
  },

  /* ---- Scoring rules -------------------------------------------------- */
  rules: {
    pointsForWin: 2,
    pointsForLoss: 0,
    matchFormat: "Best of 3 legs",
    game1: "701",
    game2: "Cricket",
    game3: "Cork winner's choice — 701 or Cricket",

    /* Top N in each group make the playoffs.
       This is the ONLY playoff number you need to set.

       Everything else works itself out from however many players are
       actually in the groups this season:
         - matches per player   = (players in your group) - 1
         - round-one byes       = however many are needed to make the
                                  bracket a clean size
         - number of rounds     = however many the bracket needs

       So you can run a 10-player season, a 16-player season or a
       7-player tournament and never touch this file. */
    playoffSpots: 6,

    tiebreakers: [
      "Leg difference",
      "Head-to-head decider leg"
    ],
    playoffFormats: {
      round1: "Best of 3",
      quarterFinal: "Best of 3",
      semiFinal: "Best of 5",
      final: "Best of 7"
    }
  },

  /* ---- Inside jokes (rotate in the footer) ---------------------------- */
  quips: [
    "Nice one.",
    "Excellent grouping, Mr Speaker.",
    "That's a lovely 26.",
    "He's gone for the big fish and found the 5.",
    "Cork again, nobody saw that.",
    "Nice one. Genuinely. Well done."
  ],

  /* ---- GOOGLE SHEET (optional — see docs/GOOGLE-SHEET.md) -------------
     Leave enabled: false until you've followed that guide.
     When enabled, the site reads live data from your sheet instead of
     the local files, and falls back to the local files if anything fails. */
  sheet: {
    enabled: false,
    playersCsvUrl: "",
    matchesCsvUrl: ""
  }
};
