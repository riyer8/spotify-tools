const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/login", (req, res) => {
  const scopes = "user-top-read";
  const redirect_uri = process.env.REDIRECT_URI;
  const authURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.SPOTIFY_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirect_uri)}`;
  res.redirect(authURL);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  const tokenURL = "https://accounts.spotify.com/api/token";

  const response = await axios.post(tokenURL, new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: process.env.REDIRECT_URI,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  }));

  const { access_token, refresh_token } = response.data;
  res.redirect(`${process.env.FRONTEND_URI}/?access_token=${access_token}`);
});

app.get("/top/:type", async (req, res) => {
  const { type } = req.params; // 'artists' or 'tracks'
  const { token } = req.query;

  const response = await axios.get(`https://api.spotify.com/v1/me/top/${type}?limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  res.json(response.data);
});

app.listen(3000, () => console.log("Backend running on port 3000"));