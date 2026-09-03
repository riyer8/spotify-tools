# Song migration — “this song graduated”

This is the spec for idea 2 from `idea-dump.md`. Night already owns sittings. Migration owns **the same song moving through rooms**.

Implementation order for the four library experiences remains 1 → 2 → 4 → 5. Night is shipped. This document is what Night’s spec was: product, data, visual language, edge cases, and a v1 acceptance list. Time capsule and Graveyard stay in `library-experiences.md`.

---

## Product

People have “your top tracks.” Almost nobody has “this song graduated.”

The dataset is not plays. It is claims. A track that lives in `gym` (2021) and `crying in the car` (2024) already has a life. The page shows that life as a path through playlists — rooms — with the dates you actually saved it.

Primary feeling: **recognition.** “Oh — that song left the gym.”

This is not:

- a table of songs that appear in more than one playlist
- a force-directed graph
- “most saved tracks”
- a mood inferred from playlist names (“you were sad in 2024”)
- playback, Wrapped, or listening history

The user’s naming is the joke and the ache. Copy quotes playlist titles. It does not interpret them.

### What “graduated” means here

Spotify will not tell us that a song *left* a playlist. We only see current membership plus `addedAt`. A migration is therefore:

> the same song, claimed into **two or more playlists**, at **different times** (or the same day, which is a split, not a graduation).

We do not know if it was removed from the first room. Graveyard will, once snapshots exist. Migration still works on today’s cache: the song *arrived* in a second room later. That arrival is the event.

### Two ways in

1. **Song view (default, the hero).** One song. A river of rooms in the order it was claimed. Hairlines of other lives that passed through the same rooms.
2. **Room view.** One playlist. Songs that **arrived** from elsewhere vs songs that **left** for elsewhere (later claims in other playlists). The house, not the traveler.

v1 ships both. Song view is the landing. Room view is one click on a bank, or the Songs / Rooms toggle.

---

## Shared foundations (same as Night)

- Flattened `LibraryEvent` from `src/experiences/events.js`. Identity is `trackId` or `name|artist` fallback.
- Active playlist filter still applies. Migrations are computed from `filteredPlaylists` + `library.tracksByPlaylistId`, never the unfiltered library.
- No new backend routes. No LLM copy. No Spotify write. Open-in-Spotify links are fine.
- Visual tokens from `library-experiences.md`: void black, green, amber (time), violet (playlists / rooms), ice blue (paths).
- Shell unchanged: sticky header, filter, cache, refresh, log out. Add a **Migrations** tab beside Nights. Still `page` state in `App.jsx`, no React Router. DEV deep link: `?saved=1&page=migrations`.

Header will be tight with four tabs. Tabs may wrap on small screens (already true). Do not hide Migrations behind a “More” menu in v1.

```
src/experiences/events.js            already shipped
src/experiences/migrations.js        cluster, classify, story, river/room indexes
src/Migrations.jsx                   page
src/Migrations.css                   river, docks, room view
```

Keep clustering/narrative **pure**. Components only render.

---

## Data

### Claim list

Group flattened events by `event.identity`.

For each group, sort claims by `addedAtMs`, then playlist name.

```
Claim = {
  trackId, name, artistKey, identity,
  playlistId, playlistName,
  addedAt, addedAtMs,
  collaborative
}
```

Drop groups with **fewer than 2 distinct `playlistId`s**. A song saved twice into the same playlist (same or different dates) is not a migration. If the same song is added twice to the same playlist *and* also lives in another playlist, keep every claim, but collapse consecutive same-playlist hops in the **path label** (the river still shows one bank per playlist visit *run*).

Consecutive same-playlist claims: treat as one **stay** (use earliest `addedAt` for that run, keep `claimCount` on the stay). The river is stays, not raw events.

```
Stay = {
  playlistId, playlistName,
  addedAt, addedAtMs,          // first claim in this run
  claimCount,                  // usually 1
  collaborative
}
```

### Migration object

