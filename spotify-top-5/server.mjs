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

        input[type="text"] {
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
          <button type="submit">Create Playlist</button>
        </form>
      </div>
    </body>
    </html>
  `);
});


app.get('/login', (req, res) => {
  const playlistName = req.query.name || 'My Top Tracks Playlist';
  const state = encodeURIComponent(playlistName); // pass name as "state" param

  const authUrl = `https://accounts.spotify.com/authorize` +
    `?response_type=code` +
    `&client_id=${process.env.CLIENT_ID}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&state=${state}` +  // use state to pass playlist name
    `&show_dialog=true`;

  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const playlistName = decodeURIComponent(req.query.state || 'My Top Tracks Playlist');

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
      'https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5',
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
        description: 'Playlist with your top 5 tracks',
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

    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
      { uris: trackUris },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Build the styled HTML response
    const trackList = topTracks.map(
      ({ name, artists }) =>
        `<li>${name} <span>by</span> ${artists.map(a => a.name).join(', ')}</li>`
    ).join('');

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
            padding: 2rem 3rem;
            border-radius: 1rem;
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
          }
          h2 {
            color: #1db954;
            margin-bottom: 1rem;
          }
          ul {
            list-style: none;
            padding: 0;
            margin: 1rem 0;
            text-align: left;
          }
          li {
            padding: 0.5rem 0;
            border-bottom: 1px solid #333;
          }
          li span {
            color: #999;
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
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🎉 Playlist "<em>${playlistName}</em>" Created!</h2>
          <a class="button" href="${playlistResponse.data.external_urls.spotify}" target="_blank">Open in Spotify</a>
          <h3 style="margin-top: 2rem;">Your Top 20 Tracks</h3>
          <ul>${trackList}</ul>
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