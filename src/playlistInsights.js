export function songKey(track) {
  return `${track.name} — ${track.artists?.map(a => a.name).join(', ') || ''}`;
}

export function computePlaylistSummaries(playlists, tracksByPlaylistId) {
  return playlists.map(pl => {
    const tracks = tracksByPlaylistId[pl.id] || [];
    const artistCounts = {};

    tracks.forEach(track => {
      track.artists?.forEach(artist => {
        artistCounts[artist.name] = (artistCounts[artist.name] || 0) + 1;
      });
    });

    const topArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      ...pl,
      trackCount: tracks.length,
      artistCount: Object.keys(artistCounts).length,
      topArtists,
      tracks,
    };
  }).sort((a, b) => b.trackCount - a.trackCount);
}

export function computeTopArtists(playlists, tracksByPlaylistId, limit = 20) {
  const artistMap = {};
  const playlistNamesByArtist = {};

  playlists.forEach(pl => {
    const seen = new Set();
    (tracksByPlaylistId[pl.id] || []).forEach(track => {
      track.artists?.forEach(artist => {
        artistMap[artist.id] = artistMap[artist.id] || {
          id: artist.id,
          name: artist.name,
          trackCount: 0,
          playlistCount: 0,
        };
        artistMap[artist.id].trackCount++;
        playlistNamesByArtist[artist.id] = playlistNamesByArtist[artist.id] || new Set();
        if (!seen.has(artist.id)) {
          seen.add(artist.id);
          artistMap[artist.id].playlistCount++;
          playlistNamesByArtist[artist.id].add(pl.name);
        }
      });
    });
  });

  return Object.values(artistMap)
    .map(a => ({
      ...a,
      playlistNames: [...(playlistNamesByArtist[a.id] || [])],
      avgTracksPerPlaylist: a.playlistCount
        ? +(a.trackCount / a.playlistCount).toFixed(1)
        : 0,
    }))
    .sort((a, b) => b.trackCount - a.trackCount)
    .slice(0, limit);
}

export function computeArtistInsights(playlists, tracksByPlaylistId) {
  const all = computeTopArtists(playlists, tracksByPlaylistId, 200);
  const totalTracks = playlists.reduce(
    (sum, pl) => sum + (tracksByPlaylistId[pl.id]?.length || 0),
    0
  );

  const withShare = all.map(a => ({
    ...a,
    trackShare: totalTracks ? +((a.trackCount / totalTracks) * 100).toFixed(1) : 0,
  }));

  return {
    totalTracks,
    heavyHitters: [...withShare].sort((a, b) => b.trackCount - a.trackCount).slice(0, 12),
    staples: [...withShare].sort((a, b) => b.playlistCount - a.playlistCount || b.trackCount - a.trackCount).slice(0, 12),
    exclusives: withShare
      .filter(a => a.playlistCount === 1)
      .sort((a, b) => b.trackCount - a.trackCount)
      .slice(0, 12),
  };
}
