import express from 'express';
import axios from 'axios';
import open from 'open';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 8888;

const scopes = 'user-top-read playlist-modify-private';

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Create Spotify Playlist</title>
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #1db954, #191414);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }

        .container {
          background-color: #121212;
          padding: 2rem 3rem;
          border-radius: 1rem;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
          max-width: 400px;
          width: 100%;
          text-align: center;
        }

        h1 {
          margin-bottom: 1rem;
          font-size: 1.5rem;
          color: #1db954;
        }

        input[type="text"],
        input[type="number"] {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: none;
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        button {
          background-color: #1db954;
          border: none;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          color: white;
          transition: background-color 0.2s ease-in-out;
        }

        button:hover {
          background-color: #17a64a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Create Your Spotify Playlist</h1>
        <form action="/login" method="GET">
          <input type="text" name="name" placeholder="Enter playlist name" required />
          <input type="number" name="limit" min="1" max="50" placeholder="Number of top tracks (1-50)" required />
          <button type="submit">Create Playlist</button>
        </form>
      </div>
    </body>
    </html>
  `);
});


app.get('/login', (req, res) => {
  const playlistName = (req.query.name || 'My Top Tracks Playlist').trim();
  const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 5, 50));
  const state = encodeURIComponent(JSON.stringify({ playlistName, limit }));

  const authUrl = `https://accounts.spotify.com/authorize` +
    `?response_type=code` +
    `&client_id=${process.env.CLIENT_ID}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&state=${state}` +
    `&show_dialog=true`;

  res.redirect(authUrl);
});


app.get('/callback', async (req, res) => {
  const code = req.query.code;
  let playlistName = 'My Top Tracks Playlist';
  let limit = 5;

  try {
    const parsedState = JSON.parse(decodeURIComponent(req.query.state || '{}'));
    playlistName = parsedState.playlistName || playlistName;
    limit = parsedState.limit || limit;
    limit = Math.max(1, Math.min(limit, 50));
  } catch (e) {
    console.warn('Invalid state received, using default values.');
  }

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

    const userProfileResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const user_id = userProfileResponse.data.id;

    const topTracksResponse = await axios.get(
      `https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const topTracks = topTracksResponse.data.items;
    const trackUris = topTracks.map(track => track.uri);

    const playlistResponse = await axios.post(
      `https://api.spotify.com/v1/users/${user_id}/playlists`,
      {
        name: playlistName,
        description: `Playlist with your top ${limit} tracks`,
        public: false,
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistResponse.data.id}/tracks`,
      { uris: trackUris },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Playlist Created</title>
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1db954, #191414);
            color: white;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          .container {
            background-color: #121212;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            text-align: center;
          }
          h2 {
            color: #1db954;
            margin-bottom: 1rem;
          }
          a.button {
            display: inline-block;
            margin-top: 1.5rem;
            background-color: #1db954;
            color: white;
            padding: 0.75rem 1.5rem;
            text-decoration: none;
            border-radius: 0.5rem;
            transition: background-color 0.2s ease-in-out;
          }
          a.button:hover {
            background-color: #17a64a;
          }
          iframe {
            width: 100%;
            height: 360px;
            margin-top: 2rem;
            border: none;
            border-radius: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🎉 Playlist "<em>${playlistName}</em>" Created!</h2>
          <a class="button" href="${playlistResponse.data.external_urls.spotify}" target="_blank">Open in Spotify</a>
          <iframe
            src="https://open.spotify.com/embed/playlist/${playlistResponse.data.id}?utm_source=generator&theme=0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send('Something went wrong during authentication or playlist creation.');
  }
});

app.listen(port, () => {
  console.log(`App running at http://127.0.0.1:${port}`);
  open(`http://127.0.0.1:${port}/`);
});