```
Migration = {
  id,                    // identity
  trackId, name, artistKey, albumName,
  claims,                // raw, chronological
  stays,                 // collapsed consecutive rooms
  rooms,                 // distinct playlistId count
  hops,                  // stays.length - 1
  first, last,           // Stay
  spanMs,                // last.addedAtMs - first.addedAtMs
  path,                  // playlist names in stay order
  pathKey,               // playlistIds joined — for “same corridor” hairlines
  kind,                  // 'graduation' | 'hop' | 'split' | 'panic'
  score,
  usesCollaborative
}
```

### Kind

Computed, mutually exclusive, first match wins:

| Kind | Rule | Feeling |
| --- | --- | --- |
| **split** | `spanMs < 18 hours` OR first and last stay fall on the same local calendar date | claimed in two places the same sitting |
| **panic** | `rooms >= 4` and `spanMs < 7 days` | “I need this in every version of me, right now” |
| **hop** | `spanMs < 30 days` | sorting, not becoming |
| **graduation** | everything else | the song left the gym |

`18 hours` (not midnight clock) so a 11:40pm → 1:05am double-save is a split, not a hop.

### Scoring (who is “the” life)

The library in this repo has **thousands** of migrations. The rail cannot list all of them. Score exists to pick a default and to order featured slices — not to hide the rest from search.

```
score =
    spanDays                        * 3
  + rooms                           * 8
  + hops                            * 2
  + (kind === 'graduation' ? 40 : 0)
  + (kind === 'panic' ? 12 : 0)
  - (kind === 'split' ? 20 : 0)
```

Default selection: highest `score`, then longest `spanMs`, then name. That prefers slow, many-room graduations (Sia in `r` → `sunroof` over a same-week reshuffle).

### Featured slices (rail)

Search always runs over the **full** migration list.

The unscrolled rail, with an empty query, shows three groups:

| Group | Who | Cap | Default open |
| --- | --- | --- | --- |
| **Graduated** | `kind === 'graduation'`, sort `spanMs` desc | 60 | yes |
| **Wanderers** | `rooms >= 6`, sort `rooms` desc then `spanMs` desc; omit if already in Graduated’s first 60 | 16 | no |
| **Quick** | `hop` + `panic` + `split`, sort `rooms` desc then recency | 24 | no |

If Graduated is empty (tiny library), promote the top 40 by score into Graduated so the page is never blank when any migration exists.

Query match: song name, artist, any playlist name on the path. Matching rows replace the featured caps (show up to 80 hits, grouped by kind).

### Hairlines

For the selected migration, other migrations whose `stays` include **at least two** of the selected song’s playlist ids.

Sort those by how many rooms they share, then by score. Cap **28**. They draw as thin strokes on the same banks (skip banks they never visited). Clicking a hairline selects that song.

Do not draw all 6k lives. That is a chart of noise.

### Room index (room view)

For each playlist id that appears in any migration stay:

```
RoomFlow = {
  playlistId, playlistName,
  arrived: [{ migration, fromStay, intoStay }],   // previous stay was a different room
  left:    [{ migration, fromStay, intoStay }],   // this stay, next stay is a different room
  born:    [{ migration, stay }]                  // this playlist is the song’s first stay
}
```

A song can be in `born` and later in `left`. A song can `arrived` from `gym` and later `left` for `crying in the car`.

Sort rooms by `arrived.length + left.length` desc. Rail cap: 80 rooms with any flow. Search filters rooms by name.

Inbound/outbound lists for the selected room: cap 40 each in the dock; “and n more” if truncated. Sort by the hop’s `addedAt` desc (most recent arrival first).

---

## Narrative (templated)

Second person, short sentences, no slang pile-up, no emoji in the story body. Omit a sentence if its data is missing. Do not infer mood from the playlist title.

```
“{name}” by {artist}

First claimed in {first.playlist} on {first.date}.
{spanHuman} later, it showed up in {second.playlist}.
{If stay 3 exists:} Then {third.playlist} ({third.date}).
{If stay 4 exists:} Then {fourth.playlist} ({fourth.date}).
{If hops > 3:} And {n} more rooms after that.

{If kind === 'split':} Claimed in two places the same day.
{If kind === 'panic':} Four rooms in a week — saved like it had to exist everywhere.
```

`spanHuman` between first and second stay (not first and last): “18 days”, “seven months”, “three years”.

Collaborative playlists in the path: first sentence becomes “First claimed in this library in …” — we do not store `added_by`, so do not say “you” vs a collaborator.

