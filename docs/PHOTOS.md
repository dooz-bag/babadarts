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

The complete script — results, photos and rollover in one deployment — lives
in **[APPS-SCRIPT.md](APPS-SCRIPT.md)**. Paste that in, set `PASSCODE` and
`PHOTO_FOLDER_ID`, and deploy. Come back here for the Photos tab shape and
how moderation works.

The photo-specific settings in that script are:

```js
var PHOTO_FOLDER_ID = "PASTE_YOUR_FOLDER_ID_HERE";  // the folder from step 1
var PHOTO_MODERATION = true;                        // false = publish instantly
var MAX_PHOTO_BYTES = 8 * 1024 * 1024;              // ~8MB of base64
```

`doPost` in that script already routes `action: "photo"` to `appendPhoto`, so
there's nothing to wire up by hand.

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
the site. There are two ways to publish one:

**The admin page (easier).** Open `admin.html`, type the passcode in the
**Review photos** panel, and hit **Load the queue**. You get thumbnails with
**Approve** / **Reject** buttons. Rejecting also moves the file to the Drive
bin. See [UPDATING.md](UPDATING.md#4c-reviewing-photos).

**By hand.** Change the **status** cell in the `Photos` tab to `approved`.
Same effect, no redeploy either way.

Google caches published sheets for a few minutes, so give it a moment before
the carousel updates.

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
