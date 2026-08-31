export function computeStats(playlists, tracksByPlaylistId) {
  const songList = [];
  const artistMap = {};
  const playlistMap = {};
  const albumMap = {};
  const songToPlaylists = {};
  const playlistToArtists = {};
  const playlistToSongs = {};
  const uniqueSongKeys = new Set();

  for (const pl of playlists) {
    const items = tracksByPlaylistId[pl.id] || [];
    playlistMap[pl.name] = items.length;
    playlistToArtists[pl.name] = new Set();
    playlistToSongs[pl.name] = new Set();

    items.forEach(track => {
      if (!track?.name) return;

      songList.push(track);

      const key = `${track.name} — ${track.artists?.map(a => a.name).join(', ') || ''}`;
      uniqueSongKeys.add(key);
      songToPlaylists[key] = songToPlaylists[key] || new Set();
      songToPlaylists[key].add(pl.name);

      if (track.album?.name) {
        albumMap[track.album.name] = (albumMap[track.album.name] || 0) + 1;
      }

      track.artists?.forEach(artist => {
        artistMap[artist.name] = (artistMap[artist.name] || 0) + 1;
        playlistToArtists[pl.name].add(artist.name);
      });

      playlistToSongs[pl.name].add(key);
    });
  }

  const overlapArr = [];
  const playlistNames = Object.keys(playlistToSongs);
  for (let i = 0; i < playlistNames.length; i++) {
    for (let j = i + 1; j < playlistNames.length; j++) {
      const a = playlistNames[i];
      const b = playlistNames[j];
      const setA = playlistToSongs[a];
      const setB = playlistToSongs[b];
      const intersection = new Set([...setA].filter(x => setB.has(x)));
      if (intersection.size > 0) {
        overlapArr.push({
          pair: [a, b],
          count: intersection.size,
          pctA: Math.round((intersection.size / setA.size) * 100),
          pctB: Math.round((intersection.size / setB.size) * 100),
          songs: Array.from(intersection),
        });
      }
    }
  }
  overlapArr.sort((a, b) => b.count - a.count);

  const songCounts = {};
  songList.forEach(song => {
    if (!song.name) return;
    const key = `${song.name} — ${song.artists?.map(a => a.name).join(', ') || ''}`;
    songCounts[key] = (songCounts[key] || 0) + 1;
  });

  const artistPlaylistCounts = {};
  Object.entries(playlistToArtists).forEach(([, artistSet]) => {
    artistSet.forEach(artist => {
      artistPlaylistCounts[artist] = (artistPlaylistCounts[artist] || 0) + 1;
    });
  });

  const multiPlaylistSongs = Object.values(songToPlaylists).filter(s => s.size > 1).length;
  const playlistSizes = Object.entries(playlistMap).sort((a, b) => b[1] - a[1]);
  const loyalArtist = Object.entries(artistPlaylistCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    songs: songList,
    artistCounts: artistMap,
    playlistCounts: playlistMap,
    albumCounts: albumMap,
    songPlaylistMap: songToPlaylists,
    playlistArtistMap: playlistToArtists,
    playlistOverlap: overlapArr.slice(0, 5),
    sortedArtists: Object.entries(artistMap).sort((a, b) => b[1] - a[1]),
    sortedSongs: Object.entries(songCounts).sort((a, b) => b[1] - a[1]),
    sortedAlbums: Object.entries(albumMap).sort((a, b) => b[1] - a[1]),
    topMultiPlaylistSongs: Object.entries(songToPlaylists)
      .map(([name, set]) => [name, set.size])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    sortedArtistPlaylistCounts: Object.entries(artistPlaylistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    playlistDiversity: Object.entries(playlistToArtists)
      .map(([pl, artistSet]) => [pl, artistSet.size])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    uniqueArtists: Object.keys(artistMap).length,
    uniqueAlbums: Object.keys(albumMap).length,
    uniqueSongs: uniqueSongKeys.size,
    avgTracksPerPlaylist: playlists.length
      ? Math.round(songList.length / playlists.length)
      : 0,
    duplicateSongCount: multiPlaylistSongs,
    duplicateRate: uniqueSongKeys.size
      ? Math.round((multiPlaylistSongs / uniqueSongKeys.size) * 100)
      : 0,
    loyalArtist: loyalArtist ? { name: loyalArtist[0], playlistCount: loyalArtist[1] } : null,
    biggestPlaylist: playlistSizes[0] ? { name: playlistSizes[0][0], count: playlistSizes[0][1] } : null,
    smallestPlaylist: playlistSizes.length
      ? { name: playlistSizes[playlistSizes.length - 1][0], count: playlistSizes[playlistSizes.length - 1][1] }
      : null,
    redundancyRatio: uniqueSongKeys.size
      ? (songList.length / uniqueSongKeys.size).toFixed(1)
      : '1.0',
  };
}
