# Optional: run the league from a Google Sheet

By default the site reads `data/players.js` and `data/matches.js`. That's the
simplest setup and it works offline.

If you'd rather type results into a **Google Sheet on your phone at the bar**,
this page shows you how. It takes about 15 minutes, once.

**It is genuinely optional.** Everything works without it.

> Safety net: if the sheet is ever unreachable, mistyped, or you lose signal,
> the website silently falls back to the local data files. It will never show a
> blank page because of a sheet problem.

---

## Step 1 — Create the sheet

Make a new Google Sheet with **two tabs**, named exactly `Players` and `Matches`.

### The `Players` tab

Row 1 must be these headings, in this order:

| id | name | dartslive | country | flag | group | avatar | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| yuki | 田中ユキ | YUKI★ | Japan | 🇯🇵 | A | | 2024 Autumn champion |
| alex | Alex Fielding | GAZZA | England | 🏴󠁧󠁢󠁥󠁮󠁧󠁿 | A | | |

- `id` — short, lowercase, no spaces. Never change it mid-season.
- `avatar` — leave blank unless you've added a photo file.
- `notes` — separate multiple honours with a vertical bar: `Champion 2024|Best MPR`

### The `Matches` tab

Row 1 must be these headings, in this order:

| date | group | playerA | playerB | g1game | g1winner | g1a | g1b | g2game | g2winner | g2a | g2b | g3game | g3winner | g3a | g3b |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2025-04-29 | A | alex | yuki | 701 | alex | 24.2 | 21.8 | cricket | yuki | 2.05 | 2.41 | 701 | yuki | 22 | 23.6 |
| 2025-04-29 | A | marco | priya | 701 | marco | 20.1 | 18.4 | cricket | marco | 2.3 | 1.88 | | | | |

- `g1game` / `g2game` / `g3game` — either `701` or `cricket`
- `g1winner` etc. — the player **id** of whoever won that leg
- `g1a` is always **playerA's** number, `g1b` is always **playerB's**
- For a 2–0, leave all four `g3` columns **empty**
- Format the date column as plain text so Google doesn't reformat it

> Tip: set the date column to *Format → Number → Plain text* first, otherwise
> Google may turn `2025-04-29` into `29/04/2025` and the site won't read it.

## Step 2 — Publish each tab as CSV

1. **File → Share → Publish to web**
2. In the first dropdown pick the **`Players`** tab (not "Entire document")
3. In the second dropdown pick **Comma-separated values (.csv)**
4. Click **Publish**, then copy the link it gives you
5. Repeat for the **`Matches`** tab

You'll end up with two links that look roughly like:

```
https://docs.google.com/spreadsheets/d/e/2PACX-1vT.../pub?gid=0&single=true&output=csv
```

## Step 3 — Paste them into the site

Open `data/config.js` and edit the `sheet` block at the bottom:

```js
sheet: {
  enabled: true,
  playersCsvUrl: "PASTE_THE_PLAYERS_LINK_HERE",
  matchesCsvUrl: "PASTE_THE_MATCHES_LINK_HERE"
}
```

Save, refresh the site. That's it — the league now runs off your sheet.

## How to tell which one it's using

Right-click the page → *Inspect* → *Console* tab, and type:

```
DATSU.dataSource
```

- `"sheet"` — reading live from Google
- `"local"` — reading the data files (sheet is turned off)
- `"local-fallback"` — the sheet failed, so it used the files instead. The
  console will also show a warning explaining why.

## Things worth knowing

- **Google caches published sheets for a few minutes.** Your edit may take up to
  ~5 minutes to show up. This is Google's doing, not the website's.
- **The sheet must stay published.** Un-publishing it puts the site back onto
  the local files.
- **Anyone with the link can read the published CSV**, so don't put anything
  private in the sheet. Nobody can *edit* it without being invited.
- **Opening the site as a file won't work with the sheet.** Browsers block
  fetching remote data from `file://` pages. Use Live Server locally, or just
  test it on the published website.
- **Keep the local files roughly up to date anyway.** They're your backup if
  Google ever has a bad day.
