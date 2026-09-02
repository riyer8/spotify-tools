# Spotify Tools

Personal playground for Spotify experiments. The main app lives at the repo root. Smaller one-off tools live in [`apps/`](apps/).

```
├── src/                 Spotify Graph (React + Vite)
├── backend/             OAuth token exchange + library cache
├── data/                gitignored local library snapshot
├── docs/                product specs
└── apps/                other experiments (now-playing, top-songs, wrapped)
```

Personal library data (`data/library.json`) is never committed.

---

## Spotify Graph

The product. Log in, load your playlists, then:

- **Explore** — playlist and artist rankings from what you actually saved
- **Stats** — library-wide counts and breakdowns
- **Nights** — sittings reconstructed from playlist `added_at` timestamps (saves, not plays)

Default filter is *Mine — private, no collaborators*. The library is cached locally and refreshed incrementally when a playlist `snapshot_id` changes.

![Login](src/assets/v2.gif)

### Run it

Spotify Dashboard: create an app, then add redirect URI `http://127.0.0.1:8888/callback`.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
# fill in client id + secret
```

```bash
npm install
npm install --prefix backend
npm run dev:all
```

That starts the backend on `http://127.0.0.1:8887` and the app on `http://127.0.0.1:8888`.

Or in two terminals:

```bash
npm run dev:backend   # :8887
npm run dev           # :8888
```

In DEV only, `http://127.0.0.1:8888/?saved=1&page=nights` loads the saved library without logging in.

### Graph stack

React, Vite, Express. Spotify Web API. Spec for Nights and the next three experiences: [docs/library-experiences.md](docs/library-experiences.md).

---

## Other apps

Started at an EF Retreat. Each has its own README and `.env.example`. Don't run them on the same ports as Graph.

| App | What it does | Port |
| --- | --- | --- |
| [now-playing](apps/now-playing) | What's playing right now | 8889 |
| [top-songs](apps/top-songs) | Playlist of your top tracks | 8888 (conflicts with Graph — run alone) |
| [wrapped](apps/wrapped) | Top artists / tracks over 6 months | backend 3000, frontend 5173 |

---

## Privacy

`.env` files and `data/library.json` are gitignored. Logout clears `localStorage`; it does not delete the on-disk cache.
