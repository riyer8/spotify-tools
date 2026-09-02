const CACHE_KEY = 'spotify_graph_library_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const BACKEND_URL = 'http://127.0.0.1:8887';

function slimPlaylist(playlist) {
  return {
    id: playlist.id,
    name: playlist.name,
    owner: { id: playlist.owner?.id },
    public: playlist.public,
    collaborative: playlist.collaborative,
    snapshotId: playlist.snapshotId || null,
  };
}

export function slimLibrary(library) {
  return {
    version: 2,
    userId: library.userId,
    fetchedAt: library.fetchedAt,
    playlists: (library.playlists || []).map(slimPlaylist),
    tracksByPlaylistId: library.tracksByPlaylistId || {},
  };
}

function withCacheMeta(data, cacheSource) {
  const ageMs = Date.now() - data.fetchedAt;
  return {
    ...data,
    fromCache: true,
    cacheSource,
    isStale: ageMs > CACHE_TTL_MS,
    ageMs,
  };
}

export function loadCache(userId) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (data.userId !== userId) return null;

    return withCacheMeta(data, 'local');
  } catch {
    return null;
  }
}

export async function loadFileCache(userId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/library-cache`);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.userId !== userId) return null;
    if (!Array.isArray(data.playlists) || !data.tracksByPlaylistId) return null;

    return withCacheMeta(data, 'file');
  } catch {
    return null;
  }
}

export async function loadBestCache(userId) {
  const local = loadCache(userId);
  const file = await loadFileCache(userId);

  if (!local) return file;
  if (!file) return local;
  return (file.fetchedAt || 0) >= (local.fetchedAt || 0) ? file : local;
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

export async function saveFileCache(library) {
  try {
    const slimmed = slimLibrary(library);
    const res = await fetch(`${BACKEND_URL}/api/library-cache`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slimmed),
    });
    return res.ok;
  } catch {
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
