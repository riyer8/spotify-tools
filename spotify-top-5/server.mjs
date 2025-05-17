import express from 'express';
import axios from 'axios';
import open from 'open';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 8888;

const scopes = 'user-top-read';

app.get('/login', (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize` +
    `?response_type=code` +
    `&client_id=${process.env.CLIENT_ID}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}`;
    
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
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const access_token = tokenResponse.data.access_token;

    // Fetch Top Tracks
    const topTracksResponse = await axios.get(
      'https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const formatted = topTracksResponse.data.items.map(
      ({ name, artists }) =>
        `${name} by ${artists.map(artist => artist.name).join(', ')}`
    ).join('<br>');

    res.send(`<h2>Your Top 5 Tracks</h2><p>${formatted}</p>`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send('Something went wrong during authentication or fetching data.');
  }
});

app.listen(port, () => {
  console.log(`App running at http://127.0.0.1:${port}`);
  open(`http://127.0.0.1:${port}/login`);
});