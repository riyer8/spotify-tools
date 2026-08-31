export const PLAYLIST_FILTERS = [
  {
    id: 'solo-private',
    label: 'Mine — private, no collaborators',
    description: 'Playlists you own, private, and not shared with collaborators',
  },
  {
    id: 'solo',
    label: 'Mine — no collaborators',
    description: 'Playlists you own that are not collaborative (includes public)',
  },
  {
    id: 'owned-private',
    label: 'Mine — all private',
    description: 'Every private playlist you own, including collaborative ones',
  },
  {
    id: 'owned-public',
    label: 'Mine — all public',
    description: 'Every public playlist you own',
  },
  {
    id: 'owned',
    label: 'All mine',
    description: 'Every playlist you own',
  },
  {
    id: 'followed',
    label: 'Followed / by others',
    description: 'Playlists in your library owned by someone else',
  },
  {
    id: 'all',
    label: 'Everything in my library',
    description: 'All playlists in your library',
  },
];

const DEFAULT_FILTER = 'solo-private';

export function getDefaultFilter() {
  return localStorage.getItem('playlist_filter') || DEFAULT_FILTER;
}

export function saveFilter(filterId) {
  localStorage.setItem('playlist_filter', filterId);
}

function isOwned(playlist, userId) {
  return playlist.owner?.id === userId;
}

function isPrivate(playlist) {
  return playlist.public === false;
}

function isSolo(playlist) {
  return !playlist.collaborative;
}

export function filterPlaylists(playlists, filterId, userId) {
  switch (filterId) {
    case 'solo-private':
      return playlists.filter(pl => isOwned(pl, userId) && isPrivate(pl) && isSolo(pl));
    case 'solo':
      return playlists.filter(pl => isOwned(pl, userId) && isSolo(pl));
    case 'owned-private':
      return playlists.filter(pl => isOwned(pl, userId) && isPrivate(pl));
    case 'owned-public':
      return playlists.filter(pl => isOwned(pl, userId) && pl.public === true);
    case 'owned':
      return playlists.filter(pl => isOwned(pl, userId));
    case 'followed':
      return playlists.filter(pl => !isOwned(pl, userId));
    case 'all':
    default:
      return playlists;
  }
}

export function getFilterLabel(filterId) {
  return PLAYLIST_FILTERS.find(f => f.id === filterId)?.label || 'Filtered playlists';
}
