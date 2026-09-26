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

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (String(body.passcode || "") !== PASSCODE) {
      return respond({ ok: false, error: "Wrong passcode." });
    }
    if (!body.date || !body.a || !body.b || !body.legs || !body.legs.length) {
      return respond({ ok: false, error: "Missing some required fields." });
    }

    var sheetName = SHEET_NAMES[body.target] || SHEET_NAMES.matches;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      return respond({ ok: false, error: "Can't find a \"" + sheetName + "\" tab in this sheet." });
    }

    // date, group, playerA, playerB, then 3 legs of (game, winner, a, b)
    var legs = body.legs.slice(0, 3);
    var row = [body.date, body.group || "", body.a, body.b];
    for (var i = 0; i < 3; i++) {
      var leg = legs[i];
      row.push(leg ? leg.game : "", leg ? leg.winner : "", leg ? leg.aStat : "", leg ? leg.bStat : "");
    }

    sheet.appendRow(row);
    return respond({ ok: true });
  } catch (err) {
    return respond({ ok: false, error: "Server error: " + err.message });
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Change the `PASSCODE` value on the first line to whatever you want your
   passcode to be, then **save** (the disk icon, or `Ctrl+S`).

This script only knows how to do one thing — append a row to `Matches` or
`History` if the passcode matches. It can't read, edit or delete anything
else in the sheet.

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
  existing result — do that the normal way, directly in the sheet.
- **Nothing about the rest of the site depends on this.** If you never touch
  any of the above, `submit.html` just shows a card explaining how to set it
  up, and everyone keeps adding results the way described in
  [docs/UPDATING.md](UPDATING.md) or [docs/GOOGLE-SHEET.md](GOOGLE-SHEET.md).
