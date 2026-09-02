# Library experiences

Four products built on playlist membership plus `addedAt` (the moment a song was claimed, not played). Wrapped already owns listening. These own **curation**.

This document is the spec. Implementation order is 1 → 2 → 4 → 5. **Night is the only experience this goal ships.** Migration, Time capsule, and Graveyard are specified here so later work can proceed without re-deciding product, data, or visual language.

---

## Shared foundations

### What the cache actually contains

Each library snapshot (`data/library.json` locally, plus `localStorage`) looks like:

```
{
  userId,
  fetchedAt,
  playlists: [{ id, name, owner, public, collaborative, snapshotId }],
  tracksByPlaylistId: {
    [playlistId]: [{ id, name, artists: [{ id, name }], album: { name } | null, addedAt }]
  }
}
```

`addedAt` is an ISO-8601 UTC timestamp from Spotify (`item.added_at`). It can be `null` on very old playlists. Album is name-only. There is no play count, no audio features, no lyrics, no genre unless we fetch more later.

The active playlist filter in the header still applies. Every experience reads `filteredPlaylists` + `library.tracksByPlaylistId`, never the unfiltered library, so “Mine — private” nights are not mixed with followed editorial playlists.

### Flattened event model

All four experiences start from the same flattened list, derived in a pure module (no React):

```
LibraryEvent = {
  trackId,          // Spotify track id (may be null for local files)
  name,
  artists,          // [{ id, name }]
  artistKey,        // "A, B"
  albumName,
  playlistId,
  playlistName,
  addedAt,          // Date
  addedAtMs
}
```

Skip events with missing `name` or missing/invalid `addedAt`. Local-file tracks without ids still participate if they have a name + date (use `name + artistKey` as a fallback identity).

Identity for “same song” across playlists:

1. Prefer `trackId` when present.
2. Else `normalized(name) + artistKey`.

Do not use playlist-specific row identity for Migration; a song living in two playlists is one song with two claim events.

### Information architecture

Keep the existing shell: sticky header, playlist filter, cache badge, refresh, log out.

Add a third top-level tab beside Explore and Stats. For this goal the tab is **Nights**. Later tabs (or a single **Stories** menu) can host Migration, Capsule, Graveyard without redesigning the shell.

```
[ Spotify Graph ]   [ Explore | Stats | Nights ]   [ filter · cache · refresh ]   [ Log out ]
```

Header is already crowded on small screens (filter wraps, cache badge hides). Nights must still work when the badge is hidden. The Nights page itself is full-bleed inside `app-main` (same as Explore/Stats).

Do not add React Router for v1. Continue using `page` state in `App.jsx`. Deep-linking can come later.

### Visual language (all four)

These are not extra Stats panels. They should feel like walking into a room.

| Token | Use |
| --- | --- |
| Void black `#07070a` → `#121212` | Experience backgrounds, darker than Explore |
| Spotify green `#1db954` | Accents, “now”, primary CTA |
| Warm amber `#f59b23` | Time, clocks, late-night |
| Soft violet `#b49bc8` | Playlists as places |
| Ice blue `#509bf5` | Artists, migration paths |
| Muted `#b3b3b3` | Secondary copy |
| Circular / Helvetica Neue | Existing type. Display lines can go oversized and tight. |

Motion: 200–500ms ease, no endless loops that fight reading. Prefer one strong animated entrance per night (stars appearing in add-order) over constant particle noise.

Each experience has:

- A **hero** (the feeling)
- A **cast** (songs, playlists, artists that are real)
- A **way out** (back to the list / another item)
- Empty, loading, and “not enough data” states that are designed, not leftover Explore empty-state clones

### Empty / gated states (shared)

1. **Library still loading** — do not mount the experience; existing load overlay is enough.
2. **No `addedAt` values** — copy: dates did not come down; prompt Refresh. Common on a cache from before `addedAt` existed.
3. **Filter too tight** — same pattern as Explore (“No playlists match this filter”).
4. **Not enough signal** — experience-specific (e.g. no night with ≥ N tracks). Still show the quieter sessions rather than a dead end when possible.

