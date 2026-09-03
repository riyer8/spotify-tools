# DG Queue Remix

A separate website that turns songs you already saved into a DJ mix: order, timestamps, and how each transition works. Not another playlist dump. A set.

This is the working spec. The app lives at `apps/dg-queue/` and runs on **http://127.0.0.1:8890** so it does not collide with Graph (8888), now-playing (8889), or wrapped (5173).

---

## What this is

You asked for three things, in this order:

1. A detailed plan of the work (this file).
2. A visualization of which songs play, in what order, and when they transition.
3. Remix audio, if that is actually possible.

The mix is built only from tracks in your local library snapshot (`data/library.json`). No recommendations. No “similar artists.” If a song is in the set, you claimed it.

The crate has two temperatures on purpose:

- **Nostalgic / frat** — karaoke-house songs you already own (`Don't Stop Believin'`, `Mr. Brightside`, `Sweet Caroline`, `TiK ToK`, `Party In The U.S.A.`, `I Gotta Feeling`, …). These live in rooms like `nostalgia`, `nights`, `raw`, `memories`.
- **The spike** — the industrial cluster you claimed in one sitting on 2022-02-15 into `Stanny '26 <3`: Death Grips (`Hacker`, `Three Bedrooms In A Good Neighborhood`), plus 100 gecs and JPEGMAFIA sitting next to them.

The set is a house party that knows the words, then falls through the floor, then climbs back onto the porch.

There are **six mixes** on one site. Switch crates in the header. Each is a different night from the same library.

| Mix | `#` | What it is |
| --- | --- | --- |
| **DG QUEUE** | `#dg-queue` | Frat porch → 2010s house → Death Grips spike → Queen |
| **FRIDAY NIGHT** | `#friday-night` | 2008–2015 pop from `nostalgia` / `nights` (Gaga → Katy → Miley → Avicii) |
| **CLUB** | `#club` | `nights` body: Yeah! → Low → Beyoncé → Drake → Get Lucky |
| **TEXAN** | `#texan` | Tailgate from `texan girl`: Cruise → Wallen → Shaboozey → Carrie → Thomas Rhett |
| **KARAOKE** | `#karaoke` | Your actual karaoke list, sequenced (Cardi is the dare) |
| **PORCH** | `#porch` | Everyone-sings, no trapdoor: Journey through Bohemian Rhapsody |

---

## What “DG” means here

Death Grips is an experimental hip-hop group (industrial drums, screamed vocals, no polite chorus). You only have two of their tracks. That is not enough for an all-Death-Grips mix, and it should not be. Two songs are a **spike**, not a genre night.

So this is not “Death Grips karaoke.” It is a **DJ queue remix of your songs** that uses those two tracks as the violent middle, and uses your nostalgic / frat canon as the body.

If you later mean something else by “DG,” the mix data in `apps/dg-queue/src/mix.js` is the thing to rewrite. The website stays.

---

## Evidence from the library (why these songs)

Snapshot: 131 playlists, 11,639 unique tracks. No `duration_ms`, no BPM, no preview URLs in the cache. Identity is Spotify track id + name/artists/album/`addedAt`.

**Frat / nostalgia you actually own** (not a fantasy crate):

| Song | Artist | Where it lives |
| --- | --- | --- |
| Don't Stop Believin' | Journey | `memories`, `happiness`, `freeways` |
| Mr. Brightside | The Killers | `pixie dust` |
| Sweet Caroline | Neil Diamond | `raw` |
| I Gotta Feeling | Black Eyed Peas | `nights`, `oth`, Stanny |
| TiK ToK | Kesha | `nostalgia`, `nights`, `raw` |
| Party In The U.S.A. | Miley Cyrus | `nostalgia`, karaoke list |
| Call Me Maybe | Carly Rae Jepsen | `nostalgia`, `memories`, `nights` |
| Timber | Pitbull, Kesha | `nostalgia`, `nights` |
| Turn Down for What | DJ Snake, Lil Jon | `feaberry`, `nostalgia` |
| Yeah! | Usher, Lil Jon, Ludacris | `nights`, `raw` |
| Shut Up and Dance | WALK THE MOON | `happiness`, `date` |
| Livin' On A Prayer | Bon Jovi | `feaberry`, `walk` |
| Don't Stop Me Now | Queen | `random songs to listen to` |
| Low | Flo Rida, T-Pain | `nights`, `raw` |
| Hey Ya! | OutKast | `nights`, `raw` |
| Starships | Nicki Minaj | `nostalgia` |
| Uptown Funk | Mark Ronson, Bruno Mars | `nostalgia` |
| Wake Me Up | Avicii | `nostalgia` |

