import React, { useEffect, useMemo, useState } from 'react';
import { eventIdentity, eventKey, flattenLibraryEvents } from './experiences/events';
import {
  buildNightStory,
  buildNightsIndex,
  formatClock,
  formatDuration,
  formatSaveCount,
  playlistColor,
  sessionPlaylists,
} from './experiences/nights';
import { getFilterLabel } from './playlistFilters';
import './Nights.css';

function spotifyUrl(trackId) {
  return trackId ? `https://open.spotify.com/track/${trackId}` : null;
}

function meteorRows(events) {
  const rows = [];
  for (let i = 0; i < events.length; i += 1) {
    if (i > 0) {
      const gap = events[i].addedAtMs - events[i - 1].addedAtMs;
      if (gap > 15 * 60 * 1000) {
        rows.push({ type: 'gap', id: `gap-${i}`, label: `+${formatDuration(gap)}` });
      }
    }
    rows.push({
      type: 'event',
      id: eventKey(events[i], i),
      identity: eventIdentity(events[i]),
      event: events[i],
    });
  }
  return rows;
}

function starPoint(event, index, total, session, playlistIndex) {
  const cx = 200;
  const cy = 200;
  const startHour = session.start.getHours() + session.start.getMinutes() / 60;
  const startAngle = (startHour / 24) * Math.PI * 2 - Math.PI / 2;
  const durationHours = session.durationMs / 3_600_000;
  const sweepDeg = Math.min(300, Math.max(150, 50 + durationHours * 22));
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const angle = startAngle + (t * sweepDeg * Math.PI) / 180;
  const ring = playlistIndex.get(event.playlistId) || 0;
  const radius = 148 - (ring % 5) * 9;
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

function ClockConstellation({ session, activeKey, onSelect }) {
  const playlists = sessionPlaylists(session);
  const playlistIndex = new Map(playlists.map((playlist, idx) => [playlist.id, idx]));
  const svgId = `s${session.start.getTime()}-${session.trackCount}`;
  const total = session.events.length;

  const points = session.events.map((event, index) => {
    const pos = starPoint(event, index, total, session, playlistIndex);
    return {
      event,
      index,
      key: eventKey(event, index),
      identity: eventIdentity(event),
      color: playlistColor(event.playlistId),
      ...pos,
    };
  });

  const linePath = points
    .map((point, idx) => `${idx === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const stagger = Math.min(20, 1600 / Math.max(points.length, 1));
  const startLabel = formatClock(session.start);
  const endLabel = formatClock(session.end);
  const startHour = session.start.getHours() + session.start.getMinutes() / 60;
  const startAngle = (startHour / 24) * Math.PI * 2 - Math.PI / 2;
  const durationHours = session.durationMs / 3_600_000;
  const sweepDeg = Math.min(300, Math.max(150, 50 + durationHours * 22));
  const endAngle = startAngle + (sweepDeg * Math.PI) / 180;
  const labelR = 182;
  const startLabelPos = { x: 200 + Math.cos(startAngle) * labelR, y: 200 + Math.sin(startAngle) * labelR };
  const endLabelPos = { x: 200 + Math.cos(endAngle) * labelR, y: 200 + Math.sin(endAngle) * labelR };

  return (
    <div className="night-clock-wrap">
      <svg className="night-clock" viewBox="0 0 400 400" role="img" aria-hidden="true">
        <defs>
          <radialGradient id={`${svgId}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#b49bc8" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#1db954" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#07070a" stopOpacity="0" />
          </radialGradient>
          <filter id={`${svgId}-star`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="200" cy="200" r="188" fill={`url(#${svgId}-glow)`} />
        <circle cx="200" cy="200" r="168" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        <text x={startLabelPos.x} y={startLabelPos.y} className="night-clock-hour" textAnchor="middle" dominantBaseline="middle">
          {startLabel}
        </text>
        <text x={endLabelPos.x} y={endLabelPos.y} className="night-clock-hour" textAnchor="middle" dominantBaseline="middle">
          {endLabel}
        </text>

        <path className="night-constellation-line" pathLength="1" d={linePath} />

        {points.map((point, idx) => {
          const active = activeKey === point.identity;
          return (
            <circle
              key={point.key}
              className={`night-star${active ? ' is-active' : ''}`}
              cx={point.x}
              cy={point.y}
              r={active ? 5.5 : Math.max(2.2, 4.2 - Math.log10(total))}
              fill={point.color}
              filter={`url(#${svgId}-star)`}
              style={{ animationDelay: `${idx * stagger}ms` }}
              onClick={() => onSelect(point.event)}
            >
              <title>
                {`${formatClock(point.event.addedAt)} · ${point.event.name} · ${point.event.playlistName}`}
              </title>
            </circle>
          );
        })}
      </svg>

      <div className="night-clock-center">
        <strong>{session.trackCount}</strong>
        <span>{session.trackCount === 1 ? 'save' : 'saves'}</span>
        {session.uniqueTrackCount < session.trackCount && (
          <span className="night-clock-unique">{session.uniqueTrackCount} songs</span>
        )}
      </div>
    </div>
  );
}

function BeatCard({ label, event, onSelect, active }) {
  const href = spotifyUrl(event.trackId);
  return (
    <article className={`night-beat${active ? ' is-active' : ''}`}>
      <button type="button" className="night-beat-main" onClick={() => onSelect(event)}>
        <span className="night-beat-label">{label}</span>
        <span className="night-beat-time">{formatClock(event.addedAt)}</span>
        <span className="night-beat-title">{event.name}</span>
        <span className="night-beat-artist">{event.artistKey || 'Unknown artist'}</span>
        <span className="night-beat-playlist" style={{ color: playlistColor(event.playlistId) }}>
          {event.playlistName}
        </span>
      </button>
      {href && (
        <a className="night-beat-open" href={href} target="_blank" rel="noreferrer">
          Open in Spotify
        </a>
      )}
    </article>
  );
}

function NightRailItem({ session, selected, onSelect, hideYear }) {
  return (
    <button
      type="button"
      className={`nights-rail-item${selected ? ' is-selected' : ''}`}
      onClick={() => onSelect(session.id)}
      aria-current={selected ? 'true' : undefined}
    >
      <span className="nights-rail-date">
        {session.isLateNight ? '☾ ' : ''}
        {session.start.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          ...(hideYear ? {} : { year: 'numeric' }),
        })}
      </span>
      <span className="nights-rail-meta">
        {formatSaveCount(session)} · {formatDuration(session.durationMs)}
      </span>
      <span className="nights-rail-playlist">{session.primaryPlaylist.name}</span>
    </button>
  );
}

