import React, { useEffect, useMemo, useState } from 'react';
import Explore from './Explore';
import Stats from './Stats';
import PlaylistControls from './PlaylistControls';
import { redirectToSpotifyAuth } from './spotifyAuth';
import { filterPlaylists, getDefaultFilter, saveFilter } from './playlistFilters';
import { usePlaylistData } from './usePlaylistData';
import { clearCache } from './playlistCache';
import PlaylistLoadScreen from './PlaylistLoadScreen';
import spotifyLogo from './assets/spotify.png';
import './App.css';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const BACKEND_URL = 'http://127.0.0.1:8887';

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('spotify_token'));
  const [page, setPage] = useState('explore');
  const [authError, setAuthError] = useState('');
  const [filter, setFilter] = useState(getDefaultFilter);

  const { library, loading, error, refresh, cacheSaved, fileSaved, loadPhase, loadItems, reusedCount } = usePlaylistData(token);

  const filteredPlaylists = useMemo(() => {
    if (!library) return [];
    return filterPlaylists(library.playlists, filter, library.userId);
  }, [library, filter]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!token && code) {
      setAuthError('');
      fetch(`${BACKEND_URL}/api/exchange_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          redirect_uri: import.meta.env.VITE_FRONTEND_LINK,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            sessionStorage.setItem('spotify_token', data.access_token);
            setToken(data.access_token);
            window.history.replaceState({}, document.title, '/');
          } else {
            setAuthError(data.error_description || data.error || 'Failed to log in');
          }
        })
        .catch(() => setAuthError('Could not reach the backend. Is it running on port 8887?'));
    }
  }, [token]);

  function handleFilterChange(nextFilter) {
    setFilter(nextFilter);
    saveFilter(nextFilter);
  }

  function handleLogout() {
    sessionStorage.removeItem('spotify_token');
    clearCache();
    setToken(null);
    setPage('explore');
  }

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <img src={spotifyLogo} alt="Spotify" className="login-logo" />
          <h1>Spotify Graph</h1>
          <p>Browse your playlists, discover patterns, and dig into stats — without the chaos of a giant network graph.</p>
          {authError && <p className="login-error">{authError}</p>}
          <button className="btn-primary" onClick={() => redirectToSpotifyAuth(CLIENT_ID)}>
            Log in with Spotify
          </button>
        </div>
      </div>
    );
  }

  const sharedProps = {
    library,
    filteredPlaylists,
    filter,
    loading,
    error,
    token,
  };

  const showLoadScreen = loading && loadPhase !== 'idle' && loadPhase !== 'done';

  return (
    <div className="app-shell">
      {showLoadScreen && (
        <PlaylistLoadScreen items={loadItems} phase={loadPhase} reusedCount={reusedCount} />
      )}
      <header className="app-header">
        <div className="header-brand">
          <img src={spotifyLogo} alt="" className="header-logo" />
          <span>Spotify Graph</span>
        </div>

        <nav className="header-nav">
          <button
            className={`nav-tab ${page === 'explore' ? 'active' : ''}`}
            onClick={() => setPage('explore')}
          >
            Explore
          </button>
          <button
            className={`nav-tab ${page === 'stats' ? 'active' : ''}`}
            onClick={() => setPage('stats')}
          >
            Stats
          </button>
        </nav>

        <PlaylistControls
          filter={filter}
          onFilterChange={handleFilterChange}
          library={library}
          loading={loading}
          onRefresh={refresh}
          cacheSaved={cacheSaved}
          fileSaved={fileSaved}
        />

        <button className="btn-ghost" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <main className="app-main">
        {page === 'explore' ? <Explore {...sharedProps} /> : <Stats {...sharedProps} />}
      </main>
    </div>
  );
}
