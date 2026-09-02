export function artistKey(track) {
  return track.artists?.map(a => a.name).filter(Boolean).join(', ') || '';
}

export function songIdentity(track) {
  if (track.id) return `id:${track.id}`;
  const name = (track.name || '').trim().toLowerCase();
  return `name:${name}|${artistKey(track).toLowerCase()}`;
}

export function flattenLibraryEvents(playlists, tracksByPlaylistId) {
  const events = [];
  const seen = new Set();

  for (const playlist of playlists || []) {
    const tracks = tracksByPlaylistId?.[playlist.id] || [];
    for (const track of tracks) {
      if (!track?.name) continue;
      const addedAtMs = Date.parse(track.addedAt);
      if (!Number.isFinite(addedAtMs)) continue;

      const identity = songIdentity(track);
      const dupKey = `${playlist.id}|${identity}|${addedAtMs}`;
      if (seen.has(dupKey)) continue;
      seen.add(dupKey);

      events.push({
        trackId: track.id || null,
        name: track.name,
        artists: track.artists || [],
        artistKey: artistKey(track),
        albumName: track.album?.name || null,
        playlistId: playlist.id,
        playlistName: playlist.name,
        addedAt: new Date(addedAtMs),
        addedAtMs,
        identity,
        collaborative: Boolean(playlist.collaborative),
      });
    }
  }

  events.sort((a, b) => {
    if (a.addedAtMs !== b.addedAtMs) return a.addedAtMs - b.addedAtMs;
    const byPlaylist = a.playlistName.localeCompare(b.playlistName);
    if (byPlaylist !== 0) return byPlaylist;
    return a.name.localeCompare(b.name);
  });

  return events;
}

export function eventIdentity(event) {
  return `${event.addedAtMs}-${event.identity}-${event.playlistId}`;
}

export function eventKey(event, index = 0) {
  return `${eventIdentity(event)}-${index}`;
}
