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
  tagline: "A bunch of bullseyes and a very loud bar.",

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
    name: "HUB (East) Takadanobaba",
    nameJa: "HUB 高田馬場駅東口店",
    address: "Takadanobaba, Shinjuku-ku, Tokyo",
    mapsUrl: "https://maps.google.com/?q=HUB+Takadanobaba+East"
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
    pointsForWin: 1,
    pointsForWin21: 1,
    pointsForLoss: 0,
    matchFormat: "Best of 3 legs",
    game1: "701",
    game2: "Cricket",
    game3: "Choice based on cork",

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
      "Match wins",
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
    "That's a lovely 26."
  ],

  /* ---- GOOGLE SHEET (optional — see docs/GOOGLE-SHEET.md) -------------
     Leave enabled: false until you've followed that guide.
     When enabled, the site reads live data from your sheet instead of
     the local files, and falls back to the local files if anything fails.

     historyCsvUrl works independently of `enabled` above — it's just the
     optional "History" tab that feeds Career averages, so you can point it
     at a sheet even if this season's Players/Matches stay in the local
     files. Leave it blank to use data/history.js instead. See
     docs/GOOGLE-SHEET.md and data/history-example.csv.                   */
  sheet: {
    enabled: true,
    playersCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSu7dSprVlU6AXu5wn8Z21JHGwgfxmGWN7ZIOUFc5AvTGUUfXmV1L_4gyPZWxaEV2CAX0pIP2TvtRob/pub?gid=0&single=true&output=csv",
    matchesCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSu7dSprVlU6AXu5wn8Z21JHGwgfxmGWN7ZIOUFc5AvTGUUfXmV1L_4gyPZWxaEV2CAX0pIP2TvtRob/pub?gid=958369008&single=true&output=csv",
    historyCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSu7dSprVlU6AXu5wn8Z21JHGwgfxmGWN7ZIOUFc5AvTGUUfXmV1L_4gyPZWxaEV2CAX0pIP2TvtRob/pub?gid=1630828027&single=true&output=csv"
  },

  /* ---- SUBMIT A RESULT (optional — see docs/SUBMIT-RESULTS.md) --------
     Lets anyone with the passcode log a result from their phone at the
     bar (submit.html) instead of editing data/matches.js by hand. It
     posts straight into the Google Sheet above, so it only makes sense
     once that's set up.

     submitUrl   the Google Apps Script "Web app" URL from that guide.
                 Leave it blank and the Submit Result page just explains
                 how to set it up instead of showing the form — nothing
                 else on the site depends on this.

     The actual passcode is set INSIDE the Apps Script, not here — this
     file is public source code, so anything typed in it can be read by
     anyone who views the page source.                                   */
  resultsForm: {
    submitUrl: "https://script.google.com/macros/s/AKfycbzJSFdt1xyYcXBLhe-2tjqFTb0BZKbgyd-YhlRN56wc6ictP6-FLxSC1KGPPHUohIUz5A/exec"
  }
};
