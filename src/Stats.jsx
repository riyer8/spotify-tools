import React, { useEffect, useState } from 'react';

export default function Stats({ token }) {
  const [playlists, setPlaylists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [artistCounts, setArtistCounts] = useState({});
  const [playlistCounts, setPlaylistCounts] = useState({});
  const [albumCounts, setAlbumCounts] = useState({});
  const [songPlaylistMap, setSongPlaylistMap] = useState({});
  const [playlistArtistMap, setPlaylistArtistMap] = useState({});
  const [playlistOverlap, setPlaylistOverlap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');
    fetchAllData().catch(e => setError(e.message));
  }, [token]);

  async function fetchAllData() {
    let allPlaylists = [];
    let url = 'https://api.spotify.com/v1/me/playlists?limit=50';
    while (url) {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch playlists');
      const data = await res.json();
      allPlaylists = allPlaylists.concat(data.items);
      url = data.next;
    }
    setPlaylists(allPlaylists);

    const songList = [];
    const artistMap = {};
    const playlistMap = {};
    const albumMap = {};
    const songToPlaylists = {};
    const playlistToArtists = {};
    const playlistToSongs = {};

    for (const pl of allPlaylists) {
      let tracks = [];
      let trackUrl = `https://api.spotify.com/v1/playlists/${pl.id}/tracks?limit=100`;
      while (trackUrl) {
        const res = await fetch(trackUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch tracks');
        const data = await res.json();
        tracks = tracks.concat(data.items || []);
        trackUrl = data.next;
      }

      playlistMap[pl.name] = tracks.length;
      playlistToArtists[pl.name] = new Set();
      playlistToSongs[pl.name] = new Set();

      tracks.forEach(item => {
        if (!item.track || !item.track.name) return;
        songList.push(item.track);

        const songKey =
          item.track.name +
          ' - ' +
          (item.track.artists?.map(a => a.name).join(', ') || '');
        songToPlaylists[songKey] = songToPlaylists[songKey] || new Set();
        songToPlaylists[songKey].add(pl.name);

        if (item.track.album && item.track.album.name) {
          albumMap[item.track.album.name] =
            (albumMap[item.track.album.name] || 0) + 1;
        }

        item.track.artists.forEach(artist => {
          artistMap[artist.name] = (artistMap[artist.name] || 0) + 1;
          playlistToArtists[pl.name].add(artist.name);
        });

        playlistToSongs[pl.name].add(songKey);
      });
    }

    setSongs(songList);
    setArtistCounts(artistMap);
    setPlaylistCounts(playlistMap);
    setAlbumCounts(albumMap);
    setSongPlaylistMap(songToPlaylists);
    setPlaylistArtistMap(playlistToArtists);

    // Calculate playlist overlap
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
            songs: Array.from(intersection),
          });
        }
      }
    }
    overlapArr.sort((a, b) => b.count - a.count);
    setPlaylistOverlap(overlapArr.slice(0, 5));
    setLoading(false);
  }

  // Top artists
  const sortedArtists = Object.entries(artistCounts).sort(
    (a, b) => b[1] - a[1]
  );
  // Top playlists
  const sortedPlaylists = Object.entries(playlistCounts).sort(
    (a, b) => b[1] - a[1]
  );
  // Top albums
  const sortedAlbums = Object.entries(albumCounts).sort(
    (a, b) => b[1] - a[1]
  );
  // Top songs overall
  const songCounts = {};
  songs.forEach(song => {
    if (!song.name) return;
    const songKey =
      song.name +
      ' - ' +
      (song.artists?.map(a => a.name).join(', ') || '');
    songCounts[songKey] = (songCounts[songKey] || 0) + 1;
  });
  const sortedSongs = Object.entries(songCounts).sort(
    (a, b) => b[1] - a[1]
  );
  // Top songs in multiple playlists
  const topMultiPlaylistSongs = Object.entries(songPlaylistMap)
    .map(([name, set]) => [name, set.size])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Most playlist-heavy artists
  const artistPlaylistCounts = {};
  Object.entries(playlistArtistMap).forEach(([pl, artistSet]) => {
    artistSet.forEach(artist => {
      artistPlaylistCounts[artist] =
        (artistPlaylistCounts[artist] || 0) + 1;
    });
  });
  const sortedArtistPlaylistCounts = Object.entries(
    artistPlaylistCounts
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Playlist diversity (unique artists per playlist)
  const playlistDiversity = Object.entries(playlistArtistMap)
    .map(([pl, artistSet]) => [pl, artistSet.size])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Spotify Stats
      </h1>
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            fontSize: '1.2em',
            color: '#888',
            marginTop: '40px',
          }}
        >
          Loading stats...
        </div>
      ) : error ? (
        <div
          style={{
            textAlign: 'center',
            color: 'red',
            marginTop: '40px',
          }}
        >
          Error: {error}
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              gap: '40px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                background: '#6baed6',
                padding: '20px',
                borderRadius: '12px',
                color: '#fff',
                minWidth: '150px',
                textAlign: 'center',
              }}
            >
              <h2>Total Songs</h2>
              <p style={{ fontSize: '28px', fontWeight: 'bold' }}>
                {songs.length}
              </p>
            </div>
            <div
              style={{
                background: '#fd8d3c',
                padding: '20px',
                borderRadius: '12px',
                color: '#fff',
                minWidth: '150px',
                textAlign: 'center',
              }}
            >
              <h2>Total Playlists</h2>
              <p style={{ fontSize: '28px', fontWeight: 'bold' }}>
                {playlists.length}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '40px',
              flexWrap: 'wrap',
              marginBottom: '40px',
            }}
          >
            {/* Top Artists */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3>Top Artists</h3>
              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '10px',
                }}
              >
                {sortedArtists.slice(0, 10).map(([name, count], idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: '1px solid #eee',
                      background:
                        idx < 3 ? '#e0f3ff' : 'transparent',
                    }}
                  >
                    <span>{name}</span>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: '#3182bd',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Songs */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3>Top Songs</h3>
              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '10px',
                }}
              >
                {sortedSongs.slice(0, 10).map(([name, count], idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: '1px solid #eee',
                      background:
                        idx < 3 ? '#e0ffe0' : 'transparent',
                    }}
                  >
                    <span>{name}</span>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: '#74c476',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Albums */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3>Most Common Albums</h3>
              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '10px',
                }}
              >
                {sortedAlbums.slice(0, 10).map(([name, count], idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: '1px solid #eee',
                      background:
                        idx < 3 ? '#fff4e0' : 'transparent',
                    }}
                  >
                    <span>{name}</span>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: '#fd8d3c',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '40px',
              flexWrap: 'wrap',
              marginBottom: '40px',
            }}
          >
            {/* Top Songs in Multiple Playlists */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3>Songs in Most Playlists</h3>
              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '10px',
                }}
              >
                {topMultiPlaylistSongs.map(([name, count], idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: '1px solid #eee',
                      background:
                        idx < 3 ? '#eaffea' : 'transparent',
                    }}
                  >
                    <span>{name}</span>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: '#228B22',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Playlist-Heavy Artists */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3>Artists in Most Playlists</h3>
              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '10px',
                }}
              >
                {sortedArtistPlaylistCounts.map(
                  ([name, count], idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 0',
                        borderBottom: '1px solid #eee',
                        background:
                          idx < 3 ? '#e0f3ff' : 'transparent',
                      }}
                    >
                      <span>{name}</span>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: '#3182bd',
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Playlist Diversity */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3>Most Diverse Playlists (Unique Artists)</h3>
              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '10px',
                }}
              >
                {playlistDiversity.map(([name, count], idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: '1px solid #eee',
                      background:
                        idx < 3 ? '#fff4e0' : 'transparent',
                    }}
                  >
                    <span>{name}</span>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: '#fd8d3c',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Playlist Overlap */}
          <div style={{ marginBottom: '40px' }}>
            <h3>Most Overlapping Playlists (Shared Songs)</h3>
            <div
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                background: '#fff',
                borderRadius: '12px',
                padding: '10px',
              }}
            >
              {playlistOverlap.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: '#6baed6',
                    }}
                  >
                    {item.pair[0]} &amp; {item.pair[1]}
                  </div>
                  <div
                    style={{
                      color: '#3182bd',
                      marginBottom: '4px',
                    }}
                  >
                    Shared Songs:{' '}
                    <span style={{ fontWeight: 'bold' }}>
                      {item.count}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.95em',
                      color: '#555',
                    }}
                  >
                    {item.songs.slice(0, 3).map((song, i) => (
                      <span key={i}>
                        {song}
                        {i < item.songs.slice(0, 3).length - 1
                          ? ', '
                          : ''}
                      </span>
                    ))}
                    {item.songs.length > 3 ? '...' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
