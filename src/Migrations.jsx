import React, { useEffect, useMemo, useState } from 'react';
import { flattenLibraryEvents } from './experiences/events';
import {
  KIND_LABEL,
  RIVER_BANK_CAP,
  ROOM_LIST_CAP,
  buildMigrationStory,
  buildMigrationsIndex,
  buildRoomIndex,
  formatDisplayDate,
  formatMonthYear,
  formatSpanShort,
  hairlinesFor,
  pathTeaser,
  roomMatchesQuery,
  searchMigrations,
  spotifyTrackUrl,
  visibleStays,
} from './experiences/migrations';
import { playlistColor } from './experiences/nights';
import { getFilterLabel } from './playlistFilters';
import './Migrations.css';

const WATERLINE = 128;
const BANK_W = 148;
const PAD_X = 56;

function riverBezier(points, bow) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const mid = (a.x + b.x) / 2;
    d += ` C ${mid.toFixed(1)} ${(a.y - bow).toFixed(1)}, ${mid.toFixed(1)} ${(b.y - bow).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return d;
}

function bankPoints(stays) {
  return stays.map((stay, index) => ({
    stay,
    x: PAD_X + index * BANK_W,
    y: WATERLINE,
  }));
}

function hairlinePoints(migration, bankByPlaylist) {
  const points = [];
  for (const stay of migration.stays) {
    const bank = bankByPlaylist.get(stay.playlistId);
    if (bank) points.push(bank);
  }
  return points;
}

function River({
  migration,
  hairlines,
  expanded,
  onExpand,
  onSelectBank,
  onSelectHairline,
  activePlaylistId,
}) {
  const stays = visibleStays(migration, expanded);
  const hidden = migration.stays.length - stays.length;
  const points = bankPoints(stays);
  const width = Math.max(640, PAD_X * 2 + Math.max(stays.length - 1, 1) * BANK_W);
  const bankByPlaylist = new Map(points.map(point => [point.stay.playlistId, point]));
  const heroPath = riverBezier(points, 54);
  const svgId = `river-${migration.id}`;

  return (
    <div className="mig-river-scroll">
      <svg
        className="mig-river"
        viewBox={`0 0 ${width} 200`}
        width={width}
        height="200"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${svgId}-stroke`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#509bf5" />
            <stop offset="55%" stopColor="#b49bc8" />
            <stop offset="100%" stopColor="#1db954" />
          </linearGradient>
        </defs>

        <path className="mig-water" d={`M 0 ${WATERLINE + 36} Q ${width / 2} ${WATERLINE + 70} ${width} ${WATERLINE + 28}`} />

        {hairlines.map((other, idx) => {
          const pts = hairlinePoints(other, bankByPlaylist);
          if (pts.length < 2) return null;
          const d = riverBezier(pts, 28 + (idx % 6) * 8);
          return (
            <g key={other.id} className="mig-hairline-group" onClick={() => onSelectHairline(other)}>
              <path d={d} className="mig-hairline-hit" />
              <path d={d} className="mig-hairline">
                <title>{`${other.name} · ${other.artistKey}`}</title>
              </path>
            </g>
          );
        })}

        <path className="mig-hero-path" pathLength="1" d={heroPath} stroke={`url(#${svgId}-stroke)`} />

        {points.map((point, idx) => {
          const active = point.stay.playlistId === activePlaylistId;
          return (
            <g
              key={`${point.stay.playlistId}-${idx}`}
              className={`mig-bank${active ? ' is-active' : ''}`}
              onClick={() => onSelectBank(point.stay)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                className="mig-bank-disc"
                cx={point.x}
                cy={point.y}
                r={active ? 9 : 7}
                fill={playlistColor(point.stay.playlistId)}
              />
              <text
                className="mig-bank-name"
                x={point.x}
                y={point.y - (wrapBankName(point.stay.playlistName).length > 1 ? 44 : 28)}
                textAnchor="middle"
              >
                {wrapBankName(point.stay.playlistName).map((line, lineIdx) => (
                  <tspan key={line} x={point.x} dy={lineIdx === 0 ? 0 : 14}>{line}</tspan>
                ))}
              </text>
              <text className="mig-bank-date" x={point.x} y={point.y + 28} textAnchor="middle">
                {formatMonthYear(point.stay.addedAt)}
              </text>
            </g>
          );
        })}
      </svg>
      {hidden > 0 && (
        <button type="button" className="mig-expand-river" onClick={onExpand}>
          Show every room · {hidden} more
        </button>
      )}
    </div>
  );
}

