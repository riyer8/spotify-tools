import React, { useMemo } from 'react';
import { computeStats } from './computeStats';
import { getFilterLabel } from './playlistFilters';

function StatPanel({ title, rows, accent }) {
  return (
    <div className="stats-panel">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="panel-empty">No data</p>
      ) : (
        rows.map(([name, count], idx) => (
          <div key={name} className={`stat-row ${idx < 3 ? 'top-3' : ''}`}>
            <span className="name" title={name}>{name}</span>
            <span className="count" style={accent ? { color: accent } : undefined}>{count}</span>
          </div>
        ))
      )}
    </div>
  );
}

function InsightCard({ label, value, detail }) {
  return (
    <div className="insight-card">
      <div className="insight-label">{label}</div>
      <div className="insight-value">{value}</div>
      {detail && <div className="insight-detail">{detail}</div>}
    </div>
  );
}

export default function Stats({
  library,
  filteredPlaylists,
  filter,
  loading,
  error,
}) {
  const filterLabel = getFilterLabel(filter);

  const stats = useMemo(() => {
    if (!library || !filteredPlaylists.length) return null;
    return computeStats(filteredPlaylists, library.tracksByPlaylistId);
  }, [library, filteredPlaylists]);

  if (loading && !library) {
    return null;
  }

  if (error && !library) {
    return (
      <div className="stats-page">
        <div className="stats-error">
          <p><strong>Something went wrong</strong></p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!filteredPlaylists.length) {
    return (
      <div className="stats-page">
        <div className="empty-state">
          <p><strong>No playlists match this filter</strong></p>
          <p>Try a different selection — currently showing: {filterLabel}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1>Your Stats</h1>
        <p>{filterLabel} · {filteredPlaylists.length} playlists{loading ? ' · refreshing…' : ''}</p>
      </div>

      <div className="stats-summary">
        <div className="stat-card">
          <div className="label">Playlists</div>
          <div className="value">{filteredPlaylists.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Unique Songs</div>
          <div className="value">{stats.uniqueSongs}</div>
        </div>
        <div className="stat-card">
          <div className="label">Unique Artists</div>
          <div className="value">{stats.uniqueArtists}</div>
        </div>
        <div className="stat-card">
          <div className="label">Avg Tracks / Playlist</div>
          <div className="value">{stats.avgTracksPerPlaylist}</div>
        </div>
      </div>

      <div className="insights-grid">
        {stats.loyalArtist && (
          <InsightCard
            label="Most loyal artist"
            value={stats.loyalArtist.name}
            detail={`Appears in ${stats.loyalArtist.playlistCount} playlists`}
          />
        )}
        {stats.biggestPlaylist && (
          <InsightCard
            label="Biggest playlist"
            value={stats.biggestPlaylist.name}
            detail={`${stats.biggestPlaylist.count} tracks`}
          />
        )}
        <InsightCard
          label="Cross-playlist duplicates"
          value={`${stats.duplicateRate}%`}
          detail={`${stats.duplicateSongCount} songs appear in 2+ playlists`}
        />
        <InsightCard
          label="Redundancy ratio"
          value={`${stats.redundancyRatio}x`}
          detail={`${stats.songs.length} total slots · ${stats.uniqueSongs} unique songs`}
        />
      </div>

      <div className="stats-grid">
        <StatPanel title="Top Artists" rows={stats.sortedArtists.slice(0, 10)} accent="var(--artist)" />
        <StatPanel title="Songs in Most Playlists" rows={stats.topMultiPlaylistSongs} />
        <StatPanel title="Most Diverse Playlists" rows={stats.playlistDiversity} accent="var(--album)" />
      </div>

      <div className="stats-grid">
        <StatPanel title="Top Songs (by appearances)" rows={stats.sortedSongs.slice(0, 10)} />
        <StatPanel title="Artists in Most Playlists" rows={stats.sortedArtistPlaylistCounts} accent="var(--artist)" />
        <StatPanel title="Most Common Albums" rows={stats.sortedAlbums.slice(0, 10)} accent="var(--album)" />
      </div>

      {stats.playlistOverlap.length > 0 && (
        <div className="stats-panel overlap-panel">
          <h3>Most Overlapping Playlists</h3>
          {stats.playlistOverlap.map((item, idx) => (
            <div key={idx} className="overlap-item">
              <div className="overlap-pair">{item.pair[0]} & {item.pair[1]}</div>
              <div className="overlap-songs">
                {item.count} shared songs ({item.pctA}% of {item.pair[0]}, {item.pctB}% of {item.pair[1]})
                {item.songs.length > 0 && (
                  <span className="overlap-examples">
                    {' '}— e.g. {item.songs.slice(0, 2).join(', ')}{item.songs.length > 2 ? '…' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
