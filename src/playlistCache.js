const CACHE_KEY = 'spotify_graph_library_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function slimPlaylist(playlist) {
  return {
    id: playlist.id,
    name: playlist.name,
    owner: { id: playlist.owner?.id },
    public: playlist.public,
    collaborative: playlist.collaborative,
  };
}

export function slimLibrary(library) {
  return {
    userId: library.userId,
    fetchedAt: library.fetchedAt,
    playlists: (library.playlists || []).map(slimPlaylist),
    tracksByPlaylistId: library.tracksByPlaylistId || {},
  };
}

export function loadCache(userId) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (data.userId !== userId) return null;

    const ageMs = Date.now() - data.fetchedAt;
    return {
      ...data,
      fromCache: true,
      isStale: ageMs > CACHE_TTL_MS,
      ageMs,
    };
  } catch {
    return null;
  }
}

export function saveCache(library) {
  try {
    const slimmed = slimLibrary(library);
    localStorage.setItem(CACHE_KEY, JSON.stringify(slimmed));
    return true;
  } catch (err) {
    if (err?.name === 'QuotaExceededError') {
      clearCache();
    }
    return false;
  }
}

export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

export function formatCacheAge(ageMs) {
  if (ageMs < 60_000) return 'just now';
  if (ageMs < 3_600_000) {
    const mins = Math.floor(ageMs / 60_000);
    return `${mins} min${mins === 1 ? '' : 's'} ago`;
  }
  if (ageMs < 86_400_000) {
    const hours = Math.floor(ageMs / 3_600_000);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(ageMs / 86_400_000);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
