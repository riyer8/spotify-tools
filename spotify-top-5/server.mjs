import express from 'express';
import axios from 'axios';
import open from 'open';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 8888;

const scopes = 'user-top-read playlist-modify-private';

app.get('/login', (req, res) => {
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
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const access_token = tokenResponse.data.access_token;

    // Fetch user's profile to get user ID
    const userProfileResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    const user_id = userProfileResponse.data.id;

    // Fetch top 5 tracks
    const topTracksResponse = await axios.get(
      'https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=20',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const topTracks = topTracksResponse.data.items;
    const trackUris = topTracks.map(track => track.uri);

    // Create playlist
    const playlistResponse = await axios.post(
      `https://api.spotify.com/v1/users/${user_id}/playlists`,
      {
        name: 'My Top Tracks Playlist',
        description: 'Playlist created with my top 20 tracks',
        public: false,
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const playlist_id = playlistResponse.data.id;

    // Add top 20 tracks to the playlist
    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
      {
        uris: trackUris,
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Send confirmation to user
    const trackListHTML = topTracks.map(
      ({ name, artists }) => `<li>${name} by ${artists.map(a => a.name).join(', ')}</li>`
    ).join('');

    res.send(`
      <h2>Your Top 20 Playlist Was Created!</h2>
      <p><a href="${playlistResponse.data.external_urls.spotify}" target="_blank">Open Playlist on Spotify</a></p>
      <h3>Top 20 Tracks:</h3>
      <ul>${trackListHTML}</ul>
    `);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send('Something went wrong during authentication or playlist creation.');
  }
});

app.listen(port, () => {
  console.log(`App running at http://127.0.0.1:${port}`);
  open(`http://127.0.0.1:${port}/login`);
});