Story dock also lists every stay as a beat: date, room pill, optional Open in Spotify (once, using `trackId`).

---

## Visual design

Split stage, same family as Nights. Not a dashboard grid. Not a table.

```
┌──────────────────────────────────────────────────────────────────┐
│  LEFT RAIL                       STAGE                           │
│  Migrations                      kicker: This song graduated     │
│  60 of 4,085 lives               SONG TITLE as display type      │
│                                  artist · N rooms · span         │
│  [search]                                                        │
│                                  RIVER                           │
│  Graduated ▾                     banks = playlists               │
│  [ Fire Meet Gasoline ]          bold path = this life           │
│    r → sunroof · 7y              hairlines = other lives         │
│  [ Begin Again ]                                                 │
│                                  story + stay beats              │
│  Wanderers ▸                                                     │
│  Quick ▸                         (room view: arrived / left)     │
└──────────────────────────────────────────────────────────────────┘
```

### Left rail

- Sticky inside the page.
- Each song row: title, artist (muted), path teaser (`first → last`, collapse middle to `→`), span (`7y` / `18d` / `same day`).
- Kind mark: none for graduation; a small `split` / `quick` / `panic` amber label on Quick rows.
- Selected: ice-blue left bar (paths), slightly brighter. Nights uses violet/green; Migrations uses ice blue so the two tabs do not feel copy-pasted.
- Keyboard: `j` / `k` or arrows. Visible focus ring. `aria-current` on the selected row.
- Groups collapse like Nights years.

### Stage hero

- Enormous song title (`2.4–3.2rem`, tight tracking). Long titles wrap; max 3 lines then ellipsis.
- Meta line in amber: artist · `{rooms} rooms` · `{spanHuman}` · `{kind label}`.
- Background: radial ice-blue glow at the river, void black at the edges. No stock photos.

### River (the graphic that must not look like a table)

Horizontal **banks**. Each stay is a column:

- Playlist name (violet, weight 700), wrapping to 2 lines
- Local date in amber tabular numbers (`Mar 2018`)
- A disc on the “waterline”

A cubic bezier connects consecutive discs, bowing **up** then into the next bank (a river, not a polyline chart). Stroke ice blue, ~3.5px, draw-in via `stroke-dashoffset` on select (~600ms).

Hairlines: 1px, opacity 0.18, same bezier geometry on the banks they share. Hover raises opacity to 0.55 and shows a tooltip `{song} · {artist}`. Click selects.

If `stays.length > 8`, show first 7 banks plus a `+N` terminus. A control “Show every room” expands in place (horizontal scroll, not a modal).

Entrance: banks fade in left-to-right, 40ms apart, capped so 8 banks finish under 400ms. `prefers-reduced-motion`: final river immediately.

The river must work at 320px (horizontal scroll, banks `min-width: 7.5rem`) and 1200px.

Clicking a bank selects that room and switches to **room view** for it (the alternate entry). A back control returns to the song.

### Stay beats

Under the story, one card per visible stay (cap 8, same expand rule):

- Label: First / Then / Latest
- Date
- Playlist as violet pill
- “Open in Spotify” if `trackId`

Clicking a beat highlights that bank.

### Room view

Hero is the playlist name, not a song.

Two columns on desktop, stack on mobile:

| Arrived | Left |
| --- | --- |
| songs whose previous stay was another room | songs whose next stay is another room |
| `{song}` from `{from}` · `{date}` | `{song}` to `{to}` · `{date}` |

A quieter third line under the hero: `{n} lives began here` (`born`), not a third column — birth is not a graduation.

Empty column copy: “Nothing arrived from another room.” / “Nothing has left for another room — yet. Or we cannot see leaves until Graveyard.”

Clicking a song row returns to song view on that migration.

### Songs / Rooms toggle

Segmented control in the rail head (and duplicated as a quiet control on the stage). Switching views keeps context: song → its last-clicked bank if any, else its first stay’s playlist; room → the currently selected room’s top inbound song if any, else the top scored migration that touches it.

---

## Interaction

