# Optional: let people submit results from their phone

`submit.html` is a form — pick the two players, fill in the legs, type a
shared passcode, hit submit — that writes straight into the `Matches` (or
`History`) tab of your Google Sheet. No laptop, no editing `data/matches.js`,
just a phone at the bar.

**It is genuinely optional.** Until it's set up, the page just explains that,
politely, and nothing else on the site is affected.

> **The script itself now lives in [APPS-SCRIPT.md](APPS-SCRIPT.md).** That
> page has the complete, current version — results, photos and season
> rollover in one deployment. This page covers how the result form behaves
> and what the script does with a result; the setup steps are there.

It takes about 15 minutes, once, and needs three things you should already
have if you've read [docs/GOOGLE-SHEET.md](GOOGLE-SHEET.md):

- A Google Sheet with a `Matches` tab (and a `History` tab if you want to log
  old results too), in the sixteen-column shape described in that guide.
- That sheet published to the web as CSV, with the links pasted into
  `data/config.js` → `sheet.matchesCsvUrl` (and `historyCsvUrl`) — so results
  submitted through the form actually show up on the site. The form still
  saves to the sheet even if you skip this bit, it just won't be visible
  anywhere until you point the site at it.

If you haven't done that yet, do it first — this form is just a friendlier
front door onto the same sheet.

---

## Step 1 — Add the script to your sheet

The complete script lives in **[APPS-SCRIPT.md](APPS-SCRIPT.md)** — one
deployment handles results, photos and season rollover. Follow the setup
steps there, then come back here for how the result form behaves.

This script can do three things, all gated on the passcode:

| `action` | What it does |
| --- | --- |
| *(none)* / `result` | Appends one match to `Matches` or `History`, in the right column shape for that tab |
| `preview` | Validates a rollover and reports what it *would* write. Writes nothing |
| `rollover` | Appends every row to `History` tagged with the competition id, then clears `Matches` |

It can't read, edit or delete anything else in the sheet.

> **If you set this up before the rollover feature existed**, re-paste the
> script from [APPS-SCRIPT.md](APPS-SCRIPT.md) and redeploy (see
> *Redeploying* below). The old version always wrote a 16-column row, which
> misaligns the 34-column `History` tab — so "log an older match" was quietly
> writing broken rows.

## Step 2 — Publish it as a web app

1. Top right of the Apps Script editor: **Deploy → New deployment.**
2. Next to "Select type", click the gear icon and choose **Web app**.
3. Fill in:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**.
5. Google will ask you to **authorize access** — click through it (it's your
   own script talking to your own sheet, so this is expected). You may see an
   "unverified app" warning; click **Advanced → Go to (your project) (unsafe)**.
   This is normal for a personal script that hasn't been submitted to Google
   for review — nobody but you can run it as you.
6. Copy the **Web app URL** it gives you. It looks like:

```
https://script.google.com/macros/s/AKfycb.../exec
```

## Step 3 — Paste it into the site

Open `data/config.js` and fill in the `resultsForm` block near the bottom:

```js
resultsForm: {
  submitUrl: "PASTE_THE_WEB_APP_URL_HERE"
}
```

Save, refresh `submit.html`. The form should appear. Try a test submission —
you'll see the new row land at the bottom of the `Matches` tab within a few
seconds. Delete the test row once you're happy it works.

Tell whoever plays in the league the passcode you set in Step 1. It's not
written down anywhere on the site itself.

## Redeploying after you change the script later

If you ever come back and edit the Apps Script (say, to change the passcode),
editing the code alone **does not** update the live URL — "Anyone" deployments
are pinned to whichever version was live when you deployed. To push an edit
live:

**Deploy → Manage deployments → the pencil (edit) icon → Version: "New
version" → Deploy.**

The URL stays exactly the same, so nothing needs re-pasting into `config.js`.

## Things worth knowing

- **This is obscurity, not real security.** Anyone who has the passcode (or
  guesses it) can add a result. That's fine for a friendly bar league — don't
  use this pattern for anything that actually needs protecting, and change
  the passcode occasionally if it feels like it's leaked further than
  intended.
- **Google also caches published sheets for a few minutes** (see
  docs/GOOGLE-SHEET.md), so a result that saved successfully may take a
  little while to actually appear on the site. That's Google's doing, not a
  bug in the form.
- **The script only appends rows.** It can't be used to edit or delete an
  existing result — do that the normal way, directly in the sheet. The one
  exception is `rollover`, which clears the `Matches` tab *after* it has
  successfully written every row to `History`.
- **Nothing about the rest of the site depends on this.** If you never touch
  any of the above, `submit.html` just shows a card explaining how to set it
  up, and everyone keeps adding results the way described in
  [docs/UPDATING.md](UPDATING.md) or [docs/GOOGLE-SHEET.md](GOOGLE-SHEET.md).

## Playoff and tournament results

The same form logs knockout matches. Pick **Playoff match** or **Tournament
match** at the top instead of **League match**, and a round selector appears.

Those rows go to the `History` tab with two extra columns filled in:

- `competition` — the season id (`2026-fall`) for a playoff match, or the
  tournament's `archiveId` (`2026-world-cup`) for a tournament match
- `round` — `R1`, `R16`, `QF`, `SF` or `F`

Because they're tagged, they never count toward the league table, and they
render on the right archive page automatically. See
[docs/GOOGLE-SHEET.md](GOOGLE-SHEET.md#optional-a-third-tab-history-for-career-averages)
for the accepted `round` values.

## Rolling a season over

Once the season is done, `admin.html` moves every row from `Matches` into
`History` in one go, tagged with the season id — no hand-editing seventy rows.

1. Open `admin.html` (it isn't in the menu; go to `/admin.html` directly).
2. Check the review table. Anything wrong is flagged in the **Check** column.
3. Hit **Normalize rows** to apply the safe fixes (trim ids, uppercase groups,
   ISO dates, drop empty legs).
4. Hit **Preview** — this asks the script what it *would* do and writes nothing.
5. Type the competition id in the confirm box, then **Commit rollover**.
6. Paste the generated `data/archive.js` entry and the reset `data/matches.js`
   into those files.

The script appends to `History` first and only clears `Matches` if that
succeeded, so a failure can never lose the season.