### File layout (planned)

```
docs/library-experiences.md          this spec
src/experiences/
  events.js                          flatten + identity helpers
  nights.js                          sessions, scoring, narrative
  nights.test-fixtures.js            optional later
  migration.js                       (later)
  capsule.js                         (later)
  graveyard.js                       (later)
src/Nights.jsx                       Night page
src/Nights.css                       Night visuals
src/Migration.jsx                    later
src/Capsule.jsx                      later
src/Graveyard.jsx                    later
```

Keep clustering/narrative **pure functions** so they can be reasoned about without the DOM. Components only render.

### What we will not do in Night v1

- No LLM copy. Narrative is templated from real fields so it cannot hallucinate a playlist that was not involved.
- No Spotify playback SDK. Optional: “Open in Spotify” links and/or official embed iframes for the opening / turn / last song.
- No new backend routes. Night is computed client-side from the library already in memory.
- No writes back to Spotify (we do not create playlists or reorder anything).

---

## 1. Night — “A night you became someone else”

### Product

A cinematic index of **curation sessions**: bursts of adding songs close together in time. The user can pick a night and watch it happen — first song, the turn, the last song — with the actual timestamps and the playlist those songs went into.

This is not “your most-played Tuesday.” It is “the sitting when you decided who you were.”

Primary feeling: late, specific, a little voyeuristic toward your past self.

### Session definition

Sort all valid events by `addedAtMs` ascending (stable sort: time, then playlist name, then track name).

Walk the sorted list. Start a new session when:

```
event.addedAtMs - previous.addedAtMs > SESSION_GAP_MS
```

**`SESSION_GAP_MS = 90 minutes`.** Rationale: playlist adding is bursty; 90 minutes still groups a sitting that included a snack or a context switch, but splits two distinct evenings.

Do **not** cluster per-playlist. Adding to three playlists in one hour is one night (identity in flux). Adding only to one playlist is also one night (deep mood). Both are first-class.

A session object:

```
NightSession = {
  id,                 // `${firstMs}-${lastMs}-${count}` (stable enough for UI keys)
  events,             // chronological LibraryEvent[]
  start, end,         // Date
  durationMs,
  trackCount,
  uniqueTrackCount,   // same song added twice still counts in trackCount
  playlistCounts,     // Map playlistId -> count
  primaryPlaylist,    // playlist with the most adds (tie: earliest)
  playlistShare,      // primary count / trackCount
  artistCounts,
  topArtists,         // top 5
  hourLocal,          // local hour of the median event
  isLateNight,        // median hour in [21, 23] U [0, 4]
  weekday,            // local weekday name
  density,            // trackCount / max(durationMs, 1 minute) * 60_000  (tracks per minute)
  score,
  beats               // { opening, turn, last, peakWindow }
}
```

Minimum size to appear in the **featured** list: **`MIN_FEATURED_TRACKS = 8`**. Smaller sessions still exist in an “afterglow” / quieter list so a small library is not empty.

If there are zero sessions ≥ 8, promote the top 5 by score anyway (with copy that these were quieter sittings). Never show a blank page when any dated adds exist.

### Scoring (who is “the” night)

```
score =
    trackCount                          * 3
  + log2(1 + durationMinutes)           * 2
  + density                             * 8
  + (isLateNight ? 18 : 0)
  + (playlistShare >= 0.7 ? 10 : 0)     // obsession bonus
  + (playlistCount >= 3 ? 8 : 0)        // flux bonus (not stacked with obsession)
  + uniqueArtistCount * 0.4
```

Obsession and flux are mutually exclusive bonuses so a night is characterized, not double-paid.

Sort featured nights by `score` desc, then `start` desc.

