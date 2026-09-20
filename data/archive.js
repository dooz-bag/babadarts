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
    id: "2024-autumn",
    type: "league",
    name: "2024 Autumn League",
    dates: "Sep – Dec 2024",
    venue: "HUB Takadanobaba",
    champion: "田中ユキ (YUKI★)",
    runnerUp: "Alex Fielding (GAZZA)",
    blurb:
      "Decided on the very last night. Yuki came back from 3-1 down in the final, " +
      "hit a 9-mark nobody believed, and the bar lost its mind. Gazza has not spoken about it since.",
    highlights: [
      { label: "Best 01 PPD (season)", value: "Dave Murphy — 25.84" },
      { label: "Best Cricket MPR (season)", value: "田中ユキ — 2.51" },
      { label: "Highest single 701 game", value: "Dave Murphy — 31.20" },
      { label: "Highest single cricket game", value: "田中ユキ — 3.14" },
      { label: "Nice One Award", value: "渡辺タカ (11 corks lost in a row)" }
    ],
    finalTable: [
      { pos: 1, player: "田中ユキ", group: "A", w: 8, l: 1, pts: 16, ppd: 23.9, mpr: 2.51 },
      { pos: 2, player: "Alex Fielding", group: "A", w: 7, l: 2, pts: 14, ppd: 24.6, mpr: 2.22 },
      { pos: 3, player: "Dave Murphy", group: "B", w: 7, l: 2, pts: 14, ppd: 25.8, mpr: 2.18 },
      { pos: 4, player: "森ケンジ", group: "A", w: 6, l: 3, pts: 12, ppd: 22.4, mpr: 2.34 },
      { pos: 5, player: "佐藤ハナ", group: "B", w: 6, l: 3, pts: 12, ppd: 21.7, mpr: 2.40 },
      { pos: 6, player: "Nate Johnson", group: "B", w: 5, l: 4, pts: 10, ppd: 22.1, mpr: 2.19 },
      { pos: 7, player: "Brooke Wallace", group: "A", w: 5, l: 4, pts: 10, ppd: 21.4, mpr: 2.26 },
      { pos: 8, player: "中村リョウ", group: "B", w: 4, l: 5, pts: 8, ppd: 19.8, mpr: 2.30 },
      { pos: 9, player: "Priya Nair", group: "A", w: 3, l: 6, pts: 6, ppd: 19.2, mpr: 1.96 },
      { pos: 10, player: "Emma Novak", group: "B", w: 2, l: 7, pts: 4, ppd: 19.6, mpr: 2.28 }
    ],
    results: [
      { round: "Round 1", text: "森ケンジ def. 中村リョウ 2-1 · 佐藤ハナ def. Brooke Wallace 2-0" },
      { round: "Quarter-finals", text: "田中ユキ def. Nate Johnson 2-0 · Alex Fielding def. 佐藤ハナ 2-1" },
      { round: "Semi-finals (Bo5)", text: "田中ユキ def. 森ケンジ 3-2 · Alex Fielding def. Dave Murphy 3-1" },
      { round: "FINAL (Bo7)", text: "田中ユキ def. Alex Fielding 4-3" }
    ],
    photos: [
      { src: "assets/img/archive/2024-autumn-final.jpg", caption: "The final. Note Gazza's face." },
      { src: "assets/img/archive/2024-autumn-trophy.jpg", caption: "Yuki with the trophy and a Kirin." },
      { src: "assets/img/archive/2024-autumn-crowd.jpg", caption: "Downstairs at the HUB, absolutely rammed." }
    ]
  },

  {
    id: "2024-hub-cup",
    type: "tournament",
    name: "2024 HUB Cup",
    dates: "17 August 2024",
    venue: "HUB Takadanobaba",
    champion: "森ケンジ & Chloé Dupont",
    runnerUp: "Marco Rossi & Sofia Ivanova",
    blurb:
      "Random-draw doubles, 24 players, one afternoon, an alarming bar tab. " +
      "Kenji and Chloé had never met before the draw and are now inseparable.",
    highlights: [
      { label: "Format", value: "Random draw doubles, group stage into knockout" },
      { label: "Highest game of the day", value: "Chloé Dupont — 3.40 MPR cricket" },
      { label: "Excellent Grouping, Mr Speaker", value: "Tom Becker — three in the 7" }
    ],
    finalTable: [],
    results: [
      { round: "Quarter-finals", text: "Kenji/Chloé def. Hana/Tom · Marco/Sofia def. Yuki/Emma" },
      { round: "Semi-finals", text: "Kenji/Chloé def. Alex/Mei 2-1 · Marco/Sofia def. Dave/Priya 2-0" },
      { round: "FINAL", text: "Kenji/Chloé def. Marco/Sofia 3-1" }
    ],
    photos: [
      { src: "assets/img/archive/2024-hub-cup-winners.jpg", caption: "Champions, and the bowling-pin trophy." },
      { src: "assets/img/archive/2024-hub-cup-draw.jpg", caption: "The draw. Chaos." }
    ]
  },

  {
    id: "2024-spring",
    type: "league",
    name: "2024 Spring League",
    dates: "Apr – Jun 2024",
    venue: "HUB Takadanobaba",
    champion: "佐藤ハナ (HANA)",
    runnerUp: "森ケンジ (KENJI)",
    blurb:
      "Hana's season. Unbeaten in the group stage, and she barely looked at the board all spring.",
    highlights: [
      { label: "Best 01 PPD (season)", value: "Alex Fielding — 24.10" },
      { label: "Best Cricket MPR (season)", value: "佐藤ハナ — 2.44" },
      { label: "Longest win streak", value: "佐藤ハナ — 11 matches" }
    ],
    finalTable: [
      { pos: 1, player: "佐藤ハナ", group: "B", w: 9, l: 0, pts: 18, ppd: 21.2, mpr: 2.44 },
      { pos: 2, player: "森ケンジ", group: "A", w: 7, l: 2, pts: 14, ppd: 21.9, mpr: 2.31 },
      { pos: 3, player: "Alex Fielding", group: "A", w: 7, l: 2, pts: 14, ppd: 24.1, mpr: 2.10 },
      { pos: 4, player: "Dave Murphy", group: "B", w: 6, l: 3, pts: 12, ppd: 24.0, mpr: 2.05 },
      { pos: 5, player: "田中ユキ", group: "A", w: 6, l: 3, pts: 12, ppd: 22.8, mpr: 2.38 },
      { pos: 6, player: "Ana Torres", group: "B", w: 4, l: 5, pts: 8, ppd: 19.5, mpr: 2.12 }
    ],
    results: [
      { round: "Semi-finals (Bo5)", text: "佐藤ハナ def. Alex Fielding 3-0 · 森ケンジ def. Dave Murphy 3-2" },
      { round: "FINAL (Bo7)", text: "佐藤ハナ def. 森ケンジ 4-2" }
    ],
    photos: [
      { src: "assets/img/archive/2024-spring-champ.jpg", caption: "Hana, undefeated." }
    ]
  }
];