You also have a private playlist literally named `nostalgia` (347 songs) and a `nights` playlist (1,030). Those are the rooms this mix is stealing from.

**Spike you actually own** (same second, same collaborative playlist):

| Song | Artist | Album | Claimed |
| --- | --- | --- | --- |
| 800 db cloud | 100 gecs | 1000 gecs | 2022-02-15 13:44:39Z |
| Baby I'm Bleeding | JPEGMAFIA | Veteran | same timestamp |
| Hacker | Death Grips | The Money Store | same timestamp |
| Three Bedrooms In A Good Neighborhood | Death Grips | Bottomless Pit | same timestamp |
| hand crushed by a mallet | 100 gecs | 1000 gecs | same timestamp |

That Feb 15 burst is 75 songs in a few minutes. We are not mixing all 75. We are taking the industrial core as the hole in the floor.

---

## The mix (v1 set)

Name: **DG QUEUE**
Runtime: **~23:20**
Form: 14 clips, two DJ decks, overlaps are the transitions.
We do **not** play songs start-to-finish. Real DJ mixes use the hook, the chorus, the drop. Each clip has a `useFromMs` / `useToMs` inside the original track, then a position on the mix timeline.

### Arc

```
PORCH          HOUSE PARTY              SPIKE                 RESCUE
Journey   →    2010s / frat peak   →    100 gecs / DG    →    Bon Jovi / Queen
karaoke        everyone knows it        floor falls out       back on the porch
```

### Order, clocks, transitions

Times are mix-clock (not song-clock). Overlaps mean both decks are live.

| # | Mix in | Mix out | Track | Vibe | How it enters | How it leaves |
| --- | ---: | ---: | --- | --- | --- | --- |
| 1 | 0:00 | 1:51 | Don't Stop Believin' — Journey | porch | Cold open on the last-chorus stretch | 15s blend on “streetlight people” |
| 2 | 1:36 | 3:38 | Mr. Brightside — The Killers | porch | Guitar riff over Journey’s last chorus | 8s phrase blend into the BA-BA-BAA |
| 3 | 3:30 | 5:11 | Sweet Caroline — Neil Diamond | porch | Crowd-hook in; this is the frat password | 12s fade-blend; good times never seemed so good |
| 4 | 4:59 | 7:04 | I Gotta Feeling — Black Eyed Peas | house | 16s house blend; night officially starts | 16s phrase match at 128bpm-ish |
| 5 | 6:48 | 8:38 | TiK ToK — Kesha | house | 2010 peak; four-on-the-floor continues | 12s blend |
| 6 | 8:26 | 10:01 | Party In The U.S.A. — Miley Cyrus | house | Echo out of Kesha (120→96 tempo drop), then the “yeah” | 10s echo out |
| 7 | 9:51 | 11:31 | Call Me Maybe — Carly Rae Jepsen | house | Filter sweep back up to 120 | 12s blend |
| 8 | 11:19 | 12:59 | Timber — Pitbull, Kesha | house | Country-frat; clap pattern | 8s blend |
| 9 | 12:51 | 14:26 | Turn Down for What — DJ Snake, Lil Jon | house | Last polite banger | **Hard cut.** Zero overlap. This is the trapdoor. |
| 10 | 14:26 | 15:46 | 800 db cloud — 100 gecs | spike | Smash cut. Glitch, no DJ manners. | 8s smash into Hacker |
| 11 | 15:38 | 18:06 | Hacker — Death Grips | spike | The title event. Hard body. | 12s same-artist grind into Three Bedrooms |
| 12 | 17:54 | 19:29 | Three Bedrooms In A Good Neighborhood — Death Grips | spike | Second DG punch, dirtier | 16s rescue blend (the joke) |
| 13 | 19:13 | 21:23 | Livin' On A Prayer — Bon Jovi | rescue | Industrial dust into a song everyone can scream | 12s lift |
| 14 | 21:11 | 23:20 | Don't Stop Me Now — Queen | rescue | Hands up, no more tricks | 10s fade to black |

