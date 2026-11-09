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
| `league.html` | Full Group A and Group B tables with playoff cut-lines, plus the season awards |
| `playoffs.html` | Projected bracket while the league runs, the real bracket once it's finalized, or the tournament bracket |
| `stats.html` | Sortable table of every average, season leaders, single-game records, career averages across every league/tournament, and the roll of honour |
| `players.html` | The roster — names, DARTSLIVE cards, nationalities, honours |
| `archive.html` | Every past league and tournament |
| `season.html` | One reusable page that renders *any* archived season |
| `submit.html` | Optional phone-friendly form to log a result straight into the Google Sheet |
| `photos.html` | Optional phone-friendly form to send in a photo — uploads to Drive, waits for approval |
| `join.html` | How to join, where we are, how to reach us on LINE |
| `admin.html` | Once-a-season tools: review submitted photos, roll the season over into History, and finalize the bracket |

## Where the data lives

Everything you edit is in `data/`. Nothing else needs touching.

```
data/config.js            league name, venue, contact details, status, rules
data/players.js           the roster
data/matches.js           this season's match results
data/history.js           past results, so "Career averages" covers every season ever played
data/history-example.csv  template for bulk-adding old results (by hand or via a Google Sheet)
data/archive.js           past leagues and tournaments
data/playoffs.js          optional frozen playoff seeds (see admin.html)
data/photos.js            local photo list, used when the Photos tab isn't wired up
```

The league table, every average, the records and the playoff bracket are all
**calculated from the match results**. You enter a score once; the site works
out the rest.

The playoff bracket is worked out rather than drawn by hand: it picks the
smallest sensible bracket for however many players qualify, hands out the
right number of round-one byes to the top seeds, and interleaves the groups
so the opening round is A3 v B6, A4 v B5, B3 v A6, B4 v A5. Change
`playoffSpots` in `data/config.js` and the whole thing redraws.

Once the season is over, `admin.html` freezes those seeds into
`data/playoffs.js` and flips `status.phase` to `"playoffs"` — after which the
page shows the real bracket with real results instead of a projection.

## Two switches, not three phases

`data/config.js` has two independent settings, because a league season and a
one-day tournament are different things:

- `status.phase` — `"league"` while matches are being played, `"playoffs"`
  once the bracket is finalized.
- `status.tournamentMode` — `true` for the few days a one-day tournament runs.
  It's an overlay, so it works on top of either phase and never disturbs the
  league's own state.

## Season awards

The League Table page (and every archived season) shows superlatives worked out
from the results — Unlucky, Dominance, Heartbreak, Clutch, Bottler, Metronome,
Rollercoaster, Most Improved, Fader, Giant Killer and Specialist. Nothing to
fill in, and any of them can be switched off with `awards.hiddenAwards`; see
[docs/UPDATING.md](docs/UPDATING.md#4a-season-awards).

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

On top of that, [docs/APPS-SCRIPT.md](docs/APPS-SCRIPT.md) has the Google Apps
Script that powers the two phone forms — `submit.html` for results and
`photos.html` for photos — both writing into that sheet. One deployment
handles both. Also entirely optional, and built on whatever the Google Sheet
guide already set up.

- [docs/SUBMIT-RESULTS.md](docs/SUBMIT-RESULTS.md) — how the result form behaves
- [docs/PHOTOS.md](docs/PHOTOS.md) — the Photos tab, Drive folder and moderation

## Project structure

```
├─ *.html              the pages (header/footer are injected by JS)
├─ data/               ⭐ the only files you edit
├─ assets/
│  ├─ css/styles.css   all styling; colours are at the very top
│  ├─ js/core.js       standings, averages, records, awards, playoff maths
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
