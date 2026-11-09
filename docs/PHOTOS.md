# Optional: let people send in photos

`photos.html` is a form — pick a photo, add a caption, type the shared
passcode, hit send — that uploads the image to a Google Drive folder and
writes a row into the `Photos` tab of your Google Sheet. The site then reads
that tab and shows the approved ones in the carousel.

**It is genuinely optional.** Until it's set up, the page just explains that,
politely, and nothing else on the site is affected. The carousel works fine
without it — it falls back to the list in `data/config.js` → `photos.home`.

---

## How it fits together

```
photos.html  ──POST──▶  Apps Script  ──▶  Drive folder  (the image)
                              └────────▶  Photos tab    (the row)
                                                  │
                                                  ▼
                              site reads the tab as CSV, shows approved rows
```

The image lives in Drive; the sheet only holds the link and the metadata. That
keeps the sheet small and means you can move or re-caption a photo without
re-uploading it.

---

## Step 1 — Make a Drive folder

1. In Google Drive, create a folder — `TDL Photos` is a fine name.
2. Open it and copy the folder id out of the URL:

   ```
   https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz
                                          └────────── this bit ──────────┘
   ```

You'll paste that into the script in a moment.

## Step 2 — Add the Photos tab

In your Google Sheet, add a new tab called exactly **Photos** with this header
row in row 1:

| url | caption | season | credit | date | status |
| --- | --- | --- | --- | --- | --- |
| https://drive.google.com/… | Martin, mid-excuse. | 2026-fall | Brady | 2026-11-09 | approved |

- **url** — the image link. The script fills this in for you.
- **caption** — optional, shown under the photo.
- **season** — optional. An archive id from `data/archive.js` (e.g.
  `2026-fall`). Leave it blank and the photo only appears on the home page
  carousel; fill it in and it also appears in that season's gallery.
- **credit** — optional, who took it.
- **date** — optional, `YYYY-MM-DD`. Newest first in the carousel.
- **status** — `approved` or `pending`. **Only `approved` rows are shown.**
  The script writes `pending` when `photos.moderation` is on, and `approved`
  when it's off.

## Step 3 — Add the script

If you already have the results script from
[docs/SUBMIT-RESULTS.md](SUBMIT-RESULTS.md), you don't need a second one —
paste these additions into the same project. If you don't, create a fresh
Apps Script from **Extensions → Apps Script** and paste the whole block below.

```js
// ---------------------------------------------------------------- photos ---

// The Drive folder from step 1.
var PHOTO_FOLDER_ID = "PASTE_YOUR_FOLDER_ID_HERE";

var PHOTOS_SHEET = "Photos";
var PHOTOS_HEADER = ["url", "caption", "season", "credit", "date", "status"];

// Set false to publish uploads immediately instead of holding them for review.
var PHOTO_MODERATION = true;

// Roughly 8MB of base64. The browser shrinks photos to ~1600px before
// sending, so a normal phone photo lands well under this.
var MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function appendPhoto(body) {
  if (!body.image) {
    return respond({ ok: false, error: "No image came through." });
  }
  if (body.image.length > MAX_PHOTO_BYTES) {
    return respond({ ok: false, error: "That photo is too big even after shrinking. Try a smaller one." });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PHOTOS_SHEET);
  if (!sheet) {
    return respond({ ok: false, error: "Can't find a \"" + PHOTOS_SHEET + "\" tab in this sheet." });
  }

  var folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd-HHmmss");
  var safeCaption = String(body.caption || "photo").replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 40);
  var name = stamp + "-" + (safeCaption || "photo") + ".jpg";

  var blob = Utilities.newBlob(
    Utilities.base64Decode(body.image),
    body.mime || "image/jpeg",
    name
  );
  var file = folder.createFile(blob);

  // Anyone with the link can view, so the site can show it without a login.
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // lh3.googleusercontent.com serves the raw bytes and is far more reliable
  // for hotlinking than drive.google.com/uc?id=…, which redirects and
  // sometimes returns an HTML interstitial instead of the image.
  var url = "https://lh3.googleusercontent.com/d/" + file.getId();

  var values = {
    url: url,
    caption: String(body.caption || "").slice(0, 140),
    season: String(body.season || ""),
    credit: String(body.credit || "").slice(0, 60),
    date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    status: PHOTO_MODERATION ? "pending" : "approved"
  };

  var row = rowForSheet(sheet, values, PHOTOS_HEADER);
  if (row.error) return respond({ ok: false, error: row.error });

  sheet.appendRow(row.values);
  return respond({ ok: true, url: url });
}
```

Then hook it into `doPost` — find the existing `doPost` and add one line:

```js
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (String(body.passcode || "") !== PASSCODE) {
      return respond({ ok: false, error: "Wrong passcode." });
    }

    var action = String(body.action || "result");

    if (action === "photo") return appendPhoto(body);   // <-- add this
    if (action === "preview") return previewRollover(body);
    if (action === "rollover") return commitRollover(body);

    return appendResult(body);
  } catch (err) {
    return respond({ ok: false, error: "Server error: " + err.message });
  }
}
```

## Step 4 — Grant the Drive permission

The first time the script touches Drive it needs permission:

1. In the Apps Script editor, pick `appendPhoto` from the function dropdown.
2. Hit **Run**.
3. Google will ask for authorisation — accept it. You'll see a warning that
   the app isn't verified; click **Advanced → Go to (project name)**. That's
   normal for your own script.

## Step 5 — Publish it

Same as the results script: **Deploy → New deployment → Web app**, execute as
**Me**, access **Anyone**. Copy the URL.

If you already had a deployment, use **Manage deployments → edit → Version:
New version → Deploy** so the URL stays the same.

## Step 6 — Point the site at it

In `data/config.js`:

```js
photos: {
  submitUrl: "https://script.google.com/macros/s/AKfy…/exec",
  moderation: true,
  maxUploadMb: 12,
  home: [ … ]
}
```

And publish the Photos tab as CSV, then paste that link in:

```js
sheet: {
  …
  photosCsvUrl: "https://docs.google.com/spreadsheets/d/e/…/pub?gid=…&single=true&output=csv"
}
```

`File → Share → Publish to web → Photos tab → CSV` gives you that link.
---

## Approving photos

With `moderation: true`, every upload lands as `pending` and is invisible on
the site. To publish one, change its **status** cell to `approved`. That's it —
no redeploy, no code change.

Google caches published sheets for a few minutes, so give it a moment.

## Things worth knowing

- **Drive hotlinking is not officially supported.** `lh3.googleusercontent.com`
  works reliably today and is what the script uses, but Google has changed
  this before. If photos stop loading, that's the first thing to check.
- **The folder must stay shared.** If you change the folder's sharing to
  private, every photo in it breaks on the site.
- **Photos are shrunk in the browser** to 1600px on the long edge at quality
  0.82 before upload — typically 250–400KB. That keeps the request small and
  the site fast. The original stays on the submitter's phone.
- **The passcode is the only gate.** It's the same one as the results form,
  and it's checked server-side. Anyone with it can upload; that's why
  moderation defaults to on.
- **Deleting a photo** means deleting the row in the sheet. The file stays in
  Drive — delete it there too if you want it gone properly.
