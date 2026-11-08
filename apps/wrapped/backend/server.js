const crypto = require("crypto");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const REQUIRED = ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "REDIRECT_URI", "FRONTEND_URI"];
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env in apps/wrapped/backend/.env: ${missing.join(", ")}`);
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URI }));
app.use(express.json());

function loginErrorPage(message) {
  const safe = String(message).replace(/[&<>"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[char]));
  return `<!doctype html>
<meta name="color-scheme" content="dark">
<title>Spotify login failed</title>
<body style="margin:0;background:#12110f;color:#f3efe6;font-family:Georgia,serif">
  <main style="max-width:36rem;margin:0 auto;padding:4.5rem 1.25rem">
    <h1 style="font-weight:500">Spotify didn’t finish login</h1>
    <p style="color:#b7b1a6">${safe}</p>
    <p><a href="/login" style="color:#e7c99a">Try again</a></p>
  </main>
</body>`;
}

app.get("/login", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: "user-top-read",
    redirect_uri: process.env.REDIRECT_URI,
    state,
    show_dialog: "true",
  });
  res.setHeader("Set-Cookie", `spotify_auth_state=${state}; HttpOnly; SameSite=Lax; Path=/`);
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

app.get("/callback", async (req, res) => {
  const spotifyError = req.query.error;
  if (spotifyError) {
    res.status(400).type("html").send(loginErrorPage(`Spotify returned “${spotifyError}”.`));
    return;
  }

  const code = req.query.code;
  if (!code) {
    res.status(400).type("html").send(loginErrorPage("Spotify did not return a login code."));
    return;
  }

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }),
    );
    const { access_token } = response.data;
    res.redirect(`${process.env.FRONTEND_URI}/?access_token=${access_token}`);
  } catch (err) {
    const detail = err.response?.data?.error_description || err.response?.data?.error || err.message;
    res.status(err.response?.status || 500).send(`Spotify login failed: ${detail}`);
  }
});

app.get("/top/:type", async (req, res) => {
  const { type } = req.params;
  if (type !== "artists" && type !== "tracks") {
    res.status(400).json({ error: "type must be artists or tracks" });
    return;
  }

  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "missing token" });
    return;
  }

  try {
    const response = await axios.get(`https://api.spotify.com/v1/me/top/${type}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 20, time_range: "medium_term" },
    });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const spotifyError = err.response?.data?.error;
    res.status(status).json({
      error: spotifyError?.message || err.message,
    });
  }
});

const port = Number(process.env.PORT) || 3010;
app.listen(port, "127.0.0.1", () => {
  console.log(`Wrapped backend on http://127.0.0.1:${port}`);
});
