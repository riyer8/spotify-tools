# Wrapped

Finds your top artists and tracks over the last 6 months. Still in progress.

Two processes: Express on **3000**, Vite on **5173**.

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

Spotify Dashboard redirect URI must match `REDIRECT_URI` (default `http://127.0.0.1:3000/callback`).
