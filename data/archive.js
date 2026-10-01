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
    id: "2024-winter",
    type: "league",
    name: "2024 Winter League",
    dates: "Winter 2024",
    venue: "HUB高田馬場店",
    champion: "David",
    runnerUp: "",
    playoffSpots: 4,
    byesPerGroup: 0,
    blurb: "",
    highlights: [],
    finalTable: [],
    results: [],
    photos: []
  },
  {
    id: "2025-spring",
    type: "league",
    name: "2025 Spring League",
    dates: "Spring 2025",
    venue: "HUB高田馬場店",
    champion: "Martin",
    runnerUp: "",
    playoffSpots: 4,
    byesPerGroup: 0,
    blurb: "",
    highlights: [],
    finalTable: [],
    results: [],
    photos: []
  },
  {
    id: "2025-summer",
    type: "league",
    name: "2025 Summer League",
    dates: "Summer 2025",
    venue: "HUB高田馬場店",
    champion: "Martin",
    runnerUp: "",
    playoffSpots: 4,
    byesPerGroup: 0,
    blurb: "",
    highlights: [],
    finalTable: [],
    results: [],
    photos: []
  },
  {
    id: "2025-winter",
    type: "league",
    name: "2025 Winter League",
    dates: "Winter 2025",
    venue: "HUB高田馬場店",
    champion: "Liam",
    runnerUp: "",
    playoffSpots: 4,
    byesPerGroup: 0,
    blurb: "",
    highlights: [],
    finalTable: [],
    results: [],
    photos: []
  },
  {
    id: "2026-spring",
    type: "league",
    name: "2026 Spring League",
    dates: "Spring 2026",
    venue: "HUB高田馬場店",
    champion: "Ken",
    runnerUp: "",
    playoffSpots: 4,
    byesPerGroup: 0,
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
  },
  {
    id: "2026-doubles",
    type: "tournament",
    name: "2026 Doubles Tournament",
    dates: "2026",
    venue: "HUB高田馬場店",
    champion: "Brady & Martin",
    runnerUp: "",
    playoffSpots: 0,
    byesPerGroup: 0,
    blurb: "A one-day doubles knockout — everybody's favourite excuse to blame a teammate.",
    highlights: [],
    finalTable: [],
    results: [],
    photos: []
  },
  {
    id: "2026-world-cup",
    type: "tournament",
    name: "World Cup of Darts 2026",
    dates: "2026",
    venue: "HUB高田馬場店",
    champion: "Martin",
    runnerUp: "",
    playoffSpots: 0,
    byesPerGroup: 0,
    blurb: "A one-day knockout, open to all.",
    highlights: [],
    finalTable: [],
    results: [],
    photos: []
  }
];
