import { PLAYLIST_FILTERS } from './playlistFilters';
import { formatCacheAge } from './playlistCache';

function cacheLabel(library) {
  if (library.fromCache) {
    const source = library.cacheSource === 'file' ? 'Saved library' : 'Cached';
    return `${source} · ${formatCacheAge(library.ageMs)}`;
  }

  const stats = library.refreshStats;
  if (stats && stats.fetched === 0 && stats.reused > 0) {
    return 'Already up to date';
  }
  if (stats && stats.reused > 0) {
    return `Updated ${stats.fetched} playlist${stats.fetched === 1 ? '' : 's'}`;
  }
  return 'Just fetched';
}

export default function PlaylistControls({
  filter,
  onFilterChange,
  library,
  loading,
  onRefresh,
  cacheSaved,
  fileSaved,
}) {
  const activeFilter = PLAYLIST_FILTERS.find(f => f.id === filter);

  return (
    <div className="playlist-controls">
      <label className="filter-select-wrap">
        <span className="sr-only">Playlist filter</span>
        <select
          className="filter-select"
          value={filter}
          onChange={e => onFilterChange(e.target.value)}
          disabled={loading}
        >
          {PLAYLIST_FILTERS.map(f => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </label>

      {library && (
        <span className="cache-badge" title={activeFilter?.description}>
          {cacheLabel(library)}
          {library.isStale && ' · stale'}
          {!cacheSaved && ' · cache full'}
          {!fileSaved && ' · not saved to disk'}
        </span>
      )}

      <button
        className="btn-ghost btn-refresh"
        onClick={onRefresh}
        disabled={loading}
        title="Check Spotify for playlist changes. Unchanged playlists stay cached."
      >
        {loading ? 'Refreshing…' : '↻ Refresh'}
      </button>
    </div>
  );
}