Default selection: highest score. Remember last selected `id` in component state only (not localStorage) so refresh of data can re-pick.

### Narrative beats (templated, not generated)

Compute from the event list. Do not invent causal stories (“you were heartbroken”). The copy names facts and lets the user feel the implication.

**Opening** — first event, plus the next two if they fall within 10 minutes.

**Turn** — first of:

1. The event where the running primary playlist loses the lead (destination changed).
2. Else the event where the artist is new to this session and the previous 3 events were the same artist (break in a streak).
3. Else the midpoint event by index.

**Last** — final event.

**Peak window** — 20-minute window with the most adds (sliding). If duration < 20 minutes, the whole session is the peak.

Story block, assembled from parts (omit a sentence if its data is missing):

```
{weekday} {month} {day}, {year}
{startTime} → {endTime}  ·  {durationHuman}  ·  {trackCount} songs

You started with “{opening.name}” by {opening.artist} in {opening.playlist}.
{If playlistShare >= 0.7:} Almost everything went into {primaryPlaylist}.
{Else:} The night moved between {playlistNames, up to 3}.
{If turn.kind === playlist:} Around {turnTime} the destination shifted to {turn.playlist}.
{If turn.kind === artist:} “{turn.name}” broke a {streakArtist} run.
You left on “{last.name}” at {lastTime}.
```

Tone: second person, short sentences, no slang pile-up, no emoji in the story body. UI chrome can be warmer.

### Visual design — Night page

The page is a **split stage**, not a dashboard grid.

```
┌──────────────────────────────────────────────────────────────────┐
│  LEFT RAIL (~280px)          STAGE (flex)                        │
│  “Nights”                    ┌─────────────────────────────────┐ │
│  12 sittings worth           │  DATE as display type            │ │
│  remembering                 │  Tuesday night · 1:13am          │ │
│                              │                                 │ │
│  [ ★  Mar 15, 2024 ]         │     CLOCK CONSTELLATION         │ │
│    47 songs · 2h 11m         │     (SVG, add-order draw-in)    │ │
│    into Heartbreak           │                                 │ │
│                              │  story paragraph                 │ │
│  [   Jan 3, 2023  ]          │                                 │ │
│    22 songs · 54m            │  OPENING / TURN / LAST cards     │ │
│                              │  + meteor timeline of every add  │ │
│  quieter                     │                                 │ │
│  [  6 songs … ]              └─────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

#### Left rail

- Sticky inside the page (not the app header).
- Each row: local date, song count, duration, primary playlist name, a late-night moon mark if `isLateNight`.
- Selected row: violet/green left bar, slightly brighter.
- Keyboard: `j` / `k` or arrows move selection. Visible focus ring.

#### Stage hero

- Enormous date (`3.5–4.5rem`), then a single line of meta in amber.
- Background: radial gradient (deep indigo at the clock, black at the edges) plus a faint noise overlay (CSS). No stock photos.

#### Clock constellation (the graphic that must not look like a bar chart)

SVG circle representing 24 hours **or** a 12-hour night arc if the session is contained in 18:00–06:00 (choose night-arc when `isLateNight` and duration ≤ 10h).

- Outer ring = clock.
- Each event is a star (small circle) at the angle of its local time: `angle = (hours + minutes/60) / 24 * 360 - 90` (0 at 12 o’clock).
- Radius jitter by playlist index so two adds in the same minute do not stack invisibly (`r = base + playlistIndex * 6`).
- Draw a polyline through stars in chronological order (the constellation). Stroke opacity ~0.35, stars fill by playlist color (hash playlistId into the existing RANK_COLORS / playlist violet + green + amber + blue).
- Entrance: stars appear in add-order, 20–40ms apart, capped so a 200-song night still finishes in ~2s. Constellation line draws via `stroke-dashoffset`.
- Hover/focus a star: tooltip with time, song, playlist; dim the others.
- Center label: duration and count, e.g. `47` / `songs`.

This is the hero graphic. It should work at 320px (smaller clock) and 1200px.

#### Beat cards

Three cards in a row on desktop, stack on mobile: **Opening**, **The turn**, **You left**.

Each card:

- Label in tiny caps
- Local time
- Song title (weight 700)
- Artist
- Playlist as a violet pill
- “Open in Spotify” if `trackId` exists (`https://open.spotify.com/track/{id}`)

