# The Google Apps Script (results + photos)

This is the **complete** script for the sheet. One deployment handles both the
result form and the photo form — you don't need two.

If you've never set this up, read this page top to bottom. If you already have
an older version deployed, jump to [Upgrading](#upgrading-an-existing-script).

---

## What it can do

| `action` | What it does |
| --- | --- |
| *(none)* / `result` | Appends one match to `Matches` or `History`, in the right column shape for that tab |
| `photo` | Uploads an image to a Drive folder and appends a row to `Photos` |
| `preview` | Validates a season rollover and reports what it *would* write. Writes nothing |
| `rollover` | Appends every row to `History` tagged with the competition id, then clears `Matches` |

Everything is gated on the passcode. It can't read, edit or delete anything
else in the sheet.

---

## Before you paste

You need three tabs in your Google Sheet:

| Tab | Columns |
| --- | --- |
| `Matches` | 16 — `date, group, playerA, playerB, g1game…g3b` |
| `History` | 34 — `competition, date, group, playerA, playerB, g1game…g7b, round` |
| `Photos` | 6 — `url, caption, season, credit, date, status` |

See [GOOGLE-SHEET.md](GOOGLE-SHEET.md) for the exact header rows. If you're not
using photos yet, you can skip the `Photos` tab — the script only complains
when someone actually submits a photo.

For photos you also need a **Drive folder** to put them in. Create one, open
it, and copy the id out of the URL:

```
https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz
                                       └────────── this bit ──────────┘
```

---

## The script

1. Open your Google Sheet.
2. **Extensions → Apps Script.**
3. Delete whatever's in the editor and paste all of this in its place.

```js
/* ===========================================================================
   TDL — Google Apps Script
   ---------------------------------------------------------------------------
   Handles three things, all gated on the passcode:

     result   append one match to Matches or History
     photo    upload an image to Drive, append a row to Photos
     rollover preview / commit the end-of-season move into History

   Deploy as a Web app (Execute as: Me, Access: Anyone) and paste the URL
   into data/config.js. See docs/APPS-SCRIPT.md for the full walkthrough.
   =========================================================================== */

var VERSION = "2026-11-10";

/* ---- Settings ----------------------------------------------------------- */

// The passcode players type into the forms. Change this to something of your
// own — it's the only thing stopping a random stranger from adding rows, so
// don't leave it as "changeme".
var PASSCODE = "changeme";

var SHEET_NAMES = {
  matches: "Matches",
  history: "History",
  photos: "Photos"
};

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

var HISTORY_HEADER = ["competition", "date", "group", "playerA", "playerB",
  "g1game", "g1winner", "g1a", "g1b",
  "g2game", "g2winner", "g2a", "g2b",
  "g3game", "g3winner", "g3a", "g3b",
  "g4game", "g4winner", "g4a", "g4b",
  "g5game", "g5winner", "g5a", "g5b",
  "g6game", "g6winner", "g6a", "g6b",
  "g7game", "g7winner", "g7a", "g7b",
  "round"];

var PHOTOS_HEADER = ["url", "caption", "season", "credit", "date", "status"];

/* ---- Photo settings ----------------------------------------------------- */

// The Drive folder from the setup step above. Leave it as-is and photo
// uploads will refuse with a clear message rather than failing obscurely.
var PHOTO_FOLDER_ID = "PASTE_YOUR_FOLDER_ID_HERE";

// true  = uploads land as "pending" and stay off the site until you change
//         the status cell to "approved"
// false = uploads go live immediately
var PHOTO_MODERATION = true;

// Roughly 8MB of base64. The browser shrinks photos to ~1600px before
// sending, so a normal phone photo lands well under this.
var MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/* ---- Entry points ------------------------------------------------------- */

// Handy for checking a deployment is live: open the /exec URL in a browser
// and you should see {"ok":true,...}. Reveals nothing sensitive.
function doGet() {
  return respond({ ok: true, service: "TDL", version: VERSION });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (String(body.passcode || "") !== PASSCODE) {
      return respond({ ok: false, error: "Wrong passcode." });
    }

    var action = String(body.action || "result");

    if (action === "photo") return appendPhoto(body);
    if (action === "photos") return listPendingPhotos(body);
    if (action === "photoReview") return reviewPhoto(body);
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

/* ---------------------------------------------------------------- photo --- */

function appendPhoto(body) {
  if (!body.image) {
    return respond({ ok: false, error: "No image came through." });
  }
  if (body.image.length > MAX_PHOTO_BYTES) {
    return respond({ ok: false, error: "That photo is too big even after shrinking. Try a smaller one." });
  }
  if (!PHOTO_FOLDER_ID || PHOTO_FOLDER_ID.indexOf("PASTE") === 0) {
    return respond({ ok: false, error: "PHOTO_FOLDER_ID hasn't been set in the script yet." });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.photos);
  if (!sheet) {
    return respond({ ok: false, error: "Can't find a \"" + SHEET_NAMES.photos + "\" tab in this sheet." });
  }

  var folder;
  try {
    folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);
  } catch (err) {
    return respond({
      ok: false,
      error: "Can't open the Drive folder — check PHOTO_FOLDER_ID. (" + err.message + ")"
    });
  }

  var now = new Date();
  var stamp = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd-HHmmss");
  var slug = String(body.caption || "photo")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  var name = stamp + "-" + (slug || "photo") + ".jpg";

  var file;
  try {
    var blob = Utilities.newBlob(
      Utilities.base64Decode(body.image),
      body.mime || "image/jpeg",
      name
    );
    file = folder.createFile(blob);
    // Anyone with the link can view, so the site can show it without a login.
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    return respond({ ok: false, error: "Couldn't save the photo to Drive: " + err.message });
  }

  // lh3.googleusercontent.com serves the raw bytes and is far more reliable
  // for hotlinking than drive.google.com/uc?id=…, which redirects and
  // sometimes returns an HTML interstitial instead of the image.
  var url = "https://lh3.googleusercontent.com/d/" + file.getId();

  // Give the tab a header if it's brand new, so the row lands under it.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(PHOTOS_HEADER);
  }

  var values = {
    url: url,
    caption: String(body.caption || "").slice(0, 140),
    season: String(body.season || ""),
    credit: String(body.credit || "").slice(0, 60),
    date: Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd"),
    status: PHOTO_MODERATION ? "pending" : "approved"
  };

  var row = rowForSheet(sheet, values, PHOTOS_HEADER);
  if (row.error) {
    // Don't leave an orphan file in Drive if the sheet can't take the row.
    try { file.setTrashed(true); } catch (ignored) {}
    return respond({ ok: false, error: row.error });
  }

  sheet.appendRow(row.values);
  return respond({ ok: true, url: url });
}

/* ------------------------------------------------------ photo review --- */

/* Lists every photo row with its row number, so the admin page can show a
   queue and then act on a specific row. Returns pending first, then the
   rest newest-first, so the thing you need to look at is at the top. */
function listPendingPhotos(body) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.photos);
  if (!sheet) {
    return respond({ ok: false, error: "Can't find a \"" + SHEET_NAMES.photos + "\" tab in this sheet." });
  }

  var last = sheet.getLastRow();
  if (last < 2) return respond({ ok: true, photos: [] });

  var width = sheet.getLastColumn();
  var header = sheet.getRange(1, 1, 1, width).getValues()[0].map(function (h) {
    return String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  });
  var data = sheet.getRange(2, 1, last - 1, width).getValues();

  function col(name) { return header.indexOf(name); }
  var iUrl = col("url"), iCap = col("caption"), iSeason = col("season"),
      iCredit = col("credit"), iDate = col("date"), iStatus = col("status");

  var photos = data.map(function (row, i) {
    return {
      row: i + 2,                       // 1-based sheet row, header is row 1
      url: iUrl >= 0 ? String(row[iUrl] || "") : "",
      caption: iCap >= 0 ? String(row[iCap] || "") : "",
      season: iSeason >= 0 ? String(row[iSeason] || "") : "",
      credit: iCredit >= 0 ? String(row[iCredit] || "") : "",
      date: iDate >= 0 ? String(row[iDate] || "") : "",
      status: iStatus >= 0 ? String(row[iStatus] || "").trim().toLowerCase() : ""
    };
  }).filter(function (p) { return p.url; });

  photos.sort(function (x, y) {
    var xp = x.status === "pending" ? 0 : 1;
    var yp = y.status === "pending" ? 0 : 1;
    if (xp !== yp) return xp - yp;
    if (x.date !== y.date) return x.date < y.date ? 1 : -1;
    return y.row - x.row;
  });

  return respond({ ok: true, photos: photos });
}

/* Approves or rejects one row. Rejecting also trashes the Drive file, so a
   rejected photo doesn't sit in the folder forever. */
function reviewPhoto(body) {
  var row = Number(body.row);
  var status = String(body.status || "").toLowerCase();
  if (!row || row < 2) return respond({ ok: false, error: "No row given." });
  if (status !== "approved" && status !== "rejected" && status !== "pending") {
    return respond({ ok: false, error: "Status must be approved, rejected or pending." });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.photos);
  if (!sheet) {
    return respond({ ok: false, error: "Can't find a \"" + SHEET_NAMES.photos + "\" tab in this sheet." });
  }

  // Check the shape before the row number: a missing status column breaks
  // every review, so it's the more useful thing to report first.
  var width = sheet.getLastColumn();
  var header = sheet.getRange(1, 1, 1, width).getValues()[0].map(function (h) {
    return String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  });
  var iStatus = header.indexOf("status");
  if (iStatus === -1) {
    return respond({ ok: false, error: "The Photos tab has no \"status\" column." });
  }

  if (row > sheet.getLastRow()) {
    return respond({ ok: false, error: "Row " + row + " is past the end of the sheet." });
  }

  sheet.getRange(row, iStatus + 1).setValue(status);

  // Rejecting should also clear the file out of Drive. Best-effort: if the
  // file is already gone or the id can't be parsed, the status change still
  // stands, because that's what actually hides it from the site.
  var trashed = false;
  if (status === "rejected") {
    var iUrl = header.indexOf("url");
    if (iUrl >= 0) {
      var url = String(sheet.getRange(row, iUrl + 1).getValue() || "");
      var id = (url.match(/\/d\/([a-zA-Z0-9_-]+)/) || [])[1];
      if (id) {
        try { DriveApp.getFileById(id).setTrashed(true); trashed = true; } catch (ignored) {}
      }
    }
  }

  return respond({ ok: true, row: row, status: status, trashed: trashed });
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

/* ---------------------------------------------------------------- reply --- */

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Change `PASSCODE` to whatever you want your passcode to be.
5. Change `PHOTO_FOLDER_ID` to the folder id from the setup step.
6. **Save** (the disk icon, or `Ctrl+S`).

---

## Deploying

1. Top right of the Apps Script editor: **Deploy → New deployment.**
2. Next to "Select type", click the gear icon and choose **Web app**.
3. Fill in:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**.
5. Google will ask you to **authorize access** — click through it. You may see
   an "unverified app" warning; click **Advanced → Go to (your project)
   (unsafe)**. That's normal for a personal script that hasn't been submitted
   for review — nobody but you can run it as you.
6. Copy the **Web app URL**. It looks like:

```
https://script.google.com/macros/s/AKfycb.../exec
```

### Granting the Drive permission

The first time the script touches Drive it needs permission. If the
authorisation prompt in step 5 didn't mention Drive:

1. In the Apps Script editor, pick `appendPhoto` from the function dropdown.
2. Hit **Run**.
3. Accept the Drive permission when asked.

You only do this once.

---

## Pointing the site at it

Both forms use the same URL. In `data/config.js`:

```js
resultsForm: {
  submitUrl: "https://script.google.com/macros/s/AKfycb.../exec"
},

photos: {
  submitUrl: "https://script.google.com/macros/s/AKfycb.../exec",
  moderation: true,
  maxUploadMb: 12,
  home: [ … ]
}
```

Then publish the tabs as CSV and paste those links in too:

```js
sheet: {
  enabled: true,
  playersCsvUrl: "…",
  matchesCsvUrl: "…",
  historyCsvUrl: "…",
  photosCsvUrl: "…"
}
```

`File → Share → Publish to web` gives you each CSV link.

---

## Upgrading an existing script

If you deployed an earlier version (results only, or results + rollover):

1. Open the Apps Script editor and **select all**, then paste the script above
   in its place.
2. Set `PASSCODE` to your existing passcode — **don't** leave it as
   `"changeme"`, or the forms will start rejecting everyone.
3. Set `PHOTO_FOLDER_ID`.
4. **Deploy → Manage deployments → the pencil icon → Version: "New version"
   → Deploy.**

The URL stays exactly the same, so nothing needs re-pasting into
`config.js`. The `doGet` version string lets you confirm the new version is
live — open the `/exec` URL in a browser and check the `version` field.

---

## Redeploying after any edit

Editing the code alone **does not** update the live URL — "Anyone"
deployments are pinned to whichever version was live when you deployed. To
push an edit live:

**Deploy → Manage deployments → the pencil (edit) icon → Version: "New
version" → Deploy.**

---

## Things worth knowing

- **This is obscurity, not real security.** Anyone with the passcode can add a
  result or a photo. Fine for a friendly bar league — don't use this pattern
  for anything that actually needs protecting, and change the passcode
  occasionally if it feels like it's leaked.
- **Google caches published sheets for a few minutes**, so a row that saved
  successfully may take a while to appear on the site. That's Google, not a
  bug.
- **The script only appends rows.** It can't edit or delete an existing
  result — do that directly in the sheet. The one exception is `rollover`,
  which clears `Matches` *after* it has successfully written every row to
  `History`.
- **Drive hotlinking isn't officially supported.** `lh3.googleusercontent.com`
  works reliably today and is what the script uses, but Google has changed
  this before. If photos stop loading, that's the first thing to check.
- **The Drive folder must stay shared.** If you make it private, every photo
  in it breaks on the site.
- **Deleting a photo** means deleting the row in the sheet. The file stays in
  Drive — delete it there too if you want it gone properly.
- **Nothing about the rest of the site depends on this.** If you never set it
  up, `submit.html` and `photos.html` just show a card explaining how.