function wrapBankName(name) {
  const text = name || 'playlist';
  if (text.length <= 16) return [text];
  const words = text.split(' ');
  if (words.length === 1) return [`${text.slice(0, 15)}…`];
  const mid = Math.ceil(words.length / 2);
  const top = words.slice(0, mid).join(' ');
  const bottom = words.slice(mid).join(' ');
  return [
    top.length > 18 ? `${top.slice(0, 17)}…` : top,
    bottom.length > 18 ? `${bottom.slice(0, 17)}…` : bottom,
  ];
}

function SongRailItem({ migration, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`mig-rail-item${selected ? ' is-selected' : ''}`}
      onClick={() => onSelect(migration.id)}
      aria-current={selected ? 'true' : undefined}
    >
      <span className="mig-rail-title">{migration.name}</span>
      <span className="mig-rail-artist">{migration.artistKey || 'Unknown artist'}</span>
      <span className="mig-rail-path">{pathTeaser(migration.path)}</span>
      <span className="mig-rail-meta">
        <em>{formatSpanShort(migration.spanMs)}</em>
        {migration.kind !== 'graduation' && (
          <span className={`mig-kind mig-kind-${migration.kind}`}>{KIND_LABEL[migration.kind]}</span>
        )}
      </span>
    </button>
  );
}

function RoomRailItem({ room, selected, onSelect }) {
  const flow = room.arrived.length + room.left.length;
  return (
    <button
      type="button"
      className={`mig-rail-item${selected ? ' is-selected' : ''}`}
      onClick={() => onSelect(room.playlistId)}
      aria-current={selected ? 'true' : undefined}
    >
      <span className="mig-rail-title">{room.playlistName}</span>
      <span className="mig-rail-path">
        {room.arrived.length} arrived · {room.left.length} left
      </span>
      <span className="mig-rail-meta"><em>{flow} hops</em></span>
    </button>
  );
}

function FlowRow({ hop, direction, onSelect }) {
  const other = direction === 'in' ? hop.fromStay : hop.intoStay;
  return (
    <button type="button" className="mig-flow-row" onClick={() => onSelect(hop.migration.id)}>
      <span className="mig-flow-song">{hop.migration.name}</span>
      <span className="mig-flow-detail">
        {direction === 'in' ? 'from' : 'to'} {other.playlistName}
        {' · '}
        {formatDisplayDate(hop.intoStay.addedAt)}
      </span>
    </button>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="mig-page mig-page-empty">
      <div className="mig-empty">
        <p><strong>{title}</strong></p>
        <p>{body}</p>
      </div>
    </div>
  );
}

