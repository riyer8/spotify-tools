function trackFromItem(item) {
  return item?.track ?? item?.item ?? null;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, token, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 429 && attempt < retries) {
      const retryAfter = Number(res.headers.get('Retry-After') || 1);
      await sleep(retryAfter * 1000);
      continue;
    }

    return res;
  }
}

async function fetchPlaylistTracksFromUrl(url, token) {
  const tracks = [];
  let next = url;

  while (next) {
    const res = await fetchWithRetry(next, token);

    if (res.status === 403) {
      return { tracks: [], error: 'Access denied — playlist may be restricted in Development Mode' };
    }
    if (res.status === 404) {
      return { tracks: [], error: 'Playlist not found or no longer available' };
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        tracks: [],
        error: body.error?.message || `Request failed (${res.status})`,
      };
    }

    const data = await res.json();
    tracks.push(...(data.items || []));
    next = data.next;
  }

  return { tracks };
}

export async function fetchPlaylists(token) {
  const playlists = [];
  let url = 'https://api.spotify.com/v1/me/playlists?limit=50';

  while (url) {
    const res = await fetchWithRetry(url, token);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || `Failed to fetch playlists (${res.status})`);
    }
    const data = await res.json();
    playlists.push(...(data.items || []));
    url = data.next;
  }

  return playlists;
}

export async function fetchPlaylistTracks(token, playlistId) {
  const endpoints = [
    `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=100`,
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
  ];

  let lastError = 'Playlist tracks unavailable';

  for (const endpoint of endpoints) {
    const result = await fetchPlaylistTracksFromUrl(endpoint, token);
    if (result.tracks.length > 0 || !result.error) {
      return result;
    }
    lastError = result.error || lastError;
  }

  return { tracks: [], error: lastError };
}

export function getTrackFromPlaylistItem(item) {
  return trackFromItem(item);
}
