/* ===========================================================================
   DATSU — PLAYERS
   ---------------------------------------------------------------------------
   One line per player. Copy an existing line to add someone new.

   id          a short nickname with NO spaces. Used to record matches.
               Once the season starts, DO NOT change an id.
   name        their real name (Japanese characters are fine: 田中ユキ)
   dartslive   their DARTSLIVE card name
   country     country name, shown on the Players page
   flag        flag emoji (copy/paste from https://emojipedia.org/flags)
   group       "A" or "B"
   avatar      optional photo: "assets/img/players/yuki.jpg"
               leave as "" and the site draws a neon initials badge instead
   notes       accomplishments / honours, shown on the Players page
   active      true = currently in the league. Set to false when someone
               leaves instead of deleting their line — that keeps their
               name, flag and avatar attached to their career stats
               forever, it just drops them out of the groups, the current
               league table, the playoff bracket and player dropdowns.
               Leaving it off a line at all counts as true.
   =========================================================================== */

window.DATSU = window.DATSU || {};

DATSU.players = [
  /* ---------------------------- GROUP A ---------------------------------- */
  { id: "alex",   name: "Alex Fielding",  dartslive: "GAZZA",      country: "England",   flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "A", avatar: "", active: true, notes: ["2024 Autumn runner-up"] },
  { id: "yuki",   name: "田中ユキ",         dartslive: "YUKI★",      country: "Japan",     flag: "🇯🇵", group: "A", avatar: "", active: true, notes: ["2024 Autumn champion", "Highest Cricket Avg 2024"] },
  { id: "marco",  name: "Marco Rossi",    dartslive: "IL CAPO",    country: "Italy",     flag: "🇮🇹", group: "A", avatar: "", active: true, notes: [] },
  { id: "priya",  name: "Priya Nair",     dartslive: "P-NAIR",     country: "India",     flag: "🇮🇳", group: "A", avatar: "", active: true, notes: ["Most improved 2024"] },
  { id: "sam",    name: "Sam O'Connell",  dartslive: "SAMMY O",    country: "Ireland",   flag: "🇮🇪", group: "A", avatar: "", active: true, notes: [] },
  { id: "kenji",  name: "森ケンジ",         dartslive: "KENJI",      country: "Japan",     flag: "🇯🇵", group: "A", avatar: "", active: true, notes: ["2024 HUB Cup winner"] },
  { id: "brooke", name: "Brooke Wallace", dartslive: "BROOKIE",    country: "Australia", flag: "🇦🇺", group: "A", avatar: "", active: true, notes: [] },
  { id: "lucas",  name: "Lucas Silva",    dartslive: "LUKINHAS",   country: "Brazil",    flag: "🇧🇷", group: "A", avatar: "", active: true, notes: [] },
  { id: "mei",    name: "Mei Lin",        dartslive: "MEI",        country: "Taiwan",    flag: "🇹🇼", group: "A", avatar: "", active: true, notes: [] },
  { id: "tom",    name: "Tom Becker",     dartslive: "BECKS",      country: "Germany",   flag: "🇩🇪", group: "A", avatar: "", active: true, notes: [] },

  /* ---------------------------- GROUP B ---------------------------------- */
  { id: "hana",   name: "佐藤ハナ",         dartslive: "HANA",       country: "Japan",     flag: "🇯🇵", group: "B", avatar: "", active: true, notes: ["2024 Spring champion"] },
  { id: "dave",   name: "Dave Murphy",    dartslive: "MURPH",      country: "Ireland",   flag: "🇮🇪", group: "B", avatar: "", active: true, notes: ["Highest 01 Avg 2024"] },
  { id: "ana",    name: "Ana Torres",     dartslive: "TORRES",     country: "Spain",     flag: "🇪🇸", group: "B", avatar: "", active: true, notes: [] },
  { id: "ryo",    name: "中村リョウ",       dartslive: "RYO-BABA",   country: "Japan",     flag: "🇯🇵", group: "B", avatar: "", active: true, notes: [] },
  { id: "chloe",  name: "Chloé Dupont",   dartslive: "CHLO",       country: "France",    flag: "🇫🇷", group: "B", avatar: "", active: true, notes: [] },
  { id: "nate",   name: "Nate Johnson",   dartslive: "BIG NATE",   country: "USA",       flag: "🇺🇸", group: "B", avatar: "", active: true, notes: [] },
  { id: "sofia",  name: "Sofia Ivanova",  dartslive: "SOFI",       country: "Bulgaria",  flag: "🇧🇬", group: "B", avatar: "", active: true, notes: [] },
  { id: "daniel", name: "Daniel Kim",     dartslive: "DK",         country: "Korea",     flag: "🇰🇷", group: "B", avatar: "", active: true, notes: [] },
  { id: "emma",   name: "Emma Novak",     dartslive: "NOVA",       country: "Czechia",   flag: "🇨🇿", group: "B", avatar: "", active: true, notes: [] },
  { id: "taka",   name: "渡辺タカ",         dartslive: "TAKA88",     country: "Japan",     flag: "🇯🇵", group: "B", avatar: "", active: true, notes: ["Nice One Award 2024"] }
];
