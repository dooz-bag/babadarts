/* ===========================================================================
   DATSU — THE ARCHIVE (past leagues & tournaments)
   ---------------------------------------------------------------------------
   Every entry here automatically gets:
     - a card on the Archive page
     - its own page  (season.html?s=THE-ID)
     - a link in the "Archive" dropdown in the menu

   id        short, no spaces, lowercase. This becomes the web address.
   type      "league" or "tournament"
   photos    put image files in  assets/img/archive/  and list them here.
             If a photo file is missing you'll see a friendly placeholder
             telling you exactly which file to drop in — nothing breaks.
   =========================================================================== */

window.DATSU = window.DATSU || {};

DATSU.archive = [
  {
    id: "2026-spring",
    type: "league",
    name: "2026 Spring League",
    dates: "Spring 2026",
    venue: "HUB高田馬場店",
    champion: "",
    runnerUp: "",
    blurb: "Running from March to May 2026. The first timer Brady goes undefeated in the group stage only to lose to the powerhouse of Ken in the finals.",
    highlights: [],
    finalTable: [],
    results: [],
    photos: []
  }
];