| Input | Result |
| --- | --- |
| Click rail song | Select life, replay river draw-in |
| Click hairline | Select that song |
| Click bank or stay beat | Room view for that playlist |
| Click arrived/left row | Song view for that migration |
| `j` / `↓` | Next visible rail item |
| `k` / `↑` | Previous |
| Open in Spotify | New tab |
| Playlist filter change | Recompute; keep selection if still present, else top score |
| Search | Filter full list; auto-select first match if current selection drops out |

---

## Edge cases

| Case | Behavior |
| --- | --- |
| No dated events | Empty: “Migrations need the date you added each song. Refresh the library.” |
| Songs exist but none in two playlists | Empty: “Nothing has lived in two rooms yet. Followed-only filters hide a lot of this.” |
| Filter too tight | Same pattern as Nights |
| Same-day multi-room | `split` copy, still a path (not hidden) |
| 12–16 rooms | Cap river at 8 + expand |
| Duplicate add same playlist | Collapse into one stay |
| Collaborative | “this library”, not “you” |
| Missing `trackId` | No Open in Spotify; identity still groups by name/artist |
| Hairline with only one shared bank | Do not draw (need two points) |
| 6k migrations | Featured caps + search; never mount 6k DOM rows |
| Room with 200 inbound | Cap dock at 40 + “and n more” |

---

## Accessibility

- River is decorative (`aria-hidden` on the SVG). Stay beats and the story are the accessible chronology.
- `prefers-reduced-motion`: no dashoffset / stagger.
- Contrast: amber times, white titles, ice-blue path on `#07070a`.
- Rail selection is `aria-current`. Stage `h1` is the song or room name.
- Toggle is `role="tablist"` or a group of `aria-pressed` buttons.

---

## Performance

Group-by identity is O(n) after flatten (n dated events, here tens of thousands). Memoize on `filteredPlaylists` + `tracksByPlaylistId`. Do not rebuild hairlines except when `selectedId` changes. Do not virtualize the river (max 8–16 banks). Do not render the unfiltered rail.

---

## What we will not do in Migration v1

- No LLM. No “this means you grew up.”
- No Spotify playback SDK / embeds (Open in Spotify only).
- No writes back to Spotify.
- No Graveyard (deletes). Copy may admit we cannot see leaves from a room that dropped the song.
- No atlas of every playlist as a global axis (unreadable at 131 rooms). Hairlines live on the selected song’s banks.
- No dumping-ground geology (inbox as sediment) — that is a later attic idea that *uses* migration.
- Night clustering is not reused here. A panic-save across four rooms in ninety seconds is a migration kind, not a Night.

---

## v1 acceptance

Migration is done when all of the following are true on the local site:

1. A **Migrations** tab exists beside Nights.
2. Migrations are grouped by song identity from the **filtered** library; ≥ 2 distinct playlists required.
3. Featured Graduated / Wanderers / Quick slices follow the caps; search covers the full set; the page is never blank if any migration exists.
4. Selecting a song shows: display title, river of rooms, templated story, stay beats, hairlines of other lives that share ≥ 2 rooms.
5. Room view shows arrived vs left for a playlist, reachable from the toggle and from clicking a bank.
6. Split / panic / hop / graduation kinds change copy, not just a badge.
7. Empty, no-dates, and filter-mismatch states are designed.
8. `prefers-reduced-motion` is respected.
9. Desktop and a mobile-width layout both work (rail becomes a horizontal scroller on small screens, river scrolls horizontally).
10. Verified in the browser against the running app (or `?saved=1&page=migrations`).

---

## Engineering checklist

- [x] `docs/song-migration.md` — this spec
- [x] `src/experiences/migrations.js` — group, stays, kinds, score, indexes, story
- [x] `src/Migrations.jsx` — rail + river + room view
- [x] `src/Migrations.css` — ice-blue void, reduced-motion, mobile
- [x] `src/App.jsx` — tab + `page=migrations`
- [x] Empty / no-dates / no-two-rooms states
- [x] Keyboard j/k
- [x] Browser verification

---

## Local scale (this machine’s cache, for design, not product copy)

On the saved library used to design v1: ~11k dated songs, ~6.3k migrations, ~4k graduations, ~2k same-day splits, longest span ~7.4 years, max 16 rooms. Those numbers must not appear in the UI as “stats.” They only justify the caps.
