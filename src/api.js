export async function fetchUserPlaylists(token) {
  const res = await fetch('https://api.spotify.com/v1/me/playlists', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.items;
}

export async function fetchPlaylistTracks(token, playlistId) {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.items;
}

export async function fetchArtistAlbums(token, artistId) {
  const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.items;
}

export async function fetchAlbumTracks(token, albumId) {
  const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.items;
}