### Why this order (DJ logic, not taste-ranking)

- Open with Journey because the room has to *agree* it is a mix. If they sing, you have them.
- Brightside then Caroline is the two-song frat handshake. Skip either and it feels like a Spotify radio.
- 2010s block (Kesha → Miley → Carly → Pitbull) is your actual `nostalgia` playlist DNA, not a generic “party” stereotype.
- Turn Down for What is the last song that still belongs at a house party. Cutting it dead is the point.
- 100 gecs is the airlock. You cannot go Journey → Death Grips; the room will reject it. Gecs is already cartoon-violent and you saved it in the same second as Hacker.
- Hacker is the peak. Three Bedrooms is the second hit so DG is not a cameo.
- Bon Jovi after Death Grips is the mix’s thesis: this library contains both, and they were allowed to touch. Queen is the lights-up.

### Transition types we will mark on the timeline

| Type | What you see | Typical length |
| --- | --- | --- |
| `cold-open` | One deck only, no incoming overlap | 0 |
| `blend` | Both decks live, volumes cross | 8–16s |
| `echo-out` | Outgoing repeats/tails while incoming is filtered in | ~10s |
| `filter-sweep` | Incoming starts high-passed, opens to full | ~12s |
| `hard-cut` | Instant swap, no overlap | 0 |
| `smash` | Overlap but no polite EQ; both at full for a moment | ~8s |
| `rescue-blend` | Long overlap from spike → porch; the gear change | ~16s |
| `fade` | End of set | ~10s |

---

## The website (what you will actually see)

Separate app, not a new tab inside Graph. Visual language: black booth, gold for porch/house, red for the spike. Not a Wrapped card. Not a spreadsheet.

### Screens / regions (single page)

1. **Header** — title `DG QUEUE`, runtime, play/pause, mix clock.
2. **Now / next** — giant current title, next title, countdown to the next transition (`TRANSITION IN 0:08`).
3. **Two-deck timeline** — Deck A and Deck B as stacked lanes. Clips are bars. Overlaps are the only places both lanes are filled. A white playhead scrubs. Click a bar or the ruler to jump.
4. **Transition callouts** — chips on the overlap regions: `HARD CUT`, `15s BLEND`, `RESCUE`, etc. Clicking one opens the note (which lyric/drop it hangs on).
5. **Set list** — numbered 1–14, vibe tags, playlist rooms the song was stolen from, Spotify link.
6. **Audio honesty panel** — see next section. Always visible, never a footer surprise.

### Interactions to verify

- Play walks the playhead in real time and updates now/next.
- Pause freezes the clock.
- Clicking the timeline jumps the clock.
- Clicking a song in the set list jumps to its `mixIn`.
- Spike clips are visually a different temperature than frat clips.
- Overlaps are readable (two bars stacked, not a mystery gradient).
- Works at desktop width; at mobile, the timeline scrolls horizontally rather than crushing the labels.

### What we will not build in v1

- Spotify OAuth inside this app (Graph already owns that).
- Auto-generating a real Spotify playlist (easy later; not the visualization).
- LLM-written “set recap” prose.
- A force-directed graph.
- Mixing the full 11k-track library.

---

## Can I make the remix audio myself?

**Short answer: I cannot give you a finished MP3 of this mix using the real recordings.**

Why, specifically:

- Your snapshot has metadata (title, artist, when you saved it). It does not have audio files.
- There are **zero** `.mp3` / `.wav` / `.flac` files in this repo.
- Spotify does not hand out full tracks for us to chop, time-stretch, or bounce. Dragging audio off Spotify to remix it is not something this project will do.
- iTunes 30-second previews exist for *some* pop tracks and failed for Death Grips / JPEGMAFIA when we looked them up. A mix of random 30s clips is not this set.

What I **can** do, and what v1 ships:

