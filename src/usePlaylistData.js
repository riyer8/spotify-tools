import { useCallback, useEffect, useState } from 'react';
import { fetchPlaylists, fetchPlaylistTracks, getTrackFromPlaylistItem } from './spotifyApi';
import { loadCache, saveCache } from './playlistCache';
import { mapWithConcurrency } from './parallelFetch';

const FETCH_CONCURRENCY = 6;

function normalizeTrack(item) {
  const track = getTrackFromPlaylistItem(item);
  if (!track?.name) return null;
  return {
    id: track.id,
    name: track.name,
    artists: track.artists?.map(a => ({ id: a.id, name: a.name })) || [],
    album: track.album?.name ? { name: track.album.name } : null,
  };
}

function normalizeTracks(items) {
  return items.map(normalizeTrack).filter(Boolean);
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
  const [loadPhase, setLoadPhase] = useState('idle');
  const [loadItems, setLoadItems] = useState([]);

  const fetchFresh = useCallback(async (userId) => {
    setLoadPhase('playlists');
    setLoadItems([]);

    const playlists = await fetchPlaylists(token);
    const tracksByPlaylistId = {};
    const failedPlaylists = [];

    const initialItems = playlists.map(pl => ({
      id: pl.id,
      name: pl.name,
      status: 'pending',
    }));
    setLoadItems(initialItems);
    setLoadPhase('tracks');

    await mapWithConcurrency(
      playlists,
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

    const nextLibrary = {
      userId,
      playlists: playlists.map(pl => ({
        id: pl.id,
        name: pl.name,
        owner: { id: pl.owner?.id },
        public: pl.public,
        collaborative: pl.collaborative,
      })),
      tracksByPlaylistId,
      failedPlaylists,
      fetchedAt: Date.now(),
      fromCache: false,
      isStale: false,
      ageMs: 0,
    };

    setLibrary(nextLibrary);
    setCacheSaved(saveCache(nextLibrary));
    setLoadPhase('done');
    return nextLibrary;
  }, [token]);

  const load = useCallback(async (forceRefresh = false) => {
    if (!token) return;

    setError('');
    setLoading(true);

    try {
      const profile = await fetchProfile(token);
      const userId = profile.id;

      if (!forceRefresh) {
        const cached = loadCache(userId);
        if (cached) {
          setLibrary(cached);
          setLoadPhase('done');
          setLoadItems([]);
          setLoading(false);
          return cached;
        }
      }

      return await fetchFresh(userId);
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
    loadPhase,
    loadItems,
  };
}
