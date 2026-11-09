/* ===========================================================================
   DATSU — PHOTOS (local fallback)
   ---------------------------------------------------------------------------
   The site reads photos from the "Photos" tab of your Google Sheet when
   sheet.photosCsvUrl is set in data/config.js. This file is what it uses
   when that's blank, or when the sheet can't be reached.

   You don't have to touch this if you're using the sheet. If you're not,
   add entries here and they'll show up in the carousel.

   Each entry:

     {
       src:     "assets/img/hub/board.jpg",   // path, or a full https:// URL
       caption: "Our board.",                 // optional
       season:  "2026-fall",                  // optional — see below
       date:    "2026-11-09"                  // optional, newest first
     }

   `season` ties a photo to an archived season, so it appears in that
   season's gallery on season.html. Leave it out and the photo only shows
   in the home page carousel.

   A path with no slash in it (e.g. "spring-26-group.JPG") is assumed to
   live in assets/img/archive/.
   =========================================================================== */

window.DATSU = window.DATSU || {};

DATSU.photos = [];