| Deliverable | Status |
| --- | --- |
| Designed queue (order, in/out points, transition types) | Yes — `mix.js` |
| Website that visualizes the mix clock | Yes — this app |
| Simulated playback (playhead walks the 23:20 map) | Yes |
| A studio Death Grips remix (new drums, chopped vocals, bounced WAV) | No — no stems, no legal audio |
| A DJ software session (Serato/Rekordbox) you can load files into | Not v1; the map is the cue sheet if you ever have the files |
| Spotify playlist in this exact order | Possible later with existing OAuth; still not a *mix*, just a queue |

If you later put local audio files in a folder, a second pass can use Web Audio / ffmpeg to actually crossfade those files according to this same map. That is a different job and needs the files.

So: I can make the **remix as a score**. I cannot perform the recordings.

---

## Architecture

```
docs/dg-queue-remix.md          ← this spec
apps/dg-queue/
  package.json                  vite + react, port 8890
  index.html
  src/main.jsx
  src/App.jsx                   page chrome, clock, play/pause
  src/App.css                   booth visual language
  src/mix.js                    THE SET (source of truth)
  src/Timeline.jsx              two-deck visualization + playhead
  src/SetList.jsx               numbered tracks + rooms
```

No backend. No env file. The mix is compiled into the frontend because it is a authored set, not a live query. If the library snapshot changes, we re-author `mix.js`; we do not auto-pick “top party songs.”

Graph remains untouched. This follows the `apps/` experiment pattern (own package, own port, own README line).

### Mix data shape

```js
{
  id, spotifyId, title, artists, album, rooms,
  vibe,            // 'porch' | 'house' | 'spike' | 'rescue'
  bpm,
  durationMs,      // full original (best-known length)
  useFromMs, useToMs,
  mixInMs, mixOutMs,
  deck,            // 'A' | 'B'
  transitionIn,    // { type, durationMs, note }
  transitionOut,
}
```

`durationMs` is not in the library cache. v1 uses well-known catalog lengths so the map can exist. They are good enough for a cue sheet; they are not frame-accurate against a specific master.

---

## Visual language

| Token | Use |
| --- | --- |
| Void `#07070a` | Booth background |
| Gold `#e4b84a` | Porch + house clips, nostalgic temperature |
| Red `#ff2a2a` | Spike clips (Death Grips / gecs / JPEG) |
| Cream `#f4efe4` | Rescue clips, lights-up |
| White playhead | Now |
| Dim gray labels | Mix ruler (minutes) |

Typography: huge condensed titles for the current song, monospace for clocks, small caps for transition chips. No Spotify green except the outbound “open in Spotify” link, so this does not look like Graph.

---

## Implementation order

1. This spec.
2. `mix.js` with the 14-clip set and timestamps above.
3. Timeline visualization (decks, overlaps, playhead, scrub).
4. Now/next + set list + Spotify links.
5. Honesty panel for audio.
6. `npm install` + `npm run dev` on 8890.
7. Browser pass: play, scrub, click each vibe, confirm overlaps and the hard cut at 14:26.

---

## Acceptance (v1 is done when)

- [ ] This document exists and describes the set, the site, and the audio limit.
- [ ] `apps/dg-queue` is a runnable website on 8890.
- [ ] All 14 songs are yours (Spotify ids from `library.json`).
- [ ] The page shows order **and** mix-clock times **and** transition types.
- [ ] Deck overlaps are visible; the 14:26 hard cut is visible as a gapless swap with no overlap bar.
- [ ] Playhead playback works without any audio files.
- [ ] The page states clearly that full remix audio is not generated.
- [ ] Spike vs frat is visually distinct.
- [ ] Browser-verified, not just “it compiled.”

---

## Later (not required to finish v1)

- One-click “save this order as a Spotify playlist” via Graph’s existing OAuth.
- Import local files and bounce a real mix from this cue sheet.
- Alternate crates: country-frat (`texan girl` + Florida Georgia Line `Cruise`), or a `nostalgia`-only 2014 mix with no spike.
- BPM-true warping if we ever fetch audio features.

---

## Direct answers

**Can it be a separate app?** Yes. `apps/dg-queue`.

**Do you get a website?** Yes. Open 8890.

**Which songs, what order, when to transition?** The table in “The mix (v1 set)” and the live timeline.

**Can I make the remix audio?** I can author the mix and animate it. I cannot bounce the real tracks without the audio files, which we do not have and will not rip from Spotify.