Clicking a card also scrolls/highlights that event in the meteor list.

#### Meteor timeline

Vertical list of every add in the session.

- Left: `1:13a` in amber monospace-ish tabular numbers
- A vertical thread with a dot; denser clusters = dots closer (this is real time spacing, min-gap so labels never overlap)
- Title · artist
- Playlist pill

Time spacing: map `addedAtMs` to y-position with a minimum row height (~44px) so a 2-second double-add still readable. True-time mode can be a toggle later; v1 is readable first, with a thin “gap” marker when more than 15 minutes passed between adds (`+18m`).

#### Cast strip

Top artists that night as compact chips under the story. Not a ranked bar chart.

### Interaction

| Input | Result |
| --- | --- |
| Click rail row | Select night, replay constellation entrance |
| `j` / `↓` | Next night |
| `k` / `↑` | Previous night |
| Click star or meteor row | Highlight that event everywhere |
| Open in Spotify | New tab |
| Playlist filter change | Recompute sessions; keep selection if still present, else top score |
| Refresh library | Recompute; existing load overlay |

### Edge cases

| Case | Behavior |
| --- | --- |
| `addedAt` missing on many tracks | Ignore those tracks; if none remain, empty state asking for Refresh |
| Duplicate adds of same song in one session | Keep both events (you claimed it twice / two playlists) |
| Collaborative playlists | Still included if the filter includes them; we do not yet store `added_by`, so do not claim “you” vs collaborator in copy. Use “this library” if collaborative playlists are in the set |
| Session spans midnight | Date label uses the start date; meta shows `11:40p → 1:05a` |
| DST | Use local timezone via `Intl`; do not hand-roll offsets |
| 200+ song sitting | Virtualize meteor list if `events.length > 80`; clock still plots all stars |
| All sessions tiny | Show them under “Quieter sittings” with honest copy |
| No dated events | Dedicated empty: “Nights need the date you added each song. Refresh the library to pull dates from Spotify.” |

### Accessibility

- Clock stars are also a list in the DOM (visually the SVG, plus the meteor list as the accessible chronology). Do not make SVG the only way to read the night.
- `prefers-reduced-motion`: skip staggered star entrance; show final constellation immediately.
- Contrast: amber on black for times; titles stay white.
- Rail selection is `aria-current`. Stage has an `h1` with the date.

### Performance

Flatten + cluster is O(n log n) for n dated events (likely thousands, not millions). Memoize on `filteredPlaylists` + `tracksByPlaylistId`. Do not recluster per keystroke.

### Night v1 acceptance (this goal)

Night is done when all of the following are true on the local site:

1. A **Nights** tab exists in the app header beside Explore and Stats.
2. Sessions are clustered with the 90-minute gap across all filtered playlists.
3. Featured vs quieter lists follow the thresholds above; the page is never blank if any dated adds exist.
4. Selecting a night shows: display date, clock constellation, templated story, opening/turn/last cards, meteor timeline, artist chips.
5. Stars and timeline use real timestamps and real playlist names.
6. Empty, no-dates, and filter-mismatch states are designed.
7. `prefers-reduced-motion` is respected.
8. Desktop and a mobile-width layout both work (rail becomes a horizontal chip scroller on small screens).
9. Verified in the browser against the running app (or documented blocker if login/cache is unavailable).

---

## 2. Song migration — “this song graduated”

### Product (later)

A song-first experience: tracks that were claimed in **more than one playlist at different times**. Each is a life moving through rooms.

