import React, { useMemo, useState } from 'react';
import { computePlaylistSummaries, computeArtistInsights } from './playlistInsights';
import { getFilterLabel } from './playlistFilters';

const ARTIST_VIEWS = [
  { id: 'heavy', label: 'Heavy hitters', hint: 'Most total track appearances' },
  { id: 'staples', label: 'Cross-playlist', hint: 'Artists spread across the most playlists' },
  { id: 'exclusives', label: 'Deep cuts', hint: 'Artists concentrated in a single playlist' },
];

const RANK_COLORS = ['#1db954', '#509bf5', '#f59b23', '#b49bc8', '#e91429', '#2ebd59'];

function BarChart({ items, onClick }) {
  const max = Math.max(...items.map(i => i.count), 1);

  return (
    <div className="bar-chart">
      {items.map((item, idx) => (
        <button
          key={item.id}
          className="bar-row"
          onClick={() => onClick?.(item)}
          type="button"
        >
          <span className="bar-rank">#{idx + 1}</span>
          <span className="bar-label" title={item.name}>{item.name}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${(item.count / max) * 100}%`,
                background: RANK_COLORS[idx % RANK_COLORS.length],
              }}
            />
          </div>
          <span className="bar-value">{item.count}</span>
        </button>
      ))}
    </div>
  );
}

function ArtistInsightList({ artists, onClick }) {
  if (!artists.length) {
    return <p className="panel-empty">Nothing here for this view yet.</p>;
  }

  const maxTracks = Math.max(...artists.map(a => a.trackCount), 1);
  const maxPlaylists = Math.max(...artists.map(a => a.playlistCount), 1);

  return (
    <div className="artist-insight-list">
      {artists.map((artist, idx) => (
        <button
          key={artist.id}
          className="artist-insight-card"
          onClick={() => onClick(artist)}
          type="button"
        >
          <span
            className="artist-rank"
            style={{ color: RANK_COLORS[idx % RANK_COLORS.length] }}
          >
            #{idx + 1}
          </span>

          <div className="artist-insight-body">
            <div className="artist-insight-top">
              <span className="artist-insight-name">{artist.name}</span>
              <span className="artist-insight-share">{artist.trackShare}% of tracks</span>
            </div>

            <div className="artist-dual-metrics">
              <div className="metric-row">
                <span className="metric-label">Tracks</span>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar metric-bar-tracks"
                    style={{ width: `${(artist.trackCount / maxTracks) * 100}%` }}
                  />
                </div>
                <span className="metric-val">{artist.trackCount}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Playlists</span>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar metric-bar-playlists"
                    style={{ width: `${(artist.playlistCount / maxPlaylists) * 100}%` }}
                  />
                </div>
                <span className="metric-val">{artist.playlistCount}</span>
              </div>
            </div>

            <p className="artist-insight-detail">
              {artist.playlistCount === 1
                ? `Only in "${artist.playlistNames[0]}" · ${artist.avgTracksPerPlaylist} tracks/playlist`
                : `In ${artist.playlistCount} playlists · ~${artist.avgTracksPerPlaylist} tracks each`}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function PlaylistCard({ playlist, onClick }) {
  return (
    <button className="playlist-card" onClick={() => onClick(playlist)} type="button">
      <div className="playlist-card-header">
        <h3>{playlist.name}</h3>
        <div className="playlist-badges">
          {playlist.public === false && <span className="badge">Private</span>}
          {playlist.collaborative && <span className="badge badge-warn">Collaborative</span>}
        </div>
      </div>
      <div className="playlist-card-stats">
        <span>{playlist.trackCount} tracks</span>
        <span>{playlist.artistCount} artists</span>
      </div>
      {playlist.topArtists.length > 0 && (
        <div className="playlist-card-artists">
          Top: {playlist.topArtists.slice(0, 3).map(a => a.name).join(', ')}
        </div>
      )}
    </button>
  );
}

export default function Explore({
  token,
  library,
  filteredPlaylists,
  filter,
  loading,
  error,
}) {
  const [view, setView] = useState('playlists');
  const [artistView, setArtistView] = useState('heavy');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistAlbums, setArtistAlbums] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);

  const filterLabel = getFilterLabel(filter);

  const summaries = useMemo(() => {
    if (!library) return [];
    return computePlaylistSummaries(filteredPlaylists, library.tracksByPlaylistId);
  }, [library, filteredPlaylists]);

  const artistInsights = useMemo(() => {
    if (!library) return null;
    return computeArtistInsights(filteredPlaylists, library.tracksByPlaylistId);
  }, [library, filteredPlaylists]);

  const activeArtists = useMemo(() => {
    if (!artistInsights) return [];
    if (artistView === 'staples') return artistInsights.staples;
    if (artistView === 'exclusives') return artistInsights.exclusives;
    return artistInsights.heavyHitters;
  }, [artistInsights, artistView]);

  const activeArtistHint = ARTIST_VIEWS.find(v => v.id === artistView)?.hint || '';

  async function loadArtistAlbums(artist) {
    setSelectedArtist(artist);
    setLoadingAlbums(true);
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setArtistAlbums(data.items || []);
    } catch {
      setArtistAlbums([]);
    } finally {
      setLoadingAlbums(false);
    }
  }

  function openPlaylist(pl) {
    setSelectedPlaylist(pl);
    setSelectedArtist(null);
    setArtistAlbums([]);
    setView('detail');
  }

  function goBack() {
    if (selectedArtist) {
      setSelectedArtist(null);
      setArtistAlbums([]);
      return;
    }
    setSelectedPlaylist(null);
    setView('playlists');
  }

  const playlistArtists = useMemo(() => {
    if (!selectedPlaylist) return [];
    const counts = {};
    selectedPlaylist.tracks.forEach(track => {
      track.artists?.forEach(artist => {
        counts[artist.id] = counts[artist.id] || { id: artist.id, name: artist.name, count: 0 };
        counts[artist.id].count++;
      });
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [selectedPlaylist]);

  if (loading && !library) return null;

  if (error && !library) {
    return (
      <div className="explore-page">
        <div className="stats-error">
          <p><strong>Could not load library</strong></p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!filteredPlaylists.length) {
    return (
      <div className="explore-page">
        <div className="empty-state">
          <p><strong>No playlists match this filter</strong></p>
          <p>Try a different selection — currently showing: {filterLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="explore-page">
      <div className="explore-toolbar">
        <div className="explore-subnav">
          <button
            className={`subnav-tab ${view === 'playlists' || view === 'detail' ? 'active' : ''}`}
            onClick={() => { setView('playlists'); setSelectedPlaylist(null); setSelectedArtist(null); }}
          >
            Playlists
          </button>
          <button
            className={`subnav-tab ${view === 'artists' ? 'active' : ''}`}
            onClick={() => { setView('artists'); setSelectedPlaylist(null); setSelectedArtist(null); }}
          >
            Artists
          </button>
        </div>
        <span className="explore-meta">
          {filterLabel} · {filteredPlaylists.length} playlists
          {loading && ' · refreshing…'}
        </span>
      </div>

      <div className="explore-content">
        {view === 'playlists' && (
          <div className="playlist-grid">
            {summaries.map(pl => (
              <PlaylistCard key={pl.id} playlist={pl} onClick={openPlaylist} />
            ))}
          </div>
        )}

        {view === 'detail' && selectedPlaylist && (
          <div className="detail-view">
            <button className="back-link" onClick={goBack} type="button">← All playlists</button>

            <div className="detail-header">
              <h2>{selectedPlaylist.name}</h2>
              <p>
                {selectedPlaylist.trackCount} tracks · {selectedPlaylist.artistCount} unique artists
              </p>
            </div>

            {!selectedArtist ? (
              <>
                <h3 className="section-title">Top artists in this playlist</h3>
                <p className="section-hint">Ranked by track count in this playlist only</p>
                <BarChart items={playlistArtists} onClick={loadArtistAlbums} />
              </>
            ) : (
              <>
                <button className="back-link" onClick={() => { setSelectedArtist(null); setArtistAlbums([]); }} type="button">
                  ← {selectedPlaylist.name}
                </button>
                <div className="detail-header">
                  <h2>{selectedArtist.name}</h2>
                  <p>{selectedArtist.count} tracks in this playlist</p>
                </div>
                <h3 className="section-title">Albums</h3>
                {loadingAlbums ? (
                  <div className="stats-loading compact"><div className="stats-spinner" /></div>
                ) : (
                  <div className="album-grid">
                    {artistAlbums.map(album => (
                      <div key={album.id} className="album-card">
                        {album.images?.[0] && (
                          <img src={album.images[0].url} alt="" className="album-art" />
                        )}
                        <span className="album-name">{album.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {view === 'artists' && artistInsights && (
          <div className="detail-view detail-view-wide">
            <div className="artist-view-tabs">
              {ARTIST_VIEWS.map(v => (
                <button
                  key={v.id}
                  className={`artist-view-tab ${artistView === v.id ? 'active' : ''}`}
                  onClick={() => { setArtistView(v.id); setSelectedArtist(null); setArtistAlbums([]); }}
                  type="button"
                >
                  {v.label}
                </button>
              ))}
            </div>
            <p className="section-hint">{activeArtistHint}</p>

            <ArtistInsightList
              artists={activeArtists}
              onClick={loadArtistAlbums}
            />

            {selectedArtist && (
              <div className="artist-albums-panel">
                <h3 className="section-title">{selectedArtist.name} — albums</h3>
                {loadingAlbums ? (
                  <div className="stats-loading compact"><div className="stats-spinner" /></div>
                ) : (
                  <div className="album-grid">
                    {artistAlbums.map(album => (
                      <div key={album.id} className="album-card">
                        {album.images?.[0] && (
                          <img src={album.images[0].url} alt="" className="album-art" />
                        )}
                        <span className="album-name">{album.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
