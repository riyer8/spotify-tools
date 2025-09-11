import React, { useEffect, useState } from 'react';
import Graph from './Graph';
import Stats from './Stats';
import { redirectToSpotifyAuth } from './spotifyAuth';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

export default function App() {
  const [token, setToken] = useState(null);
  const [page, setPage] = useState('main'); // 'main' or 'stats'

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
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      {!token ? (
        <button
          onClick={() => redirectToSpotifyAuth(CLIENT_ID)}
          style={{ padding: '1em 2em', fontSize: '1.2em', cursor: 'pointer' }}
        >
          Login with Spotify
        </button>
      ) : page === 'main' ? (
        <>
          <Graph token={token} onBack={null} />
          <button
            onClick={() => setPage('stats')}
            style={{
              position: 'absolute',
              top: 30,
              right: 30,
              padding: '0.7em 1.5em',
              fontSize: '1.1em',
              background: '#6baed6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            📊 View Stats
          </button>
        </>
      ) : (
        <>
          <Stats token={token} />
          <button
            onClick={() => setPage('main')}
            style={{
              position: 'absolute',
              top: 30,
              left: 30,
              padding: '0.7em 1.5em',
              fontSize: '1.1em',
              background: '#fd8d3c',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            ← Back
          </button>
        </>
      )}
    </div>
  );
}