Primary feeling: recognition. “Oh — that song left the gym.”

### Data

From flattened events, group by song identity (`trackId` or fallback key). Keep groups with **≥ 2 distinct playlistIds**.

For each group:

```
Migration = {
  song,
  claims: [{ playlistId, playlistName, addedAt }] sorted by time,
  spanMs,           // last claim - first claim
  hops,             // claims.length - 1
  path              // playlist names in order (collapse consecutive same playlist)
}
```

If the same song was added twice to the same playlist (rare), keep both claims but collapse consecutive same-playlist hops in the path label.

Sort migrations by `spanMs` desc (slowest transformations first) with a secondary sort on `hops`. Surface a “quick hops” slice (same song, two playlists, < 30 days) separately — those feel different (sorting, not becoming).

### Narrative

```
“{song}” by {artist}
First claimed in {first.playlist} on {first.date}.
{n} later, it showed up in {second.playlist}.
{If 3+:} Then {third.playlist} ({third.date}).
```

Do not infer mood from playlist names beyond quoting them. The user’s naming is the joke/the ache.

### Visual (later)

- Full-width **river**: playlists as labeled banks (columns in chronological order of that song’s life, or a global playlist-time layout).
- Each migration is a colored bezier from bank to bank; opacity by how unique the path is.
- Selecting one song dims others and writes the story in a dock.
- Alternate view: pick a playlist (“gym”) and see outbound arrows (songs that left) vs inbound (songs that arrived from elsewhere). That is the “room” view.

Hero graphic: one song’s path as a bold stroke; the rest of the library as hairlines.

### Edge cases

- Song in 12 playlists: cap visible hops at 6 + “and n more”.
- Same date across playlists (bulk add): treat as a split, not a graduation; copy: “claimed in two places the same day.”
- Filter changes the available rooms; recompute.

### Acceptance (when this experience is built)

Dedicated page or tab; at least one song-path visualization that is not a table; story dock; empty state when no song appears in two playlists; uses filtered library.

---

## 4. Time capsule — “who I was in March 2021”

### Product (later)

A walkable history of the library **as it was claimed**, using `addedAt` as brick-laying time. Scrub a timeline; rooms (playlists) fill with stars.

This does **not** require snapshot history. It reconstructs growth from current membership: a song only appears after its `addedAt`. Deleted songs cannot appear here (that is Graveyard).

Primary feeling: walking forward through your own taste.

### Data

- Global t0 = min `addedAt`, t1 = max `addedAt`.
- Playlists as rooms ordered by **their own first claim** (birthday).
- At scrub time T, a playlist is visible if it has ≥1 event with `addedAt <= T`. Tracks inside it appear when `addedAt <= T`.

Derived marks on the timeline:

- Quiet years (few claims)
- Flood days (reuse Night sessions: session starts as tick marks)
- Playlist birthdays

### Visual (later)

- Horizontal **era scroller** (year ticks, month ticks when zoomed).
- Stage: a floor plan / skyline of playlist rooms. Empty frames until their birthday, then they populate.
- Playhead T as a lantern. Dragging it replays growth. A “Walk the year” button auto-scrubs at readable speed with reduced-motion opt-out.
- Click a room at time T: see the tracks that existed then (not the future ones).

Optional later: compare two playheads (then vs now) as a dissolve.

### Edge cases

- Playlists with all-null `addedAt`: room exists but is “undated” and excluded from scrub, listed aside.
- Very long span (2012–2026): default zoom to last 3 years with a jump-to-era control.
- Performance: do not re-render thousands of DOM nodes per scrub frame; canvas or aggregated counts while dragging, full detail on release.

### Acceptance (when built)

Scrubber changes visible tracks/rooms using `addedAt`; at least one spatial layout of playlists-as-places; playhead time is visible; empty undated state handled.

---

## 5. Graveyard — “songs you loved enough to save, then removed”

