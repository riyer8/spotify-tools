# Spotify Tools

**Context**
A local-first explorer for your Spotify library — what you saved, not what you played.

**Quick links**
Spec — [docs/library-experiences.md](docs/library-experiences.md), [docs/song-migration.md](docs/song-migration.md)
Experiments — [apps/](apps/)
Env — [.env.example](.env.example), [backend/.env.example](backend/.env.example)

**Graph**
`src/` — Explore, Stats, and Nights (React/Vite, [http://127.0.0.1:8888](http://127.0.0.1:8888)). Default filter is *Mine — private, no collaborators*.
`backend/` — OAuth + library cache (`npm run dev:backend`, port 8887).
`data/` — gitignored local snapshot. Never committed.

Spotify Dashboard redirect URI: `http://127.0.0.1:8888/callback`.

```bash
cp .env.example .env && cp backend/.env.example backend/.env
npm install && npm install --prefix backend
npm run dev:all
```

DEV only: `http://127.0.0.1:8888/?saved=1&page=nights` loads the saved library without logging in.

**Other apps**
Started at an EF Retreat. Each has its own README. Don’t run them on Graph’s ports.

- [apps/now-playing](apps/now-playing) — currently playing (8889)
- [apps/top-songs](apps/top-songs) — playlist of your top tracks (8888, conflicts with Graph)
- [apps/wrapped](apps/wrapped) — top artists/tracks over 6 months (3000 + 5173)
