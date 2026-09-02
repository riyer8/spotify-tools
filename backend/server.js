import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const LIBRARY_PATH = path.join(DATA_DIR, 'library.json');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Spotify Graph API — use the frontend at http://127.0.0.1:8888',
    endpoints: ['POST /api/exchange_token', 'GET /api/library-cache', 'PUT /api/library-cache'],
  });
});

app.get('/api/library-cache', async (_req, res) => {
  try {
    const raw = await fs.readFile(LIBRARY_PATH, 'utf8');
    res.type('json').send(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'No library cache' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to read library cache' });
  }
});

app.put('/api/library-cache', async (req, res) => {
  const library = req.body;
  if (!library || !Array.isArray(library.playlists) || typeof library.tracksByPlaylistId !== 'object') {
    return res.status(400).json({ error: 'Invalid library cache' });
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(LIBRARY_PATH, `${JSON.stringify(library, null, 2)}\n`, 'utf8');
    res.json({ ok: true, path: 'data/library.json' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save library cache' });
  }
});

app.post('/api/exchange_token', async (req, res) => {
  const { code, redirect_uri } = req.body;

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to exchange code for token' });
  }
});

app.listen(process.env.BACKEND_PORT, () => console.log(`Backend listening on ${process.env.BACKEND_LINK}`));
