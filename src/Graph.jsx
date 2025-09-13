import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function Graph({ token }) {
  const svgRef = useRef();
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  const [level, setLevel] = useState('artist');
  const [currentArtist, setCurrentArtist] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [hoveredTitle, setHoveredTitle] = useState('');

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
      setLevel('artist');
      setCurrentArtist(null);
      setCurrentAlbum(null);
    }

    const artistNodes = Object.values(artistMap).map(a => ({ ...a, size: Math.min(80, 20 + a.count * 3) }));
    const playlistNodes = playlists.map(pl => ({ id: pl.id, name: pl.name, type: 'playlist', size: 40 }));

    setNodes([...artistNodes, ...playlistNodes]);
    setLinks(linkData);
  }

  async function fetchAlbums(artist) {
    const albumsRes = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single`, { headers: { Authorization: `Bearer ${token}` } });
    const albumsData = await albumsRes.json();
    const albums = albumsData.items || [];

    const albumNodes = albums.map(al => ({ id: al.id, name: al.name, type: 'album', size: 50 }));

    const linkData = albumNodes.map(al => ({ source: artist.id, target: al.id, value: 1 }));
    const artistNode = { id: artist.id, name: artist.name, type: 'artist', size: Math.min(80, 20 + artist.count * 3) };

    setNodes([artistNode, ...albumNodes]);
    setLinks(linkData);
    setLevel('album');
    setCurrentArtist(artist);
    setCurrentAlbum(null);
  }

  async function fetchTracks(album) {
    const tracksRes = await fetch(`https://api.spotify.com/v1/albums/${album.id}/tracks`, { headers: { Authorization: `Bearer ${token}` } });
    const tracksData = await tracksRes.json();
    const tracks = tracksData.items || [];

    const trackNodes = tracks.map(t => ({ id: t.id, name: t.name, type: 'track', size: 35 }));
    const linkData = trackNodes.map(t => ({ source: album.id, target: t.id, value: 1 }));

    const albumNode = { id: album.id, name: album.name, type: 'album', size: 50 };
    const artistNode = { id: currentArtist.id, name: currentArtist.name, type: 'artist', size: currentArtist.size };


    setNodes([artistNode, albumNode, ...trackNodes]);
    setLinks(linkData);
    setLevel('track');
    setCurrentAlbum(album);
  }

  function handleBack() {
    if (level === 'track') {
      fetchAlbums(currentArtist);
    } else if (level === 'album') {
      fetchArtists();
    } else if (onBack) {
      onBack();
    }
  }

  useEffect(() => {
    if (!nodes.length) return;

    const width = 1200;
    const height = 800;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    let currentZoom = 1;

    const container = svg.append('g');

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

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(200)
      )
      .force('charge', d3.forceManyBody()
        .strength(-300)
      )
      .force('collision', d3.forceCollide().radius(d => d.size + 10))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .alpha(0.6)
      .alphaMin(0.01)
      .velocityDecay(0.6);


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
          .on('start', (event, d) => { 
            if (!event.active) simulation.alphaTarget(0.1).restart(); // lower alpha target
            d.fx = d.x; d.fy = d.y; 
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => { 
            if (!event.active) simulation.alphaTarget(0); 
            d.fx = null; d.fy = null; 
          })
      )
      .on('click', (event, d) => {
        if (d.type === 'artist') fetchAlbums(d);
        if (d.type === 'album') fetchTracks(d);
      })
      .on('mouseover', (event, d) => {
        setHoveredTitle(d.name);
      })
      .on('mouseout', () => {
        setHoveredTitle('');
      })

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
      .style('pointer-events', 'none')
      .attr('class', 'node-label');

    function getOptimalFontSize(text, radius, minFontSize = 8, maxFontSize = 20) {
      const words = text.split(' ');
      const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, '');
      let fontSize = Math.max(minFontSize, Math.min(maxFontSize, radius / 2));
      const maxPixelWidth = (radius * 2 - 8);

      while ((longestWord.length * fontSize * 0.6) > maxPixelWidth && fontSize > minFontSize) {
        fontSize -= 1;
      }
      return fontSize;
    }

    function wrapTextToWidth(text, fontSize, maxWidth) {
      const avgCharWidth = fontSize * 0.6;
      const maxCharsPerLine = Math.max(2, Math.floor(maxWidth / avgCharWidth));
      let words = text.split(' ');
      let lines = [];
      let line = '';

      for (let word of words) {
        let testLine = line ? line + ' ' + word : word;
        if (testLine.length > maxCharsPerLine) {
          if (line) lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }
      if (line) lines.push(line);

      lines = lines.flatMap(l => {
        if (l.length > maxCharsPerLine) {
          let broken = [];
          for (let i = 0; i < l.length; i += maxCharsPerLine) {
            broken.push(l.slice(i, i + maxCharsPerLine));
          }
          return broken;
        }
        return l;
      });

      return lines;
    }

    function updateLabels() {
      nodeGroup.select('text.node-label')
        .each(function(d) {
          const radius = d.size;
          const minFontSize = 8;
          const maxFontSize = 20;
          const fontSize = getOptimalFontSize(d.name, radius, minFontSize, maxFontSize);
          d3.select(this).style('font-size', fontSize + 'px');

          const maxPixelWidth = (radius * 2 - 8);

          let lines = wrapTextToWidth(d.name, fontSize, maxPixelWidth);

          const lineHeight = fontSize * 1.1;
          const maxLines = Math.floor((radius * 2) / lineHeight);

          if (lines.length > maxLines) {
            lines = lines.slice(0, maxLines);
            let last = lines[maxLines - 1];
            if (last.length > 2) last = last.slice(0, Math.max(0, last.length - 2)) + '…';
            lines[maxLines - 1] = last;
          }

          d3.select(this).text(null);

          const totalHeight = lines.length * lineHeight;
          const startY = -totalHeight / 2 + lineHeight / 2;

          lines.forEach((line, i) => {
            d3.select(this)
              .append('tspan')
              .attr('x', 0)
              .attr('y', 0)
              .attr('dy', `${startY + i * lineHeight}px`)
              .text(line);
          });
        });
    }

    updateLabels();

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    svg.call(
      d3.zoom()
        .scaleExtent([0.2, 3])
        .on('zoom', (event) => {
          container.attr('transform', event.transform);
          currentZoom = event.transform.k;
          updateLabels();
        })
    );
  }, [nodes, links]);

  const fullTitle =
    hoveredTitle ||
    (level === 'album' && currentArtist?.name) ||
    (level === 'track' && currentAlbum?.name) ||
    '';

  let titleBg = '#fff4e0';
  let titleColor = '#fd8d3c';
  if (hoveredTitle) {
    const hoveredNode = nodes.find(n => n.name === hoveredTitle);
    if (hoveredNode) {
      switch (hoveredNode.type) {
        case 'artist':
          titleBg = '#e0f3ff';
          titleColor = '#3182bd';
          break;
        case 'album':
          titleBg = '#fff4e0';
          titleColor = '#fd8d3c';
          break;
        case 'track':
          titleBg = '#e0ffe0';
          titleColor = '#74c476';
          break;
        case 'playlist':
          titleBg = '#eaffea';
          titleColor = '#228B22';
          break;
        default:
          titleBg = '#f0f0f0';
          titleColor = '#333';
      }
    }
  } else if (level === 'album') {
    titleBg = '#fff4e0';
    titleColor = '#fd8d3c';
  } else if (level === 'track') {
    titleBg = '#e0f3ff';
    titleColor = '#3182bd';
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {fullTitle && (
        <div
          style={{
            position: 'absolute',
            top: 30,
            left: 30,
            background: titleBg,
            color: titleColor,
            borderRadius: '8px',
            padding: '0.7em 1.5em',
            fontSize: '1.1em',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 11,
            maxWidth: '600px',
            minWidth: '120px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {fullTitle}
        </div>
      )}
      {(level !== 'artist') && (
        <button
          onClick={handleBack}
          style={{
            position: 'absolute',
            top: 70,
            left: 30,
            padding: '0.7em 1.5em',
            fontSize: '1.1em',
            background: '#fd8d3c',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          ← Back
        </button>
      )}
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}