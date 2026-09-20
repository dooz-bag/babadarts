# How to update the website

You never need to touch the design or the code. Everything you'll ever change
lives in the **`data`** folder, in four files:

| File | What it's for |
| --- | --- |
| `data/config.js` | League name, venue, contact details, current status, rules |
| `data/players.js` | The roster |
| `data/matches.js` | Match results |
| `data/archive.js` | Past leagues and tournaments |

**The golden rule:** only change text *between the quote marks*. Leave the
commas, quote marks and curly brackets exactly where they are.

If something ever looks broken, press `Ctrl + Z` until it works again.

---

## 1. Adding a match result

Open `data/matches.js`. Scroll to the bottom of the list and add a line like
this, just above the final `];`

```js
m("2025-04-29", "A", "alex", "yuki", [
  ["701",     "alex", 24.2, 21.8],
  ["cricket", "yuki",  2.05, 2.41],
  ["701",     "yuki", 22.0, 23.6]
]),
```

Reading that line out loud: *on 29 April, in Group A, Alex played Yuki. Alex won
the 701 leg (Alex 24.2 PPD, Yuki 21.8). Yuki won the cricket leg (Alex 2.05 MPR,
Yuki 2.41). Yuki won the decider. So Yuki won the match 2–1.*

Things to remember:

- **The date** is always `"YYYY-MM-DD"`.
- **The names** are the short `id`s from `data/players.js`, *not* real names.
- **The first number is always the first player listed**, the second number is
  always the second player. Get these the wrong way round and someone's average
  will be wrong.
- **701 legs use PPD. Cricket legs use MPR.** Both come straight off the
  DARTSLIVE screen.
- **If it was a 2–0, only write two legs.** Don't invent a third.
- Every match line ends with `]),` — comma included.

Save the file, refresh the website. The league table, all the averages, the
records and the playoff bracket all update themselves. There is nothing else
to do.

## 2. Adding a new player

Open `data/players.js`, copy an existing line, and change it:

```js
{ id: "newguy", name: "New Guy", dartslive: "NEWBIE", country: "Canada", flag: "🇨🇦", group: "B", avatar: "", notes: [] },
```

- `id` — short, no spaces, all lowercase. **Never change an id once the season
  has started**, or their results will disappear.
- `flag` — copy and paste the flag emoji from <https://emojipedia.org/flags>.
- `group` — `"A"` or `"B"`. You can invent a `"C"` if the league grows; a new
  group appears on every page on its own, and the playoff bracket resizes to
  suit.
- `notes` — honours shown on their card, e.g.
  `notes: ["2024 Autumn champion", "Highest MPR 2024"]`

Groups do **not** have to be the same size. Matches-per-player is worked out
from however many people are in each group, so a 10 v 11 season is fine.

## 2b. Changing how many players make the playoffs

One number, in `data/config.js`:

```js
playoffSpots: 6,     // top 6 in each group qualify
```

Everything else follows from it — the cut-lines on the league table, the number
of round-one byes, how many rounds there are and the size of the bracket. You
do not need to edit the bracket anywhere.

## 3. Updating the league status on the front page

Open `data/config.js` and edit the `status` block. There are only two things
in it:

```js
status: {
  running: true,             // true = green badge, false = amber badge
  seasonName: "Fall 2026 League"
}
```

That's the whole status board. When `running` is `false` the badge just says
the league isn't on at the moment — no dates, no countdowns to keep updated.

### Adding your LINE details

While you're in `data/config.js`, there's also a `contact` block used by the
Join page:

```js
contact: {
  name: "",       // optional — a name to put in the sentence
  lineId: "",      // your @id, shown as text people can search for
  lineUrl: ""      // a LINE invite link — makes a clickable button
}
```

Fill in `lineUrl` if you have an invite link, `lineId` if you only have the
@id, or both. Leave them blank and the Join page just tells people to ask at
the bar instead.

## 4. Archiving a finished season

When a league finishes, add a new block to `data/archive.js`. Copy the whole
`2024-autumn` block, paste it above, and change the details. The moment you save:

- it appears on the Archive page
- it gets its own page at `season.html?s=your-new-id`
- it's added to the Archive dropdown in the menu
- its champion joins the Roll of Honour at the bottom of the Stats page

Then reset `data/matches.js` for the new season — delete the old match lines
(keep the `m(...)` explanation at the top) and start again.

## 5. Adding photos

1. Put the image file in `assets/img/archive/`
2. List it in `data/archive.js`:

```js
photos: [
  { src: "assets/img/archive/2025-spring-final.jpg", caption: "The final." }
]
```

If the file isn't there yet, the site shows a placeholder **with the missing
file name printed on it**. So you can safely write the photo list first and add
the actual pictures later.

Photos of the bar for the home page go in `assets/img/hub/` — see the README in
that folder for the exact three file names.

---

## Previewing your changes before anyone sees them

You can just double-click `index.html` to open it, but the Archive pages work
better through a mini web server. If you have VS Code, install the **Live
Server** extension, then right-click `index.html` → *Open with Live Server*.

## Publishing

This is a plain website with no build step, so anything that hosts files works.
The two easiest:

- **Netlify Drop** — go to <https://app.netlify.com/drop> and drag the whole
  project folder onto the page. Done, and free.
- **GitHub Pages** — push the folder to a GitHub repository, then
  *Settings → Pages → Deploy from branch → main → / (root)*.

To update a live site afterwards you edit the data file, save, and re-upload
(or `git push`).

---

## Help, I broke it

Almost always one of these three:

1. **A missing comma** between two entries.
2. **A deleted quote mark** — every bit of text needs one at each end.
3. **A curly apostrophe** in a name, e.g. `"O’Connell"`. Use a straight one:
   `"O'Connell"`.

To see the actual error: right-click the page → *Inspect* → *Console* tab. The
red message names the file and the line number.
