# Datsu — Takadanobaba Darts League

A website for our soft-tip DARTSLIVE league at HUB Takadanobaba, Tokyo.
Currently 20 players in two groups of 10, best-of-3 matches (701 → Cricket →
cork winner's choice), top 6 in each group into the playoffs — but none of those
numbers are baked in. Add players, drop players, add a Group C or change how
many qualify, and the tables, cut-lines and playoff bracket all resize
themselves.

No frameworks, no build step, no database. Plain HTML, CSS and JavaScript, so it
runs anywhere and will still work in ten years.

## ⭐ If you only read one thing

**[docs/UPDATING.md](docs/UPDATING.md)** — how to add a result after you play.
It's written for someone who has never opened a code file before.

## Pages

| Page | What's on it |
| --- | --- |
| `index.html` | Current league status, latest results, the race, top performers |
| `league.html` | Full Group A and Group B tables with playoff cut-lines |
| `playoffs.html` | Live projected bracket + who's safe and who's sweating |
| `stats.html` | Sortable table of every average, season leaders, single-game records, career averages across every league/tournament, and the roll of honour |
| `players.html` | The roster — names, DARTSLIVE cards, nationalities, honours |
| `archive.html` | Every past league and tournament |
| `season.html` | One reusable page that renders *any* archived season |
| `submit.html` | Optional phone-friendly form to log a result straight into the Google Sheet |
| `join.html` | How to join, where we are, how to reach us on LINE |

## Where the data lives

Everything you edit is in `data/`. Nothing else needs touching.

```
data/config.js            league name, venue, contact details, current status, rules
data/players.js           the roster
data/matches.js           this season's match results
data/history.js           past results, so "Career averages" covers every season ever played
data/history-example.csv  template for bulk-adding old results (by hand or via a Google Sheet)
data/archive.js           past leagues and tournaments
```

The league table, every average, the records and the playoff bracket are all
**calculated from the match results**. You enter a score once; the site works
out the rest.

The playoff bracket is worked out rather than drawn by hand: it picks the
smallest sensible bracket for however many players qualify, hands out the
right number of round-one byes to the top seeds, and interleaves the groups
so the opening round is A3 v B6, A4 v B5, B3 v A6, B4 v A5. Change
`playoffSpots` in `data/config.js` and the whole thing redraws.

## Run locally

Double-clicking `index.html` mostly works, but archive pages behave better
through a local server:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000>. Or use the VS Code **Live Server**
extension: right-click `index.html` → *Open with Live Server*.

## Publishing

This is a static site living in a git repo, so the easiest setup is connecting
that repo to a host so every `git push` deploys itself — **GitHub Pages** or
**Cloudflare Pages** both work with zero build configuration. Netlify Drop also
works if you'd rather not use git at all.
See [docs/UPDATING.md](docs/UPDATING.md#publishing) for step-by-step instructions.

## Optional: run it from a Google Sheet

If you'd rather type results into a phone at the bar, you can point the site at
a published Google Sheet instead of the data files — with an automatic fallback
to the local files if the sheet is ever unavailable.
See [docs/GOOGLE-SHEET.md](docs/GOOGLE-SHEET.md). Entirely optional.

On top of that, [docs/SUBMIT-RESULTS.md](docs/SUBMIT-RESULTS.md) wires up
`submit.html` — a form so anyone with a shared passcode can log a result
straight into that sheet from their phone, no editing files at all. Also
entirely optional, and built on whatever the Google Sheet guide already set up.

## Project structure

```
├─ *.html              the pages (header/footer are injected by JS)
├─ data/               ⭐ the only files you edit
├─ assets/
│  ├─ css/styles.css   all styling; colours are at the very top
│  ├─ js/core.js       standings, averages, records, playoff maths
│  ├─ js/pages.js      builds the contents of each page
│  ├─ js/app.js        header, menu, footer, start-up
│  └─ img/             hub/, archive/, players/  (each has a README)
└─ docs/               the guides
```

Missing photos never break the layout — you get a placeholder printing the
exact filename it's looking for.

## Changing the colours

Top of `assets/css/styles.css`, in the `:root` block. Change `--accent`,
`--accent-cool`, `--accent-warm`, `--accent-good`, `--accent-gold`,
`--accent-plum`, the `--ink`/`--panel` surfaces and so on, and the whole site
re-skins itself.
