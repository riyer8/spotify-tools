import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function Graph({ token }) {
  const svgRef = useRef();
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  const [level, setLevel] = useState('artist');
  const [currentArtist, setCurrentArtist] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState(null);

  // ----------- Fetch initial artists + your public playlists -----------
    async function fetchArtists() {
    // 1. Get your profile (so we know your user ID)
    const profileRes = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
    });
    const profileData = await profileRes.json();
    const myUserId = profileData.id;

    // 2. Get all playlists
    const playlistsRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
    });
    const playlistsData = await playlistsRes.json();

    // 3. Filter to only YOUR public playlists
    const playlists = (playlistsData.items || []).filter(
        (pl) => pl.owner.id === myUserId && pl.public === true
    );

    const artistMap = {};
    const linkData = [];

    for (const pl of playlists) {
        const tracksRes = await fetch(
        `https://api.spotify.com/v1/playlists/${pl.id}/tracks?limit=100`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
        );
        const tracksData = await tracksRes.json();
        const tracks = tracksData.items || [];

        tracks.forEach((item) => {
        if (!item.track) return;
        item.track.artists.forEach((artist) => {
            if (!artistMap[artist.id])
            artistMap[artist.id] = {
                id: artist.id,
                name: artist.name,
                type: 'artist',
                count: 0,
            };
            artistMap[artist.id].count++;
            linkData.push({ source: artist.id, target: pl.id, value: 1 });
        });
        });
    }

    const artistNodes = Object.values(artistMap).map((a) => ({
        ...a,
        size: Math.min(50, 10 + a.count * 2),
    }));
    const playlistNodes = playlists.map((pl) => ({
        id: pl.id,
        name: pl.name,
        type: 'playlist',
        size: 25,
    }));

    setNodes([...artistNodes, ...playlistNodes]);
    setLinks(linkData);
    setLevel('artist');
    setCurrentArtist(null);
    setCurrentAlbum(null);
    }


  // ----------- Drill down to albums -----------
  async function fetchAlbums(artist) {
    const albumsRes = await fetch(
      `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const albumsData = await albumsRes.json();
    const albums = albumsData.items || [];

    const albumNodes = albums.map((al) => ({ id: al.id, name: al.name, type: 'album', size: 30 }));
    const linkData = albumNodes.map((al) => ({ source: artist.id, target: al.id, value: 1 }));

    const artistNode = {
      id: artist.id,
      name: artist.name,
      type: 'artist',
      size: Math.min(50, 10 + artist.count * 2),
    };

    setNodes([artistNode, ...albumNodes]);
    setLinks(linkData);
    setLevel('album');
    setCurrentArtist(artist);
  }

  // ----------- Drill down to tracks -----------
  async function fetchTracks(album) {
    const tracksRes = await fetch(`https://api.spotify.com/v1/albums/${album.id}/tracks?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tracksData = await tracksRes.json();
    const tracks = tracksData.items || [];

    const trackNodes = tracks.map((t) => ({ id: t.id, name: t.name, type: 'track', size: 20 }));
    const linkData = trackNodes.map((t) => ({ source: album.id, target: t.id, value: 1 }));

    const albumNode = { id: album.id, name: album.name, type: 'album', size: 30 };
    const artistNode = {
      id: currentArtist.id,
      name: currentArtist.name,
      type: 'artist',
      size: currentArtist.size,
    };

    setNodes([artistNode, albumNode, ...trackNodes]);
    setLinks(linkData);
    setLevel('track');
    setCurrentAlbum(album);
  }

  // ----------- Initial load -----------
  useEffect(() => {
    if (token) fetchArtists();
  }, [token]);

  // ----------- D3 rendering with zoom + pan -----------
  useEffect(() => {
    if (!nodes.length) return;

    const width = 1200;
    const height = 800;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create a container group for zoom/pan
    const container = svg.append('g');

    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(200))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = container
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => Math.sqrt(d.value));

    const node = container
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d) => d.size)
      .attr('fill', (d) => {
        switch (d.type) {
          case 'artist':
            return '#6baed6';
          case 'album':
            return '#fd8d3c';
          case 'track':
            return '#74c476';
          case 'playlist':
            return '#9fdf9f';
          default:
            return '#ccc';
        }
      })
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (d.type === 'artist') fetchAlbums(d);
        if (d.type === 'album') fetchTracks(d);
      })
      .call(
        d3
          .drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    const label = container
      .append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d) => d.name)
      .attr('font-size', 12)
      .attr('dy', '0.35em');

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);
      node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
      label.attr('x', (d) => d.x + 5).attr('y', (d) => d.y + 5);
    });

    // Enable zoom + pan
    svg.call(
      d3
        .zoom()
        .scaleExtent([0.2, 3]) // zoom limits
        .on('zoom', (event) => {
          container.attr('transform', event.transform);
        })
    );
  }, [nodes, links]);

  return <svg ref={svgRef} width="100%" height="100%"></svg>;
}
