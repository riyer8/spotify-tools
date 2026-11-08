# Wrapped

Top 20 artists and tracks for Spotify’s medium-term window (about the last 6 months, roughly since April). Ranked by affinity, not play count.

Two processes: Express on **3010**, Vite on **5173**. Port 3000 is left free.

## Setup

```bash
cd apps/wrapped/backend
cp .env.example .env
npm install
npm start
```

```bash
cd apps/wrapped/frontend
npm install
npm run dev
```

Spotify Dashboard redirect URI must match `REDIRECT_URI` (default `http://127.0.0.1:3010/callback`).
