import { useCallback, useEffect, useState } from 'react';
import { fetchPlaylists, fetchPlaylistTracks, getTrackFromPlaylistItem } from './spotifyApi';
import { loadBestCache, loadFileCacheRaw, saveCache, saveFileCache } from './playlistCache';
import { mapWithConcurrency } from './parallelFetch';

const FETCH_CONCURRENCY = 6;
export const LOCAL_PREVIEW_TOKEN = 'local-preview';

function normalizeTrack(item) {
  const track = getTrackFromPlaylistItem(item);
  if (!track?.name) return null;
  return {
    id: track.id,
    name: track.name,
    artists: track.artists?.map(a => ({ id: a.id, name: a.name })) || [],
    album: track.album?.name ? { name: track.album.name } : null,
    addedAt: item.added_at || null,
  };
}

function normalizeTracks(items) {
  return items.map(normalizeTrack).filter(Boolean);
}

function slimPlaylist(pl) {
  return {
    id: pl.id,
    name: pl.name,
    owner: { id: pl.owner?.id },
    public: pl.public,
    collaborative: pl.collaborative,
    snapshotId: pl.snapshot_id || pl.snapshotId || null,
  };
}

function canReuseTracks(playlist, prevById, prevTracks) {
  const prev = prevById[playlist.id];
  const tracks = prevTracks[playlist.id];
  return Boolean(
    prev?.snapshotId
    && prev.snapshotId === playlist.snapshot_id
    && Array.isArray(tracks)
  );
}

async function fetchProfile(token) {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

function updateItem(items, id, patch) {
  return items.map(item => (item.id === id ? { ...item, ...patch } : item));
}

export function usePlaylistData(token) {
  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cacheSaved, setCacheSaved] = useState(true);
  const [fileSaved, setFileSaved] = useState(true);
  const [loadPhase, setLoadPhase] = useState('idle');
  const [loadItems, setLoadItems] = useState([]);
  const [reusedCount, setReusedCount] = useState(0);

  const persistLibrary = useCallback(async (nextLibrary) => {
    setCacheSaved(saveCache(nextLibrary));
    setFileSaved(await saveFileCache(nextLibrary));
  }, []);

  const fetchFresh = useCallback(async (userId, previousLibrary = null) => {
    setLoadPhase('playlists');
    setLoadItems([]);
    setReusedCount(0);

    const playlists = await fetchPlaylists(token);
    const prevTracks = previousLibrary?.tracksByPlaylistId || {};
    const prevById = Object.fromEntries(
      (previousLibrary?.playlists || []).map(pl => [pl.id, pl])
    );

    const tracksByPlaylistId = {};
    const toFetch = [];
    let reused = 0;

    for (const pl of playlists) {
      if (canReuseTracks(pl, prevById, prevTracks)) {
        tracksByPlaylistId[pl.id] = prevTracks[pl.id];
        reused += 1;
      } else {
        toFetch.push(pl);
      }
    }

    setReusedCount(reused);

    const failedPlaylists = [];

    if (toFetch.length > 0) {
      setLoadItems(toFetch.map(pl => ({
        id: pl.id,
        name: pl.name,
        status: 'pending',
      })));
      setLoadPhase('tracks');

      await mapWithConcurrency(
        toFetch,
        FETCH_CONCURRENCY,
        async (pl) => {
          const { tracks, error: trackError } = await fetchPlaylistTracks(token, pl.id);
          const normalized = normalizeTracks(tracks);

          if (trackError && normalized.length === 0) {
            failedPlaylists.push({ id: pl.id, name: pl.name, error: trackError });
          }

          tracksByPlaylistId[pl.id] = normalized;
          return { trackCount: normalized.length, error: trackError };
        },
        {
          onStart: (pl) => {
            setLoadItems(prev => updateItem(prev, pl.id, { status: 'loading' }));
          },
          onComplete: (pl, _idx, result) => {
            if (result?.error && result.trackCount === 0) {
              setLoadItems(prev => updateItem(prev, pl.id, {
                status: 'error',
                error: result.error,
              }));
            } else {
              setLoadItems(prev => updateItem(prev, pl.id, {
                status: 'done',
                trackCount: result?.trackCount ?? 0,
              }));
            }
          },
        }
      );
    }

    const failedIds = new Set(failedPlaylists.map(pl => pl.id));
    const nextLibrary = {
      userId,
      playlists: playlists.map(pl => ({
        ...slimPlaylist(pl),
        snapshotId: failedIds.has(pl.id) ? null : (pl.snapshot_id || pl.snapshotId || null),
      })),
      tracksByPlaylistId,
      failedPlaylists,
      fetchedAt: Date.now(),
      fromCache: false,
      cacheSource: 'spotify',
      isStale: false,
      ageMs: 0,
      refreshStats: {
        fetched: toFetch.length,
        reused,
      },
    };

    setLibrary(nextLibrary);
    await persistLibrary(nextLibrary);
    setLoadPhase('done');
    return nextLibrary;
  }, [token, persistLibrary]);

  const load = useCallback(async (forceRefresh = false) => {
    if (!token) return;

    setError('');
    setLoading(true);

    try {
      if (token === LOCAL_PREVIEW_TOKEN) {
        const cached = await loadFileCacheRaw();
        if (!cached) {
          setError('No saved library on disk. Log in with Spotify first.');
          setLoadPhase('idle');
          return null;
        }
        setLibrary(cached);
        setLoadPhase('done');
        setLoadItems([]);
        setFileSaved(true);
        return cached;
      }

      const profile = await fetchProfile(token);
      const userId = profile.id;
      const cached = await loadBestCache(userId);

      if (!forceRefresh && cached) {
        setLibrary(cached);
        setLoadPhase('done');
        setLoadItems([]);
        setLoading(false);
        if (cached.cacheSource !== 'file') {
          saveFileCache(cached).then(setFileSaved);
        } else {
          setFileSaved(true);
        }
        return cached;
      }

      return await fetchFresh(userId, cached);
    } catch (err) {
      setError(err.message);
      setLoadPhase('idle');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, fetchFresh]);

  const refresh = useCallback(() => load(true), [load]);

  useEffect(() => {
    load(false);
  }, [load]);

  return {
    library,
    loading,
    error,
    refresh,
    cacheSaved,
    fileSaved,
    loadPhase,
    loadItems,
    reusedCount,
  };
}
