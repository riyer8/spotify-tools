import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function Graph({ token }) {
  const svgRef = useRef();
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  const [level, setLevel] = useState('artist');
  const [currentArtist, setCurrentArtist] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState(null);

  useEffect(() => {
    if (token) fetchArtists();
  }, [token]);

  async function fetchArtists() {
    const profileRes = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } });
    const profileData = await profileRes.json();
    const myUserId = profileData.id;

    const playlistsRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', { headers: { Authorization: `Bearer ${token}` } });
    const playlistsData = await playlistsRes.json();

    const playlists = (playlistsData.items || []).filter(pl => pl.owner.id === myUserId && pl.public);

    const artistMap = {};
    const linkData = [];

    for (const pl of playlists) {
      const tracksRes = await fetch(`https://api.spotify.com/v1/playlists/${pl.id}/tracks?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
      const tracksData = await tracksRes.json();
      const tracks = tracksData.items || [];

      tracks.forEach(item => {
        if (!item.track) return;
        item.track.artists.forEach(artist => {
          if (!artistMap[artist.id]) artistMap[artist.id] = { id: artist.id, name: artist.name, type: 'artist', count: 0 };
          artistMap[artist.id].count++;
          linkData.push({ source: artist.id, target: pl.id, value: 1 });
        });
      });
    }

    const artistNodes = Object.values(artistMap).map(a => ({ ...a, size: Math.min(50, 10 + a.count * 2) }));
    const playlistNodes = playlists.map(pl => ({ id: pl.id, name: pl.name, type: 'playlist', size: 25 }));

    setNodes([...artistNodes, ...playlistNodes]);
    setLinks(linkData);
  }

  async function fetchAlbums(artist) {
    const albumsRes = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&limit=50`, { headers: { Authorization: `Bearer ${token}` } });
    const albumsData = await albumsRes.json();
    const albums = albumsData.items || [];

    const albumNodes = albums.map(al => ({ id: al.id, name: al.name, type: 'album', size: 30 }));
    const linkData = albumNodes.map(al => ({ source: artist.id, target: al.id, value: 1 }));

    const artistNode = { id: artist.id, name: artist.name, type: 'artist', size: Math.min(50, 10 + artist.count * 2) };

    setNodes([artistNode, ...albumNodes]);
    setLinks(linkData);
    setLevel('album');
    setCurrentArtist(artist);
  }

  async function fetchTracks(album) {
    const tracksRes = await fetch(`https://api.spotify.com/v1/albums/${album.id}/tracks?limit=50`, { headers: { Authorization: `Bearer ${token}` } });
    const tracksData = await tracksRes.json();
    const tracks = tracksData.items || [];

    const trackNodes = tracks.map(t => ({ id: t.id, name: t.name, type: 'track', size: 20 }));
    const linkData = trackNodes.map(t => ({ source: album.id, target: t.id, value: 1 }));

    const albumNode = { id: album.id, name: album.name, type: 'album', size: 30 };
    const artistNode = { id: currentArtist.id, name: currentArtist.name, type: 'artist', size: currentArtist.size };

    setNodes([artistNode, albumNode, ...trackNodes]);
    setLinks(linkData);
    setLevel('track');
    setCurrentAlbum(album);
  }

  useEffect(() => {
    if (!nodes.length) return;

    const width = 1200;
    const height = 800;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svg.append('g');

    // ---------- Tooltip box ----------
    const tooltipGroup = svg.append('g').style('pointer-events', 'none');
    const tooltipBox = tooltipGroup.append('rect')
      .attr('x', 20)
      .attr('y', 20)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('width', 300)
      .attr('height', 30)
      .attr('fill', '#fff')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .style('opacity', 0);

    const tooltipText = tooltipGroup.append('text')
      .attr('x', 30)
      .attr('y', 40)
      .attr('fill', '#000')
      .style('font-size', '14px')
      .style('font-weight', 'bold');

    // ---------- Simulation ----------
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(200))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = container.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value));

    const nodeGroup = container.selectAll('g.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(
        d3.drag()
          .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on('click', (event, d) => {
        if (d.type === 'artist') fetchAlbums(d);
        if (d.type === 'album') fetchTracks(d);
      })
      .on('mouseover', (event, d) => {
        tooltipBox.style('opacity', 1);
        tooltipText.text(d.name);
      })
      .on('mouseout', () => {
        tooltipBox.style('opacity', 0);
        tooltipText.text('');
      });

    nodeGroup.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => {
        switch (d.type) {
          case 'artist': return '#6baed6';
          case 'album': return '#fd8d3c';
          case 'track': return '#74c476';
          case 'playlist': return '#9fdf9f';
          default: return '#ccc';
        }
      });

    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('pointer-events', 'none')
      .style('font-size', d => Math.max(8, d.size / 3) + 'px')
      .text(d => {
        const radius = d.size;
        const maxWidth = radius * 2;
        const approxCharWidth = 6;
        const maxChars = Math.floor(maxWidth / approxCharWidth);
        if (d.name.length <= maxChars) return d.name;
        const parts = d.name.split(' ');
        if (parts.length > 1 && parts[0].length <= maxChars) return parts[0];
        return d.name[0];
      });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    svg.call(d3.zoom().scaleExtent([0.2, 3]).on('zoom', (event) => container.attr('transform', event.transform)));

  }, [nodes, links]);

  return <svg ref={svgRef} width="100%" height="100%"></svg>;
}
