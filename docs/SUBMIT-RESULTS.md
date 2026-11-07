# Optional: let people submit results from their phone

`submit.html` is a form — pick the two players, fill in the legs, type a
shared passcode, hit submit — that writes straight into the `Matches` (or
`History`) tab of your Google Sheet. No laptop, no editing `data/matches.js`,
just a phone at the bar.

**It is genuinely optional.** Until it's set up, the page just explains that,
politely, and nothing else on the site is affected.

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

## Step 1 — Add a script to your sheet

1. Open your Google Sheet.
2. **Extensions → Apps Script.**
3. Delete whatever's in the editor (usually an empty `function myFunction() {}`)
   and paste this in its place:

```js
// The passcode players type into the form. Change this to something of
// your own — it's the only thing stopping a random stranger from adding
// nonsense rows, so don't leave it as "changeme".
var PASSCODE = "changeme";

var SHEET_NAMES = { matches: "Matches", history: "History" };

// The most legs a single match can ever have. A best-of-7 is first to 4, so
// seven is the ceiling — there is no leg 8. Raise this only if you also widen
// the History tab to match.
var MAX_LEGS = 7;

// The Matches tab is 16 columns (best of 3); the History tab is 34 (best of
// 7, so a best-of-7 playoff final fits). Writing a 16-column row into History
// silently misaligns every column after `playerB`, so the two shapes are
// built separately and never mixed up.
var MATCHES_HEADER = ["date", "group", "playerA", "playerB",
  "g1game", "g1winner", "g1a", "g1b",
  "g2game", "g2winner", "g2a", "g2b",
  "g3game", "g3winner", "g3a", "g3b"];

// A best-of-7 is first to 4, so seven legs is the most a match can ever run.
// There is no leg 8.
var HISTORY_HEADER = ["competition", "date", "group", "playerA", "playerB",
  "g1game", "g1winner", "g1a", "g1b",
  "g2game", "g2winner", "g2a", "g2b",
  "g3game", "g3winner", "g3a", "g3b",
  "g4game", "g4winner", "g4a", "g4b",
  "g5game", "g5winner", "g5a", "g5b",
  "g6game", "g6winner", "g6a", "g6b",
  "g7game", "g7winner", "g7a", "g7b",
  "round"];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (String(body.passcode || "") !== PASSCODE) {
      return respond({ ok: false, error: "Wrong passcode." });
    }

    var action = String(body.action || "result");

    if (action === "preview") return previewRollover(body);
    if (action === "rollover") return commitRollover(body);

    return appendResult(body);
  } catch (err) {
    return respond({ ok: false, error: "Server error: " + err.message });
  }
}

/* ---------------------------------------------------------- one result --- */

function appendResult(body) {
  if (!body.date || !body.a || !body.b || !body.legs || !body.legs.length) {
    return respond({ ok: false, error: "Missing some required fields." });
  }

  if (body.legs.length > MAX_LEGS) {
    return respond({
      ok: false,
      error: "That result has " + body.legs.length + " legs, but a match can only have " +
        MAX_LEGS + ". Check the form and try again."
    });
  }

  var isHistory = body.target === "history";
  var sheetName = isHistory ? SHEET_NAMES.history : SHEET_NAMES.matches;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    return respond({ ok: false, error: "Can't find a \"" + sheetName + "\" tab in this sheet." });
  }

  var values = isHistory
    ? historyValues(body.competition || "", body.date, body.group, body.a, body.b, body.legs, body.round)
    : matchesValues(body.date, body.group, body.a, body.b, body.legs);

  var row = rowForSheet(sheet, values, isHistory ? HISTORY_HEADER : MATCHES_HEADER);
  if (row.error) return respond({ ok: false, error: row.error });

  sheet.appendRow(row.values);
  return respond({ ok: true });
}

function matchesValues(date, group, a, b, legs) {
  var v = { date: date, group: group || "", playera: a, playerb: b };
  for (var i = 0; i < 3; i++) {
    var leg = legs[i], n = i + 1;
    v["g" + n + "game"] = leg ? leg.game : "";
    v["g" + n + "winner"] = leg ? leg.winner : "";
    v["g" + n + "a"] = leg ? leg.aStat : "";
    v["g" + n + "b"] = leg ? leg.bStat : "";
  }
  return v;
}

function historyValues(competition, date, group, a, b, legs, round) {
  var v = {
    competition: competition, date: date, group: group || "",
    playera: a, playerb: b, round: round || ""
  };
  for (var i = 0; i < MAX_LEGS; i++) {
    var leg = legs[i], n = i + 1;
    v["g" + n + "game"] = leg ? leg.game : "";
    v["g" + n + "winner"] = leg ? leg.winner : "";
    v["g" + n + "a"] = leg ? leg.aStat : "";
    v["g" + n + "b"] = leg ? leg.bStat : "";
  }
  return v;
}

/* Builds the row in whatever order the sheet's own header row uses, so
   adding or moving columns can never silently misalign a result. If the
   sheet is too narrow to hold every leg, it says so rather than dropping
   the extra legs on the floor. */
function rowForSheet(sheet, values, fallbackHeader) {
  var width = sheet.getLastColumn();
  var header;

  if (!width) {
    header = fallbackHeader;
  } else {
    header = sheet.getRange(1, 1, 1, width).getValues()[0].map(function (h) {
      return String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    });
  }

  var missing = [];
  Object.keys(values).forEach(function (k) {
    if (values[k] !== "" && header.indexOf(k) === -1) missing.push(k);
  });
  if (missing.length) {
    return {
      error: "The " + sheet.getName() + " tab is missing the column(s) " +
        missing.join(", ") + ". Add them to the header row and try again."
    };
  }

  return {
    values: header.map(function (h) {
      return values[h] === undefined ? "" : values[h];
    })
  };
}

/* ------------------------------------------------------ season rollover --- */

/* Dry run. Validates every row and reports what would happen, without
   writing anything. The admin page calls this before letting you commit. */
function previewRollover(body) {
  var rows = body.rows || [];
  if (!rows.length) return respond({ ok: false, error: "No rows to roll over." });
  if (!body.competition) return respond({ ok: false, error: "No competition id given." });

  var problems = [];
  rows.forEach(function (r, i) {
    if (!r.date || !r.a || !r.b) problems.push("Row " + (i + 1) + ": missing date or player.");
    if (!r.legs || !r.legs.length) problems.push("Row " + (i + 1) + ": no legs.");
  });
  if (problems.length) {
    return respond({ ok: false, error: problems.slice(0, 5).join(" ") });
  }

  return respond({ ok: true, wouldWrite: rows.length, competition: body.competition });
}

/* The real thing: append every row to History, then clear Matches. The
   clear only happens if the append succeeded, so a failure can never lose
   the season. */
function commitRollover(body) {
  var rows = body.rows || [];
  var competition = body.competition;
  if (!rows.length) return respond({ ok: false, error: "No rows to roll over." });
  if (!competition) return respond({ ok: false, error: "No competition id given." });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var history = ss.getSheetByName(SHEET_NAMES.history);
  var matches = ss.getSheetByName(SHEET_NAMES.matches);
  if (!history) return respond({ ok: false, error: "Can't find the History tab." });
  if (!matches) return respond({ ok: false, error: "Can't find the Matches tab." });

  // Make sure the History tab has a header before appending to it.
  if (history.getLastRow() === 0) {
    history.appendRow(HISTORY_HEADER);
  }

  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var built = rowForSheet(
      history,
      historyValues(competition, r.date, r.group, r.a, r.b, r.legs || [], r.round),
      HISTORY_HEADER
    );
    if (built.error) {
      return respond({ ok: false, error: "Row " + (i + 1) + ": " + built.error + " Nothing was cleared." });
    }
    out.push(built.values);
  }

  try {
    history.getRange(history.getLastRow() + 1, 1, out.length, out[0].length)
      .setValues(out);
  } catch (err) {
    return respond({ ok: false, error: "Couldn't write to History, so nothing was cleared: " + err.message });
  }

  // Only now is it safe to empty the Matches tab. Keep the header row.
  var last = matches.getLastRow();
  if (last > 1) {
    matches.getRange(2, 1, last - 1, matches.getLastColumn()).clearContent();
  }

  return respond({ ok: true, written: out.length });
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Change the `PASSCODE` value on the first line to whatever you want your
   passcode to be, then **save** (the disk icon, or `Ctrl+S`).

This script can do three things, all gated on the passcode:

| `action` | What it does |
| --- | --- |
| *(none)* / `result` | Appends one match to `Matches` or `History`, in the right column shape for that tab |
| `preview` | Validates a rollover and reports what it *would* write. Writes nothing |
| `rollover` | Appends every row to `History` tagged with the competition id, then clears `Matches` |

It can't read, edit or delete anything else in the sheet.

> **If you set this up before the rollover feature existed**, re-paste the
> script above and redeploy (see *Redeploying* below). The old version always
> wrote a 16-column row, which misaligns the 26-column `History` tab — so
> "log an older match" was quietly writing broken rows.

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

