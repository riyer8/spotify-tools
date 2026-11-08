# Spotify Tools

**Context**
A local-first explorer for your Spotify library — what you saved, not what you played.

**Quick links**
Spec — [docs/library-experiences.md](docs/library-experiences.md), [docs/song-migration.md](docs/song-migration.md)
Experiments — [apps/](apps/)
Env templates — [.env.example](.env.example), [backend/.env.example](backend/.env.example)

**Graph**
`src/` — Explore, Stats, and Nights (React/Vite, [http://127.0.0.1:8888](http://127.0.0.1:8888)). Default filter is *Mine — private, no collaborators*.
`backend/` — OAuth + library cache (`npm run dev:backend`, port 8887).
`data/` — gitignored local snapshot. Never committed.

## Setup

Graph will not run from a clone until both env files exist and the Spotify credentials are filled in. Copying the templates with empty values is not enough: the backend **exits on startup** if `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, or `BACKEND_PORT` are missing.

1. Create an app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Under the app’s settings, add this Redirect URI (must match `VITE_FRONTEND_LINK` exactly):

   `http://127.0.0.1:8888/callback`

3. Copy the templates, then paste the Dashboard **Client ID** and **Client Secret** into the files below:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

| File | Variable | Required | Value |
| --- | --- | --- | --- |
| `.env` | `VITE_SPOTIFY_CLIENT_ID` | yes | Client ID from the Dashboard |
| `.env` | `VITE_FRONTEND_LINK` | yes | already set — `http://127.0.0.1:8888/callback` |
| `backend/.env` | `SPOTIFY_CLIENT_ID` | yes | **same** Client ID as `VITE_SPOTIFY_CLIENT_ID` |
| `backend/.env` | `SPOTIFY_CLIENT_SECRET` | yes | Client Secret from the Dashboard (backend only) |
| `backend/.env` | `BACKEND_PORT` | yes | already set — `8887` |
| `backend/.env` | `BACKEND_LINK` | no | already set — `http://127.0.0.1:8887` (log URL only) |

4. Install and start both processes:

```bash
npm install && npm install --prefix backend
npm run dev:all
```

Open [http://127.0.0.1:8888](http://127.0.0.1:8888). Login talks to the backend on [http://127.0.0.1:8887](http://127.0.0.1:8887).

If the backend prints `Missing required env in backend/.env`, the secret/id fields are still blank. If login says it cannot reach port 8887, the backend is not running. If Spotify returns `invalid_client` or a redirect-uri mismatch, the two Client IDs differ or the Dashboard URI is not exactly `http://127.0.0.1:8888/callback`.

DEV only, no OAuth: [http://127.0.0.1:8888/?saved=1&page=nights](http://127.0.0.1:8888/?saved=1&page=nights) loads a saved local library snapshot.

**Other apps**
Started at an EF Retreat. Each has its own README. Don’t run them on Graph’s ports.

- [apps/now-playing](apps/now-playing) — currently playing (8889)
- [apps/top-songs](apps/top-songs) — playlist of your top tracks (8888, conflicts with Graph)
- [apps/wrapped](apps/wrapped) — top artists/tracks over 6 months (3010 + 5173)