function groupByYear(sessions) {
  const groups = [];
  for (const session of sessions) {
    const year = session.start.getFullYear();
    const last = groups[groups.length - 1];
    if (!last || last.year !== year) {
      groups.push({ year, sessions: [session] });
    } else {
      last.sessions.push(session);
    }
  }
  return groups;
}

function sessionMatchesQuery(session, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const date = session.start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const month = session.start.toLocaleDateString(undefined, { month: 'long' });
  if (
    date.toLowerCase().includes(q)
    || month.toLowerCase().includes(q)
    || String(session.start.getFullYear()) === q
    || session.primaryPlaylist.name.toLowerCase().includes(q)
    || session.weekday.toLowerCase().includes(q)
  ) {
    return true;
  }

  return session.events.some(event => (
    event.playlistName.toLowerCase().includes(q)
    || event.name.toLowerCase().includes(q)
    || event.artistKey.toLowerCase().includes(q)
  ));
}

export default function Nights({
  library,
  filteredPlaylists,
  filter,
  loading,
  error,
}) {
  const filterLabel = getFilterLabel(filter);
  const [selectedId, setSelectedId] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const [query, setQuery] = useState('');
  const [openYears, setOpenYears] = useState(new Set());
  const [yearsInitialized, setYearsInitialized] = useState(false);
  const [quieterOpen, setQuieterOpen] = useState(false);

  const events = useMemo(
    () => flattenLibraryEvents(filteredPlaylists, library?.tracksByPlaylistId),
    [filteredPlaylists, library]
  );

  const index = useMemo(() => buildNightsIndex(events), [events]);
  const featuredMatches = useMemo(
    () => index.featured.filter(session => sessionMatchesQuery(session, query)),
    [index.featured, query]
  );
  const quieterMatches = useMemo(
    () => index.quieter.filter(session => sessionMatchesQuery(session, query)),
    [index.quieter, query]
  );
  const yearGroups = useMemo(() => groupByYear(featuredMatches), [featuredMatches]);

  useEffect(() => {
    setQuery('');
    setYearsInitialized(false);
    setQuieterOpen(false);
  }, [filter, library?.userId]);

  useEffect(() => {
    if (yearsInitialized || !yearGroups.length) return;
    setOpenYears(new Set([yearGroups[0].year]));
    setYearsInitialized(true);
  }, [yearGroups, yearsInitialized]);

  useEffect(() => {
    if (!query.trim()) return;
    setOpenYears(new Set(yearGroups.map(group => group.year)));
    if (quieterMatches.length) setQuieterOpen(true);
  }, [query, yearGroups, quieterMatches.length]);

  const visibleNights = useMemo(() => {
    const fromYears = yearGroups.flatMap(group => (
      openYears.has(group.year) ? group.sessions : []
    ));
    return quieterOpen ? [...fromYears, ...quieterMatches] : fromYears;
  }, [yearGroups, openYears, quieterOpen, quieterMatches]);

  const nights = useMemo(
    () => [...index.featured, ...index.quieter],
    [index.featured, index.quieter]
  );

  const selected = nights.find(night => night.id === selectedId) || nights[0] || null;
  const story = selected ? buildNightStory(selected) : null;
  const playlists = selected ? sessionPlaylists(selected) : [];
  const rows = selected ? meteorRows(selected.events) : [];

  useEffect(() => {
    if (selected && !nights.some(night => night.id === selectedId)) {
      setSelectedId(selected.id);
    }
  }, [nights, selected, selectedId]);

  useEffect(() => {
    if (!query.trim() || !visibleNights.length) return;
    if (selectedId && visibleNights.some(night => night.id === selectedId)) return;
    setSelectedId(visibleNights[0].id);
  }, [query, visibleNights, selectedId]);

  useEffect(() => {
    setActiveKey(null);
  }, [selected?.id]);

  useEffect(() => {
    function onKey(e) {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key !== 'j' && e.key !== 'k' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      if (!visibleNights.length || !selected) return;
      e.preventDefault();
      const idx = visibleNights.findIndex(night => night.id === selected.id);
      const from = idx === -1 ? 0 : idx;
      const next = (e.key === 'j' || e.key === 'ArrowDown')
        ? visibleNights[Math.min(visibleNights.length - 1, from + 1)]
        : visibleNights[Math.max(0, from - 1)];
      if (next) setSelectedId(next.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visibleNights, selected]);

  function toggleYear(year) {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  function selectEvent(event) {
    setActiveKey(eventIdentity(event));
    const node = document.getElementById(`meteor-${eventIdentity(event)}`);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (loading && !library) return null;

  if (error && !library) {
    return (
      <div className="nights-page nights-page-empty">
        <div className="nights-empty">
          <p><strong>Could not load nights</strong></p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!filteredPlaylists.length) {
    return (
      <div className="nights-page nights-page-empty">
        <div className="nights-empty">
          <p><strong>No playlists match this filter</strong></p>
          <p>Try a different selection — currently showing: {filterLabel}</p>
        </div>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="nights-page nights-page-empty">
        <div className="nights-empty">
          <p><strong>Nights need the date you added each song</strong></p>
          <p>Refresh the library to pull add dates from Spotify. Until then, this room stays dark.</p>
        </div>
      </div>
    );
  }

  if (!selected || !story) {
    return (
      <div className="nights-page nights-page-empty">
        <div className="nights-empty">
          <p><strong>No sittings in this slice</strong></p>
          <p>There are dates here, but nothing clustered into a night yet.</p>
        </div>
      </div>
    );
  }

  const turnLabel = selected.beats.turn.kind === 'playlist'
    ? 'The turn'
    : selected.beats.turn.kind === 'artist'
      ? 'The turn'
      : 'Midpoint';

  return (
    <div className="nights-page">
      <aside className="nights-rail">
        <div className="nights-rail-head">
          <h2>Nights</h2>
          <p>
            {featuredMatches.length} of {index.featured.length} sittings
            {index.quietPromoted ? ' · quieter library' : ''}
          </p>
          <label className="nights-rail-search">
            <span className="sr-only">Filter sittings</span>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Playlist, song, month…"
            />
          </label>
          {yearGroups.length > 1 && (
            <div className="nights-year-actions">
              <button type="button" onClick={() => setOpenYears(new Set(yearGroups.map(group => group.year)))}>
                Expand years
              </button>
              <button type="button" onClick={() => setOpenYears(new Set())}>
                Collapse years
              </button>
            </div>
          )}
        </div>

        <div className="nights-rail-scroll">
          {yearGroups.length === 0 && (
            <p className="nights-rail-empty">No sittings match that filter.</p>
          )}

          {yearGroups.map((group) => {
            const open = openYears.has(group.year);
            return (
              <div key={group.year} className={`nights-year-group${open ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="nights-year-toggle"
                  onClick={() => toggleYear(group.year)}
                  aria-expanded={open}
                >
                  <span className="nights-year-caret" aria-hidden="true">{open ? '▾' : '▸'}</span>
                  <span className="nights-year-name">{group.year}</span>
                  <span className="nights-year-count">{group.sessions.length}</span>
                </button>
                {open && group.sessions.map(session => (
                  <NightRailItem
                    key={session.id}
                    session={session}
                    selected={session.id === selected.id}
                    onSelect={setSelectedId}
                    hideYear
                  />
                ))}
              </div>
            );
          })}

          {quieterMatches.length > 0 && (
            <div className={`nights-year-group${quieterOpen ? ' is-open' : ''}`}>
              <button
                type="button"
                className="nights-year-toggle"
                onClick={() => setQuieterOpen(open => !open)}
                aria-expanded={quieterOpen}
              >
                <span className="nights-year-caret" aria-hidden="true">{quieterOpen ? '▾' : '▸'}</span>
                <span className="nights-year-name">Quieter</span>
                <span className="nights-year-count">{quieterMatches.length}</span>
              </button>
              {quieterOpen && quieterMatches.map(session => (
                <NightRailItem
                  key={session.id}
                  session={session}
                  selected={session.id === selected.id}
                  onSelect={setSelectedId}
                />
              ))}
            </div>
          )}
        </div>
        <p className="nights-rail-hint">j / k to move · {filterLabel}</p>
      </aside>

      <section className="nights-stage" aria-live="polite">
        <header className="night-hero">
          <p className="night-kicker">{story.kicker}</p>
          <h1 className="night-hero-date">{story.date}</h1>
          <p className="night-hero-meta">
            {formatClock(selected.start)} → {formatClock(selected.end)}
            {' · '}{formatDuration(selected.durationMs)}
            {' · '}{formatSaveCount(selected)}
          </p>
          <p className="night-hero-note">Each count is a save to a playlist — same song in two lists is two saves.</p>
        </header>

        <div className="night-stage-grid">
          <div className="night-clock-column">
            <ClockConstellation
              key={selected.id}
              session={selected}
              activeKey={activeKey}
              onSelect={selectEvent}
            />
            <ul className="night-legend">
              {playlists.slice(0, 6).map(playlist => (
                <li key={playlist.id}>
                  <span className="night-legend-dot" style={{ background: playlist.color }} />
                  {playlist.name}
                  <em>{playlist.count}</em>
                </li>
              ))}
              {playlists.length > 6 && <li className="night-legend-more">+{playlists.length - 6} more rooms</li>}
            </ul>
          </div>

          <div className="night-story-column">
            <div className="night-story">
              {story.sentences.map(sentence => (
                <p key={sentence}>{sentence}</p>
              ))}
            </div>

            <div className="night-beats">
              <BeatCard
                label="Opening"
                event={selected.beats.opening[0]}
                onSelect={selectEvent}
                active={activeKey === eventIdentity(selected.beats.opening[0])}
              />
              <BeatCard
                label={turnLabel}
                event={selected.beats.turn.event}
                onSelect={selectEvent}
                active={activeKey === eventIdentity(selected.beats.turn.event)}
              />
              <BeatCard
                label="You left"
                event={selected.beats.last}
                onSelect={selectEvent}
                active={activeKey === eventIdentity(selected.beats.last)}
              />
            </div>

            {selected.topArtists.length > 0 && (
              <div className="night-cast">
                {selected.topArtists.map(artist => (
                  <span key={artist.name} className="night-cast-chip">
                    {artist.name}
                    <em>{artist.count}</em>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <ol className="night-meteor" aria-label="Every playlist save this sitting">
          {rows.map((row) => {
            if (row.type === 'gap') {
              return (
                <li key={row.id} className="night-meteor-gap">{row.label}</li>
              );
            }
            const { event } = row;
            const href = spotifyUrl(event.trackId);
            const active = activeKey === row.identity;
            return (
              <li key={row.id} id={`meteor-${row.identity}`}>
                <button
                  type="button"
                  className={`night-meteor-row${active ? ' is-active' : ''}`}
                  onClick={() => selectEvent(event)}
                >
                  <span className="night-meteor-time">{formatClock(event.addedAt)}</span>
                  <span className="night-meteor-dot" style={{ background: playlistColor(event.playlistId) }} />
                  <span className="night-meteor-body">
                    <span className="night-meteor-title">{event.name}</span>
                    <span className="night-meteor-artist">{event.artistKey}</span>
                  </span>
                  <span className="night-meteor-playlist">{event.playlistName}</span>
                </button>
                {href && (
                  <a className="night-meteor-open" href={href} target="_blank" rel="noreferrer">
                    ↗
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
