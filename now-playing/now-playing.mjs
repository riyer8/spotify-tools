// server.mjs
import express from 'express';
import axios from 'axios';
import open from 'open';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = 8889;

const scopes = 'user-read-currently-playing';

app.get('/', (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize` +
    `?response_type=code` +
    `&client_id=${process.env.CLIENT_ID}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&show_dialog=true`;

  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REDIRECT_URI,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const access_token = tokenResponse.data.access_token;

    // Get currently playing track
    const nowPlayingResponse = await axios.get(
      'https://api.spotify.com/v1/me/player/currently-playing',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (nowPlayingResponse.status === 204 || !nowPlayingResponse.data) {
      return res.send('No song is currently playing.');
    }

    const track = nowPlayingResponse.data.item;
    const trackInfo = `
      <h1>🎵 Now Playing</h1>
      <img src="${track.album.images[0].url}" width="300"/><br/>
      <strong>${track.name}</strong><br/>
      by ${track.artists.map(a => a.name).join(', ')}
    `;

    res.send(trackInfo);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send('Something went wrong.');
  }
});

app.listen(port, () => {
  console.log(`Now Playing app running at http://localhost:${port}`);
  open(`http://localhost:${port}`);
});