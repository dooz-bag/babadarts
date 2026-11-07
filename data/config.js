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
     Two independent switches, because a league season and a one-day
     tournament are different things:

       phase           "league"   = matches are still being played
                       "playoffs" = the bracket is finalized, show the
                                    real bracket instead of a projection

       tournamentMode  true = the site is showing a one-day tournament
                       (World Cup, Doubles, whatever). Flip it on for the
                       few days it runs, then flip it back. It works on top
                       of either phase, so running a tournament mid-league
                       never disturbs the league's own state.

       seasonName      whatever you want this season called
       seasonId        the archive id this season's results get tagged with
                       when they're moved into the History tab. Leave blank
                       and it's guessed from seasonName ("Fall 2026 League"
                       -> "2026-fall").                              */
  status: {
    running: true,
    seasonName: "Fall 2026 League",
    seasonId: "2026-fall",

    phase: "league",          // "league" | "playoffs"
    tournamentMode: false,    // true = show the tournament instead

    /* Old name for phase === "playoffs". Still honoured if it's the only
       one set, so an existing config keeps working. */
    playoffsStarted: false
  },

  /* ---- THE TOURNAMENT (only used when status.tournamentMode is true) ---
     archiveId must match an entry in data/archive.js, so the results land
     on the right archive page and count toward career stats. The admin
     page can create that entry for you.

     submitResults  true  = the Submit Result page offers a "Tournament
                            match" option while tournamentMode is on
                    false = no tournament option at all. Use this if you
                            aren't sure the site will be used on the day and
                            would rather type the results in afterwards.  */
  tournament: {
    name: "World Cup of Darts 2026",
    dates: "7 Nov 2026",
    format: "Single elimination · best of 5",
    archiveId: "2026-world-cup",
    entrants: [],             // blank = every active player
    submitResults: false
  },

  /* ---- SEASON AWARDS --------------------------------------------------
     minGames stops a two-match cameo winning "most consistent".          */
  awards: {
    minGames: 4
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
      "Head-to-head decider match"
    ],
    playoffFormats: {
      round1: "Best of 5",
      quarterFinal: "Best of 5",
      semiFinal: "Best of 5",
      final: "Best of 7"
    }
  },

  /* ---- Inside jokes (rotate in the footer) ---------------------------- */
  /* ---- Forfeited players (leave empty [] when nobody is forfeited) ----
     Any player in this list automatically gets an 0-2 loss for all past
     and future regular season matches, while keeping their 01/cricket stats. */
  forfeitedPlayers: ["will"],

  /* ---- Withdrawn players (leave empty [] if none) --------------------
     Players who withdrew mid-season without forfeits. Unplayed matches
     are cancelled with no artificial wins/losses given to anyone. Past
     played stats are preserved, and active players' remaining matches and
     playoff qualification math automatically adjust to their playable schedule. */
  withdrawnPlayers: ["david"],

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
    submitUrl: "https://script.google.com/macros/s/AKfycbzJSFdt1xyYcXBLhe-2tjqFTb0BZKbgyd-YhlRN56wc6ictP6-FLxSC1KGPPHUohIUz5A/exec",
    /* Optional: Cloudflare Worker URL to auto-read DARTSLIVE screens via OpenRouter */
    scanUrl: "https://datsu-scan-screen.bradybyersku.workers.dev"
  }
};
