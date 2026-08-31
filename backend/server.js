import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Spotify Graph API — use the frontend at http://127.0.0.1:8888',
    endpoints: ['POST /api/exchange_token'],
  });
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