### Product (later)

The only experience that **cannot** be computed from a single Spotify pull. Spotify does not return deletions. Graveyard is the difference between snapshots we already keep locally.

Primary feeling: tender, slightly haunted. Not a shame list.

### Data architecture (must exist before the page is interesting)

Today we overwrite `data/library.json` and `localStorage` with the latest slim library. Graveyard needs history.

Plan (implement with the experience, not in Night):

1. Keep the current snapshot as-is (latest).
2. On each successful persist, before overwrite, **diff** previous vs next:
   - For each `playlistId` still present: tracks in previous `tracksByPlaylistId[id]` whose identity is absent in next.
   - For deleted playlists: every track in that playlist becomes a tombstone (playlist gone).
3. Append tombstones to `data/library-graveyard.json` (gitignored, same as the snapshot) and a `localStorage` key `spotify_graph_graveyard_v1`.

```
Tombstone = {
  trackId, name, artists, albumName,
  playlistId, playlistName,
  addedAt,          // when they originally claimed it, if known
  lastSeenAt,       // previous snapshot fetchedAt
  removedAt,        // next snapshot fetchedAt (we only know the window)
  reason            // 'track-removed' | 'playlist-removed'
}
```

Dedupe: same `(track identity, playlistId)` — keep the first burial; do not stack refreshes.

If a song returns to the same playlist later, **exhume**: drop that tombstone (it was a temporary removal). Graveyard is for things that stay gone *as of the latest snapshot*.

First-run empty state is expected and should be beautiful: “Nothing has died here yet. Refresh after you remove a song and it can appear.”

Also gitignore `data/library-graveyard.json`.

### Visual (later)

- Dark field of **headstones**: each tombstone a small slab with song title, playlist it was buried from, and the removal window (“gone sometime after Mar 2026”).
- Group by playlist as plots in a cemetery, or by year of original `addedAt` as rings of age.
- Hover: the original claim date vs the burial window.
- No red “deleted” chrome. Pale stone, moss green accent, slow fade-in.

### Edge cases

- User clears localStorage and deletes the graveyard file: history is gone. Copy should not pretend otherwise.
- Filter: graveyard items whose playlist was “followed” should respect the current filter using stored `playlistId` / ownership if we snapshot owner flags onto the tombstone (store `playlistPublic`, `ownerId` at burial time).
- Local files / missing ids: identity fallback as elsewhere.

### Acceptance (when built)

Tombstones persist across refreshes; a removed-then-still-gone track appears; a removed-then-restored track does not; empty cemetery is designed; files gitignored.

---

## Implementation order

| Step | Ship | Notes |
| --- | --- | --- |
| 0 | This spec | `docs/library-experiences.md` |
| 1 | Night (full product) | Events helper + nights clustering + Nights page + header tab |
| 2 | Migration | Reuse `events.js` |
| 3 | Time capsule | Reuse events + night session ticks as flood markers |
| 4 | Graveyard | Snapshot diff + gitignored history file + cemetery UI |

Night must not pretend to be the other three. No half-built Migration UI behind a flag in this goal.

---

## Out of scope for all four (unless a later spec says otherwise)

- Writing playlists back to Spotify
- Listening history / Wrapped clones
- Social sharing cards (nice later)
- LLM narration
- Public deployment

---

## Night engineering checklist

- [ ] `src/experiences/events.js` — `flattenLibraryEvents(playlists, tracksByPlaylistId)`
- [ ] `src/experiences/nights.js` — cluster, score, beats, `buildNightStory(session)`
- [ ] `src/Nights.jsx` — rail + stage
- [ ] `src/Nights.css` — constellation, meteor, reduced-motion
- [ ] `src/App.jsx` — `page === 'nights'` tab
- [ ] Empty / no-dates / quiet-library states
- [ ] Mobile: rail as horizontal scroller
- [ ] Keyboard j/k
- [ ] Browser verification
