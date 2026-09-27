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
    blurb: "Running from March to May 2026. The first timer Brady goes undefeated in the group stage only to lose to the powerhouse Ken in the finals.",
    highlights: [],
    finalTable: [],
    results: [],
    photos: [
      { src: "spring-26-poster.JPG", caption: "The big match, two players remain." },
      { src: "spring-26-firstgame.JPG", caption: "Eagerly watching the first match of the season." },
      { src: "spring-26-group.JPG", caption: "A real group of athletes." },
      { src: "spring-26-daviddartinwall.JPG", caption: "Piercing a wall with a soft tip dart is an impressive feat." },
      { src: "spring-26-martin.JPG", caption: "He has the same look on Christmas morning." },
      { src: "spring-26-martinwrestle.JPG", caption: "Martin taking his losses lying down." },
      { src: "spring-26-waiting.JPG", caption: "Checking our watches, waiting for some matches." },
      { src: "spring-26-prechamp.JPG", caption: "Before the championship, the calm before the storm." },
      { src: "spring-26-groupchamp.JPG", caption: "Celebrating another successful season." },
      { src: "spring-26-postchamp.JPG", caption: "Ken rightfully earning his name on the trophy." }
    ]
  }
];
