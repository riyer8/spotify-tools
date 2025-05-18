import express from 'express';
import axios from 'axios';
import open from 'open';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 8889;

// Add user-read-playback-state scope for now playing
const scopes = 'user-read-playback-state';

app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Now Playing</title>
    <style>
      body {
        font-family: 'Segoe UI', sans-serif;
        background: linear-gradient(135deg, #1db954, #191414);
        color: white;
        margin: 0; padding: 0;
        display: flex; justify-content: center; align-items: center;
        height: 100vh;
        text-align: center;
      }
      .container {
        background-color: #121212;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        max-width: 400px;
        width: 100%;
      }
      img {
        max-width: 100%;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
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
        margin-top: 1rem;
      }
      button:hover {
        background-color: #17a64a;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Get Currently Playing Track</h1>
      <a href="/login"><button>Login with Spotify</button></a>
    </div>
  </body>
  </html>
  `);
});

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

  if (!code) {
    return res.send('No code provided');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REDIRECT_URI,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const access_token = tokenResponse.data.access_token;

    // Render page showing current playing track with client-side fetch from server endpoint
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Now Playing</title>
        <style>
            body {
            font-family: 'Segoe UI', sans-serif;
            color: white;
            margin: 0;
            padding: 2rem;
            text-align: center;
            transition: background-color 0.5s ease-in-out;
            }

            img {
            max-width: 200px;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
            animation: pulse 3s infinite;
            }

            .track-info {
            margin-top: 1rem;
            }

            .progress-bar {
            width: 80%;
            height: 10px;
            background: #333;
            border-radius: 5px;
            margin: 1rem auto 0;
            }

            .progress {
            height: 100%;
            background: #1db954;
            width: 0%;
            border-radius: 5px;
            transition: width 0.5s linear;
            }

            @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.03); }
            100% { transform: scale(1); }
            }
        </style>
        </head>
        <body>
        <h1>Now Playing</h1>
        <div id="now-playing">Loading current track...</div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.2/color-thief.umd.js"></script>
        <script>
            let duration = 0;
            let progress = 0;
            let isPlaying = false;
            let interval;

            async function fetchNowPlaying() {
            const res = await fetch('/now-playing', {
                headers: {
                Authorization: 'Bearer ${access_token}'
                }
            });

            const data = await res.json();
            const container = document.getElementById('now-playing');

            if (data.error) {
                container.innerHTML = '<p style="color:#f44336;">Error: ' + data.error + '</p>';
                return;
            }

            if (!data.is_playing) {
                clearInterval(interval);
                container.innerHTML = '<p>Nothing is currently playing.</p>';
                document.body.style.backgroundColor = '#111';
                return;
            }

            if (data.message) {
                container.innerHTML = '<p>' + data.message + '</p>';
                return;
            }

            isPlaying = data.is_playing;
            duration = data.duration_ms;
            progress = data.progress_ms;

            container.innerHTML = \`
                <img id="album-art" src="\${data.album_art_url}" alt="Album Art" crossorigin="anonymous" />
                <div class="track-info">
                <h2>\${data.track_name}</h2>
                <p>By: \${data.artists}</p>
                <p><em>Album: \${data.album_name}</em></p>
                <p id="progress-text">Progress: \${Math.floor(progress / 1000)}s / \${Math.floor(duration / 1000)}s</p>
                <div class="progress-bar"><div id="progress-bar" class="progress"></div></div>
                </div>
            \`;

            setDominantColor();

            if (interval) clearInterval(interval);
            interval = setInterval(() => {
                if (isPlaying) updateProgress();
            }, 1000);

            // Refresh track info every 10 seconds in case of pause/play
            setInterval(fetchNowPlaying, 10000);
            }

            function updateProgress() {
            if (progress >= duration) return;
            progress += 1000;
            const percent = (progress / duration) * 100;
            document.getElementById('progress-bar').style.width = percent + '%';
            document.getElementById('progress-text').textContent =
                \`Progress: \${Math.floor(progress / 1000)}s / \${Math.floor(duration / 1000)}s\`;
            }

            function setDominantColor() {
            const img = document.getElementById('album-art');
            const colorThief = new ColorThief();

            if (img.complete) {
                applyColor(colorThief.getColor(img));
            } else {
                img.addEventListener('load', () => {
                applyColor(colorThief.getColor(img));
                });
            }
            }

            function applyColor(rgb) {
            const [r, g, b] = rgb;

            // Darken by reducing brightness
            const darkR = Math.max(0, r - 50);
            const darkG = Math.max(0, g - 50);
            const darkB = Math.max(0, b - 50);

            const bgColor = \`rgb(\${darkR}, \${darkG}, \${darkB})\`;
            document.body.style.backgroundColor = bgColor;
            }

            fetchNowPlaying();
        </script>
        </body>
        </html>
        `);

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send('Error getting tokens or now playing data.');
  }
});

app.get('/now-playing', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Access token missing' });
    }
    const access_token = authHeader.split(' ')[1];

    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const data = response.data;

    if (!data || !data.item) {
      return res.json({ is_playing: false, message: 'No track currently playing' });
    }

    if (!data.item.album) {
      return res.json({ is_playing: data.is_playing, message: 'Ad or non-track content playing' });
    }

    const track = data.item;

    res.json({
      is_playing: data.is_playing,
      track_name: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      album_name: track.album.name,
      album_art_url: track.album.images[0]?.url || null,
      progress_ms: data.progress_ms,
      duration_ms: track.duration_ms,
    });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch currently playing track' });
  }
});

app.listen(port, () => {
  console.log(`Now Playing app running at http://127.0.0.1:${port}`);
  open(`http://127.0.0.1:${port}/`);
});