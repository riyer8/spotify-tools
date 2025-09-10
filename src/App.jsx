import React, { useEffect, useState } from 'react';
import Graph from './Graph';
import { redirectToSpotifyAuth } from './spotifyAuth';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

export default function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!token && code) {
      fetch('http://127.0.0.1:8887/api/exchange_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          redirect_uri: import.meta.env.VITE_FRONTEND_LINK
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            setToken(data.access_token);
            window.history.replaceState({}, document.title, '/');
          } else {
            console.error('Failed to get access token', data);
          }
        })
        .catch(console.error);
    }
  }, [token]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {!token ? (
        <button
          onClick={() => redirectToSpotifyAuth(CLIENT_ID)}
          style={{ padding: '1em 2em', fontSize: '1.2em', cursor: 'pointer' }}
        >
          Login with Spotify
        </button>
      ) : (
        <Graph token={token} />
      )}
    </div>
  );
}