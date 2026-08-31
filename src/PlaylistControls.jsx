import { PLAYLIST_FILTERS } from './playlistFilters';
import { formatCacheAge } from './playlistCache';

export default function PlaylistControls({
  filter,
  onFilterChange,
  library,
  loading,
  onRefresh,
  cacheSaved,
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
          {library.fromCache ? `Cached ${formatCacheAge(library.ageMs)}` : 'Just fetched'}
          {library.isStale && ' · stale'}
          {!cacheSaved && ' · cache full'}
        </span>
      )}

      <button
        className="btn-ghost btn-refresh"
        onClick={onRefresh}
        disabled={loading}
        title="Fetch fresh data from Spotify"
      >
        {loading ? 'Refreshing…' : '↻ Refresh'}
      </button>
    </div>
  );
}
