# Now Playing

Web replica of whatever is currently playing on Spotify.

Runs on **8889** so it doesn't collide with Spotify Graph (`8888`).

## Setup

```bash
cd apps/now-playing
cp .env.example .env
npm install
```

Spotify Dashboard redirect URI must match `REDIRECT_URI` in `.env` (`http://127.0.0.1:8889/callback`).

```bash
npm start
```
