export const SESSION_GAP_MS = 90 * 60 * 1000;
export const MIN_FEATURED_TRACKS = 8;
export const MAX_QUIETER = 20;

const PEAK_WINDOW_MS = 20 * 60 * 1000;
const OPENING_WINDOW_MS = 10 * 60 * 1000;
const PLAYLIST_PALETTE = ['#1db954', '#509bf5', '#f59b23', '#b49bc8', '#e91429', '#2ebd59', '#ff8fab', '#7ad7f0'];

export function playlistColor(playlistId) {
  const id = playlistId || '';
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PLAYLIST_PALETTE[hash % PLAYLIST_PALETTE.length];
}

export function formatClock(date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const hour12 = hours % 12 || 12;
  const suffix = hours < 12 ? 'a' : 'p';
  return `${hour12}:${minutes}${suffix}`;
}

export function formatDuration(ms) {
  const totalMinutes = Math.max(1, Math.round(ms / 60_000));
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function formatSaveCount(session) {
  const saves = session.trackCount;
  const songs = session.uniqueTrackCount;
  const times = saves === 1 ? 'saved once' : `saved ${saves} times`;
  if (songs && songs < saves) {
    return `${times} · ${songs} songs`;
  }
  return times;
}

export function formatDisplayDate(date) {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatWeekday(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long' });
}

function uniqueCount(items, keyFn) {
  const seen = new Set();
  for (const item of items) seen.add(keyFn(item));
  return seen.size;
}

function playlistCounts(events) {
  const counts = new Map();
  for (const event of events) {
    counts.set(event.playlistId, (counts.get(event.playlistId) || 0) + 1);
  }
  return counts;
}

function primaryPlaylist(events, counts) {
  let bestId = events[0].playlistId;
  let bestCount = 0;
  for (const [id, count] of counts) {
    if (count > bestCount) {
      bestId = id;
      bestCount = count;
    }
  }
  const named = events.find(event => event.playlistId === bestId);
  return {
    id: bestId,
    name: named?.playlistName || 'playlist',
    count: bestCount,
  };
}

function artistCounts(events) {
  const counts = new Map();
  for (const event of events) {
    const name = event.artistKey || 'Unknown artist';
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}

function medianDate(events) {
  return events[Math.floor(events.length / 2)].addedAt;
}

function isLateHour(hour) {
  return hour >= 21 || hour <= 4;
}

function findPlaylistTurn(events) {
  const counts = new Map();
  let leader = events[0].playlistId;
  counts.set(leader, 1);

  for (let i = 1; i < events.length; i += 1) {
    const id = events[i].playlistId;
    counts.set(id, (counts.get(id) || 0) + 1);

    let nextLeader = leader;
    let max = 0;
    for (const [playlistId, count] of counts) {
      if (count > max) {
        max = count;
        nextLeader = playlistId;
      }
    }

    if (nextLeader !== leader) {
      return {
        kind: 'playlist',
        event: events[i],
        playlist: events[i].playlistName,
      };
    }
    leader = nextLeader;
  }

  return null;
}

function findArtistTurn(events) {
  if (events.length < 4) return null;

  for (let i = 3; i < events.length; i += 1) {
    const streak = events.slice(i - 3, i);
    const artist = streak[0].artistKey;
    if (!artist) continue;
    if (streak.every(event => event.artistKey === artist) && events[i].artistKey !== artist) {
      return {
        kind: 'artist',
        event: events[i],
        streakArtist: artist,
      };
    }
  }

  return null;
}

function peakWindow(events) {
  const duration = events[events.length - 1].addedAtMs - events[0].addedAtMs;
  if (events.length < 2 || duration <= PEAK_WINDOW_MS) {
    return {
      start: events[0],
      end: events[events.length - 1],
      count: events.length,
    };
  }

  let best = { i: 0, j: 0, count: 1 };
  let j = 0;
  for (let i = 0; i < events.length; i += 1) {
    while (j < events.length && events[j].addedAtMs - events[i].addedAtMs <= PEAK_WINDOW_MS) {
      j += 1;
    }
    const count = j - i;
    if (count > best.count) best = { i, j: j - 1, count };
  }

  return {
    start: events[best.i],
    end: events[best.j],
    count: best.count,
  };
}

function buildBeats(events) {
  const opening = [events[0]];
  for (let i = 1; i < events.length && opening.length < 3; i += 1) {
    if (events[i].addedAtMs - events[0].addedAtMs <= OPENING_WINDOW_MS) {
      opening.push(events[i]);
    } else {
      break;
    }
  }

  const playlistTurn = findPlaylistTurn(events);
  const artistTurn = playlistTurn ? null : findArtistTurn(events);
  const turn = playlistTurn || artistTurn || {
    kind: 'mid',
    event: events[Math.floor(events.length / 2)],
  };

  return {
    opening,
    turn,
    last: events[events.length - 1],
    peakWindow: peakWindow(events),
  };
}

function scoreSession({
  trackCount,
  durationMs,
  density,
  isLateNight,
  playlistShare,
  playlistCount,
  uniqueArtistCount,
}) {
  const durationMinutes = durationMs / 60_000;
  const obsession = playlistShare >= 0.7;
  const flux = playlistCount >= 3 && !obsession;

  return (
    trackCount * 3
    + Math.log2(1 + Math.max(durationMinutes, 1)) * 2
    + density * 8
    + (isLateNight ? 18 : 0)
    + (obsession ? 10 : 0)
    + (flux ? 8 : 0)
    + uniqueArtistCount * 0.4
  );
}

export function buildSession(events) {
  const start = events[0].addedAt;
  const end = events[events.length - 1].addedAt;
  const durationMs = Math.max(end.getTime() - start.getTime(), 0);
  const counts = playlistCounts(events);
  const primary = primaryPlaylist(events, counts);
  const trackCount = events.length;
  const playlistShare = primary.count / trackCount;
  const uniqueArtistCount = uniqueCount(events, event => event.artistKey);
  const density = trackCount / Math.max(durationMs, 60_000) * 60_000;
  const median = medianDate(events);
  const hourLocal = median.getHours();
  const lateNight = isLateHour(hourLocal);

  return {
    id: `${events[0].addedAtMs}-${events[events.length - 1].addedAtMs}-${trackCount}`,
    events,
    start,
    end,
    durationMs,
    trackCount,
    uniqueTrackCount: uniqueCount(events, event => event.identity),
    playlistCounts: counts,
    playlistCount: counts.size,
    primaryPlaylist: primary,
    playlistShare,
    topArtists: artistCounts(events),
    uniqueArtistCount,
    hourLocal,
    isLateNight: lateNight,
    weekday: formatWeekday(start),
    density,
    score: scoreSession({
      trackCount,
      durationMs,
      density,
      isLateNight: lateNight,
      playlistShare,
      playlistCount: counts.size,
      uniqueArtistCount,
    }),
    beats: buildBeats(events),
    usesCollaborative: events.some(event => event.collaborative),
  };
}

export function clusterSessions(events) {
  if (!events.length) return [];

  const sessions = [];
  let current = [events[0]];

  for (let i = 1; i < events.length; i += 1) {
    const event = events[i];
    const previous = events[i - 1];
    if (event.addedAtMs - previous.addedAtMs > SESSION_GAP_MS) {
      sessions.push(buildSession(current));
      current = [event];
    } else {
      current.push(event);
    }
  }

  sessions.push(buildSession(current));
  return sessions;
}

function sortByDate(sessions) {
  return [...sessions].sort((a, b) => b.start - a.start || b.score - a.score);
}

export function buildNightsIndex(events) {
  const sessions = clusterSessions(events);
  const featuredPool = sortByDate(sessions.filter(session => session.trackCount >= MIN_FEATURED_TRACKS));
  const quieterPool = sortByDate(sessions.filter(session => session.trackCount < MIN_FEATURED_TRACKS));

  let featured = featuredPool;
  let quieter = quieterPool.slice(0, MAX_QUIETER);

  if (!featured.length && sessions.length) {
    featured = sortByDate(sessions).slice(0, Math.min(5, sessions.length));
    quieter = quieter.filter(session => !featured.some(item => item.id === session.id));
  }

  return {
    featured,
    quieter,
    sessionCount: sessions.length,
    datedEventCount: events.length,
    quietPromoted: featuredPool.length === 0 && featured.length > 0,
  };
}

function daypart(session) {
  if (session.isLateNight) return 'night';
  const hour = session.start.getHours();
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function buildNightStory(session) {
  const { beats, start, end, usesCollaborative } = session;
  const you = usesCollaborative ? 'This sitting' : 'You';
  const sentences = [];

  const opener = beats.opening[0];
  sentences.push(
    `${you} started with “${opener.name}”${opener.artistKey ? ` by ${opener.artistKey}` : ''} in ${opener.playlistName}.`
  );

  if (session.playlistShare >= 0.7) {
    sentences.push(`Almost everything went into ${session.primaryPlaylist.name}.`);
  } else {
    const names = [...session.playlistCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => session.events.find(event => event.playlistId === id)?.playlistName)
      .filter(Boolean)
      .slice(0, 3);
    if (names.length) sentences.push(`The night moved between ${names.join(', ')}.`);
  }

  if (beats.turn.kind === 'playlist') {
    sentences.push(`Around ${formatClock(beats.turn.event.addedAt)} the destination shifted to ${beats.turn.playlist}.`);
  } else if (beats.turn.kind === 'artist') {
    sentences.push(`“${beats.turn.event.name}” broke a ${beats.turn.streakArtist} run.`);
  }

  sentences.push(`You left on “${beats.last.name}” at ${formatClock(beats.last.addedAt)}.`);

  return {
    kicker: `${session.weekday} ${daypart(session)}`,
    date: formatDisplayDate(start),
    meta: `${formatClock(start)} → ${formatClock(end)}  ·  ${formatDuration(session.durationMs)}  ·  ${formatSaveCount(session)}`,
    sentences,
  };
}

export function sessionPlaylists(session) {
  const seen = [];
  const ids = new Set();
  for (const event of session.events) {
    if (ids.has(event.playlistId)) continue;
    ids.add(event.playlistId);
    seen.push({
      id: event.playlistId,
      name: event.playlistName,
      color: playlistColor(event.playlistId),
      count: session.playlistCounts.get(event.playlistId) || 0,
    });
  }
  return seen;
}

export function isNightArcSession(session) {
  if (!session.isLateNight || session.durationMs > 10 * 60 * 60 * 1000) return false;
  return session.events.every((event) => {
    const hour = event.addedAt.getHours() + event.addedAt.getMinutes() / 60;
    return hour >= 18 || hour < 6;
  });
}
