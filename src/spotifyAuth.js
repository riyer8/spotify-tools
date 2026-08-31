const REDIRECT_URI = import.meta.env.VITE_FRONTEND_LINK;

export function redirectToSpotifyAuth(clientId) {
  const scopes = [
    'user-library-read',
    'playlist-read-private',
  ];

  const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes.join(' '))}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  window.location = url;
}