export default function Migrations({
  library,
  filteredPlaylists,
  filter,
  loading,
  error,
}) {
  const filterLabel = getFilterLabel(filter);
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'rooms' ? 'rooms' : 'songs';
  });
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => new Set(['graduated']));

  const events = useMemo(
    () => flattenLibraryEvents(filteredPlaylists, library?.tracksByPlaylistId),
    [filteredPlaylists, library]
  );

  const index = useMemo(() => buildMigrationsIndex(events), [events]);
  const rooms = useMemo(() => buildRoomIndex(index.all), [index.all]);

  const searched = useMemo(
    () => searchMigrations(index.all, query),
    [index.all, query]
  );

  const songGroups = useMemo(
    () => searched || {
      graduated: index.graduated,
      wanderers: index.wanderers,
      quick: index.quick,
    },
    [searched, index]
  );

  const selected = useMemo(
    () => index.all.find(item => item.id === selectedId) || songGroups.graduated[0] || index.all[0] || null,
    [index.all, selectedId, songGroups.graduated]
  );

  const selectedRoom = useMemo(
    () => rooms.all.find(room => room.playlistId === selectedRoomId) || rooms.featured[0] || null,
    [rooms, selectedRoomId]
  );

  const hairlines = useMemo(
    () => (view === 'songs' && selected ? hairlinesFor(selected, index.all) : []),
    [view, selected, index.all]
  );

  const story = selected ? buildMigrationStory(selected) : null;

  const visibleSongs = useMemo(() => {
    const list = [];
    if (openGroups.has('graduated')) list.push(...songGroups.graduated);
    if (openGroups.has('wanderers')) list.push(...songGroups.wanderers);
    if (openGroups.has('quick')) list.push(...songGroups.quick);
    return list;
  }, [openGroups, songGroups]);

  const roomMatches = useMemo(
    () => rooms.featured.filter(room => roomMatchesQuery(room, query)),
    [rooms.featured, query]
  );

  useEffect(() => {
    setExpanded(false);
  }, [selectedId]);

  useEffect(() => {
    if (!query.trim()) return;
    if (view === 'songs') {
      const first = songGroups.graduated[0] || songGroups.wanderers[0] || songGroups.quick[0];
      if (first && !visibleSongs.some(item => item.id === selectedId)) {
        setSelectedId(first.id);
        setOpenGroups(new Set(['graduated', 'wanderers', 'quick']));
      }
    }
  }, [query, view, songGroups, visibleSongs, selectedId]);

  useEffect(() => {
    function onKey(e) {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key !== 'j' && e.key !== 'k' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const nextDir = e.key === 'j' || e.key === 'ArrowDown' ? 1 : -1;
      e.preventDefault();
      if (view === 'rooms') {
        if (!roomMatches.length || !selectedRoom) return;
        const i = roomMatches.findIndex(room => room.playlistId === selectedRoom.playlistId);
        const next = roomMatches[Math.min(roomMatches.length - 1, Math.max(0, i + nextDir))];
        if (next) setSelectedRoomId(next.playlistId);
        return;
      }
      if (!visibleSongs.length || !selected) return;
      const i = visibleSongs.findIndex(item => item.id === selected.id);
      const next = visibleSongs[Math.min(visibleSongs.length - 1, Math.max(0, i + nextDir))];
      if (next) setSelectedId(next.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, roomMatches, selectedRoom, visibleSongs, selected]);

  function toggleGroup(id) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openSong(id) {
    setSelectedId(id);
    setView('songs');
    setExpanded(false);
  }

  function openRoom(playlistId) {
    setSelectedRoomId(playlistId);
    setView('rooms');
  }

  function openRoomFromStay(stay) {
    openRoom(stay.playlistId);
  }

  if (loading && !library) return null;

  if (error && !library) {
    return <EmptyState title="Could not load migrations" body={error} />;
  }

  if (!filteredPlaylists.length) {
    return (
      <EmptyState
        title="No playlists match this filter"
        body={`Try a different selection — currently showing: ${filterLabel}`}
      />
    );
  }

  if (!events.length) {
    return (
      <EmptyState
        title="Migrations need the date you added each song"
        body="Refresh the library to pull add dates from Spotify. Until then, nothing can move."
      />
    );
  }

  if (!index.all.length) {
    return (
      <EmptyState
        title="Nothing has lived in two rooms yet"
        body="Followed-only filters hide a lot of this. Try a wider slice of playlists you own."
      />
    );
  }

  const href = selected ? spotifyTrackUrl(selected.trackId) : null;
  const stayList = selected ? visibleStays(selected, expanded) : [];
  const arrived = selectedRoom?.arrived.slice(0, ROOM_LIST_CAP) || [];
  const left = selectedRoom?.left.slice(0, ROOM_LIST_CAP) || [];

  return (
    <div className="mig-page">
      <aside className="mig-rail">
        <div className="mig-rail-head">
          <h2>Migrations</h2>
          <p>
            {view === 'songs'
              ? `${index.counts.graduated.toLocaleString()} lives · ${filterLabel}`
              : `${rooms.featured.length} rooms with traffic`}
            {index.promoted ? ' · quieter library' : ''}
          </p>
          <div className="mig-toggle" role="tablist" aria-label="Migrations view">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'songs'}
              className={view === 'songs' ? 'is-on' : ''}
              onClick={() => setView('songs')}
            >
              Songs
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'rooms'}
              className={view === 'rooms' ? 'is-on' : ''}
              onClick={() => {
                setView('rooms');
                if (!selectedRoomId && selected) setSelectedRoomId(selected.first.playlistId);
              }}
            >
              Rooms
            </button>
          </div>
          <label className="mig-rail-search">
            <span className="sr-only">{view === 'songs' ? 'Filter lives' : 'Filter rooms'}</span>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={view === 'songs' ? 'Song, artist, room…' : 'Room name…'}
            />
          </label>
        </div>

        <div className="mig-rail-scroll">
          {view === 'songs' && (
            <>
              {searched && (
                <p className="mig-rail-empty">{searched.total} match{searched.total === 1 ? '' : 'es'}</p>
              )}
              <RailGroup
                id="graduated"
                label="Graduated"
                count={songGroups.graduated.length}
                open={openGroups.has('graduated')}
                onToggle={toggleGroup}
              >
                {songGroups.graduated.map(item => (
                  <SongRailItem
                    key={item.id}
                    migration={item}
                    selected={selected?.id === item.id}
                    onSelect={openSong}
                  />
                ))}
              </RailGroup>
              {songGroups.wanderers.length > 0 && (
                <RailGroup
                  id="wanderers"
                  label="Wanderers"
                  count={songGroups.wanderers.length}
                  open={openGroups.has('wanderers')}
                  onToggle={toggleGroup}
                >
                  {songGroups.wanderers.map(item => (
                    <SongRailItem
                      key={item.id}
                      migration={item}
                      selected={selected?.id === item.id}
                      onSelect={openSong}
                    />
                  ))}
                </RailGroup>
              )}
              {songGroups.quick.length > 0 && (
                <RailGroup
                  id="quick"
                  label="Quick"
                  count={songGroups.quick.length}
                  open={openGroups.has('quick')}
                  onToggle={toggleGroup}
                >
                  {songGroups.quick.map(item => (
                    <SongRailItem
                      key={item.id}
                      migration={item}
                      selected={selected?.id === item.id}
                      onSelect={openSong}
                    />
                  ))}
                </RailGroup>
              )}
              {searched && searched.total === 0 && (
                <p className="mig-rail-empty">No lives match that filter.</p>
              )}
            </>
          )}

          {view === 'rooms' && (
            <>
              {roomMatches.length === 0 && (
                <p className="mig-rail-empty">No rooms match that filter.</p>
              )}
              {roomMatches.map(room => (
                <RoomRailItem
                  key={room.playlistId}
                  room={room}
                  selected={selectedRoom?.playlistId === room.playlistId}
                  onSelect={openRoom}
                />
              ))}
            </>
          )}
        </div>
        <p className="mig-rail-hint">j / k to move · {filterLabel}</p>
      </aside>

      {view === 'songs' && selected && story && (
        <section className="mig-stage" aria-live="polite">
          <header className="mig-hero">
            <p className="mig-kicker">{story.kicker}</p>
            <h1 className="mig-hero-title">{story.title}</h1>
            <p className="mig-hero-meta">
              {story.artist}
              {' · '}
              {story.meta}
            </p>
            {href && (
              <a className="mig-open" href={href} target="_blank" rel="noreferrer">
                Open in Spotify
              </a>
            )}
          </header>

          <River
            key={selected.id + String(expanded)}
            migration={selected}
            hairlines={hairlines}
            expanded={expanded}
            onExpand={() => setExpanded(true)}
            onSelectBank={openRoomFromStay}
            onSelectHairline={other => openSong(other.id)}
            activePlaylistId={null}
          />

          <div className="mig-story">
            {story.sentences.map(sentence => (
              <p key={sentence}>{sentence}</p>
            ))}
          </div>

          <div className="mig-stays">
            {stayList.map((stay, idx) => (
              <button
                key={`${stay.playlistId}-${stay.addedAtMs}`}
                type="button"
                className="mig-stay"
                onClick={() => openRoomFromStay(stay)}
              >
                <span className="mig-stay-label">
                  {idx === 0 ? 'First' : idx === stayList.length - 1 && (expanded || selected.stays.length <= RIVER_BANK_CAP) ? 'Latest' : 'Then'}
                </span>
                <span className="mig-stay-date">{formatDisplayDate(stay.addedAt)}</span>
                <span className="mig-stay-room" style={{ color: playlistColor(stay.playlistId) }}>
                  {stay.playlistName}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {view === 'rooms' && selectedRoom && (
        <section className="mig-stage" aria-live="polite">
          <header className="mig-hero">
            <p className="mig-kicker">A room with traffic</p>
            <h1 className="mig-hero-title">{selectedRoom.playlistName}</h1>
            <p className="mig-hero-meta">
              {selectedRoom.arrived.length} arrived
              {' · '}
              {selectedRoom.left.length} left
              {' · '}
              {selectedRoom.born.length} lives began here
            </p>
            {selected && (
              <button type="button" className="mig-open mig-open-btn" onClick={() => setView('songs')}>
                Back to {selected.name}
              </button>
            )}
          </header>

          <div className="mig-room-grid">
            <div className="mig-room-col">
              <h3>Arrived</h3>
              {arrived.length === 0 && (
                <p className="mig-col-empty">Nothing arrived from another room.</p>
              )}
              {arrived.map(hop => (
                <FlowRow
                  key={`${hop.migration.id}-in-${hop.intoStay.addedAtMs}`}
                  hop={hop}
                  direction="in"
                  onSelect={openSong}
                />
              ))}
              {selectedRoom.arrived.length > ROOM_LIST_CAP && (
                <p className="mig-col-more">and {selectedRoom.arrived.length - ROOM_LIST_CAP} more</p>
              )}
            </div>
            <div className="mig-room-col">
              <h3>Left</h3>
              {left.length === 0 && (
                <p className="mig-col-empty">
                  Nothing has left for another room — yet. Or we cannot see songs dropped from this list until Graveyard.
                </p>
              )}
              {left.map(hop => (
                <FlowRow
                  key={`${hop.migration.id}-out-${hop.fromStay.addedAtMs}`}
                  hop={hop}
                  direction="out"
                  onSelect={openSong}
                />
              ))}
              {selectedRoom.left.length > ROOM_LIST_CAP && (
                <p className="mig-col-more">and {selectedRoom.left.length - ROOM_LIST_CAP} more</p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function RailGroup({ id, label, count, open, onToggle, children }) {
  return (
    <div className={`mig-group${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="mig-group-toggle"
        onClick={() => onToggle(id)}
        aria-expanded={open}
      >
        <span className="mig-group-caret" aria-hidden="true">{open ? '▾' : '▸'}</span>
        <span className="mig-group-name">{label}</span>
        <span className="mig-group-count">{count}</span>
      </button>
      {open && children}
    </div>
  );
}
