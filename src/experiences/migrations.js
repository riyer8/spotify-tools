const SPLIT_MS = 18 * 60 * 60 * 1000;
const PANIC_MS = 7 * 24 * 60 * 60 * 1000;
const HOP_MS = 30 * 24 * 60 * 60 * 1000;

export const FEATURED_GRADUATED = 60;
export const FEATURED_WANDERERS = 16;
export const FEATURED_QUICK = 24;
export const SEARCH_CAP = 80;
export const HAIRLINE_CAP = 28;
export const RIVER_BANK_CAP = 8;
export const ROOM_FLOW_CAP = 80;
export const ROOM_LIST_CAP = 40;

export const KIND_LABEL = {
  graduation: 'graduated',
  hop: 'quick',
  split: 'same day',
  panic: 'everywhere at once',
};

function sameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
  );
}

export function formatMonthYear(date) {
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export function formatDisplayDate(date) {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatSpanShort(ms) {
  if (ms < SPLIT_MS) return 'same day';
  const days = ms / 86_400_000;
  if (days < 45) return `${Math.max(1, Math.round(days))}d`;
  const months = days / 30.44;
  if (months < 20) return `${Math.max(1, Math.round(months))}mo`;
  return `${(days / 365.25).toFixed(1).replace(/\.0$/, '')}y`;
}

export function formatSpanHuman(ms) {
  if (ms < SPLIT_MS) return 'the same day';
  const days = ms / 86_400_000;
  if (days < 1.5) return 'a day';
  if (days < 45) {
    const n = Math.round(days);
    return `${n} day${n === 1 ? '' : 's'}`;
  }
  const months = days / 30.44;
  if (months < 20) {
    const n = Math.max(1, Math.round(months));
    return n === 1 ? 'a month' : `${n} months`;
  }
  const years = days / 365.25;
  if (years < 1.5) return 'a year';
  const n = Math.round(years);
  return `${n} year${n === 1 ? '' : 's'}`;
}

export function pathTeaser(path) {
  if (path.length <= 2) return path.join(' → ');
  return `${path[0]} → ${path[path.length - 1]}`;
}

function collapseStays(claims) {
  const stays = [];
  for (const claim of claims) {
    const last = stays[stays.length - 1];
    if (last && last.playlistId === claim.playlistId) {
      last.claimCount += 1;
      continue;
    }
    stays.push({
      playlistId: claim.playlistId,
      playlistName: claim.playlistName,
      addedAt: claim.addedAt,
      addedAtMs: claim.addedAtMs,
      claimCount: 1,
      collaborative: Boolean(claim.collaborative),
    });
  }
  return stays;
}

function classifyKind(stays, rooms, spanMs) {
  const first = stays[0].addedAt;
  const last = stays[stays.length - 1].addedAt;
  if (spanMs < SPLIT_MS || sameLocalDay(first, last)) return 'split';
  if (rooms >= 4 && spanMs < PANIC_MS) return 'panic';
  if (spanMs < HOP_MS) return 'hop';
  return 'graduation';
}

function scoreMigration({ spanMs, rooms, hops, kind }) {
  const spanDays = spanMs / 86_400_000;
  return (
    spanDays * 3
    + rooms * 8
    + hops * 2
    + (kind === 'graduation' ? 40 : 0)
    + (kind === 'panic' ? 12 : 0)
    - (kind === 'split' ? 20 : 0)
  );
}

export function buildMigration(events) {
  const claims = events.map(event => ({
    trackId: event.trackId,
    name: event.name,
    artistKey: event.artistKey,
    albumName: event.albumName,
    identity: event.identity,
    playlistId: event.playlistId,
    playlistName: event.playlistName,
    addedAt: event.addedAt,
    addedAtMs: event.addedAtMs,
    collaborative: event.collaborative,
  }));

  const rooms = new Set(claims.map(claim => claim.playlistId)).size;
  if (rooms < 2) return null;

  const stays = collapseStays(claims);
  if (stays.length < 2) return null;

  const first = stays[0];
  const last = stays[stays.length - 1];
  const spanMs = last.addedAtMs - first.addedAtMs;
  const hops = stays.length - 1;
  const kind = classifyKind(stays, rooms, spanMs);
  const path = stays.map(stay => stay.playlistName);
  const representative = claims.find(claim => claim.trackId) || claims[0];

  return {
    id: claims[0].identity,
    trackId: representative.trackId || null,
    name: representative.name,
    artistKey: representative.artistKey,
    albumName: representative.albumName || null,
    claims,
    stays,
    rooms,
    hops,
    first,
    last,
    spanMs,
    path,
    pathKey: stays.map(stay => stay.playlistId).join('>'),
    kind,
    score: scoreMigration({ spanMs, rooms, hops, kind }),
    usesCollaborative: claims.some(claim => claim.collaborative),
  };
}

export function buildMigrations(events) {
  const byIdentity = new Map();
  for (const event of events) {
    const list = byIdentity.get(event.identity);
    if (list) list.push(event);
    else byIdentity.set(event.identity, [event]);
  }

  const migrations = [];
  for (const group of byIdentity.values()) {
    group.sort((a, b) => (
      a.addedAtMs - b.addedAtMs
      || a.playlistName.localeCompare(b.playlistName)
    ));
    const migration = buildMigration(group);
    if (migration) migrations.push(migration);
  }

  migrations.sort((a, b) => (
    b.score - a.score
    || b.spanMs - a.spanMs
    || a.name.localeCompare(b.name)
  ));

  return migrations;
}

function bySpanThenName(a, b) {
  return b.spanMs - a.spanMs || a.name.localeCompare(b.name);
}

function byRoomsThenSpan(a, b) {
  return b.rooms - a.rooms || b.spanMs - a.spanMs || a.name.localeCompare(b.name);
}

export function buildMigrationsIndex(events) {
  const all = buildMigrations(events);
  const graduatedPool = all.filter(item => item.kind === 'graduation').sort(bySpanThenName);
  const wandererPool = all.filter(item => item.rooms >= 6).sort(byRoomsThenSpan);
  const quickPool = all
    .filter(item => item.kind === 'hop' || item.kind === 'panic' || item.kind === 'split')
    .sort(byRoomsThenSpan);

  let graduated = graduatedPool.slice(0, FEATURED_GRADUATED);
  if (!graduated.length && all.length) {
    graduated = all.slice(0, Math.min(40, all.length));
  }

  const graduatedIds = new Set(graduated.map(item => item.id));
  const wanderers = wandererPool
    .filter(item => !graduatedIds.has(item.id))
    .slice(0, FEATURED_WANDERERS);
  const quick = quickPool.slice(0, FEATURED_QUICK);

  return {
    all,
    graduated,
    wanderers,
    quick,
    counts: {
      all: all.length,
      graduated: graduatedPool.length,
      wanderers: wandererPool.length,
      quick: quickPool.length,
    },
    promoted: graduatedPool.length === 0 && graduated.length > 0,
  };
}

export function migrationMatchesQuery(migration, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (migration.name.toLowerCase().includes(q)) return true;
  if ((migration.artistKey || '').toLowerCase().includes(q)) return true;
  return migration.path.some(name => name.toLowerCase().includes(q));
}

export function searchMigrations(all, query) {
  const q = query.trim();
  if (!q) return null;
  const hits = all.filter(item => migrationMatchesQuery(item, q));
  const graduated = hits.filter(item => item.kind === 'graduation').slice(0, SEARCH_CAP);
  const wanderers = hits.filter(item => item.rooms >= 6 && item.kind !== 'graduation').slice(0, 16);
  const quick = hits
    .filter(item => item.kind === 'hop' || item.kind === 'panic' || item.kind === 'split')
    .slice(0, FEATURED_QUICK);
  return { graduated, wanderers, quick, total: hits.length };
}

export function hairlinesFor(selected, all) {
  if (!selected) return [];
  const roomIds = new Set(selected.stays.map(stay => stay.playlistId));
  const scored = [];

  for (const other of all) {
    if (other.id === selected.id) continue;
    const shared = other.stays.filter(stay => roomIds.has(stay.playlistId));
    const uniqueShared = new Set(shared.map(stay => stay.playlistId)).size;
    if (uniqueShared < 2) continue;
    scored.push({ migration: other, shared: uniqueShared });
  }

  scored.sort((a, b) => (
    b.shared - a.shared
    || b.migration.score - a.migration.score
    || a.migration.name.localeCompare(b.migration.name)
  ));

  return scored.slice(0, HAIRLINE_CAP).map(item => item.migration);
}

export function visibleStays(migration, expanded) {
  if (expanded || migration.stays.length <= RIVER_BANK_CAP) return migration.stays;
  return migration.stays.slice(0, RIVER_BANK_CAP - 1);
}

export function buildMigrationStory(migration) {
  const { stays, first, usesCollaborative } = migration;
  const you = usesCollaborative ? 'First claimed in this library' : 'First claimed';
  const sentences = [];
  const second = stays[1];
  const hopSpan = second.addedAtMs - first.addedAtMs;

  sentences.push(`${you} in ${first.playlistName} on ${formatDisplayDate(first.addedAt)}.`);

  if (migration.kind === 'split') {
    sentences.push(`Claimed in two places the same day — then ${second.playlistName}.`);
  } else {
    sentences.push(`${formatSpanHuman(hopSpan)} later, it showed up in ${second.playlistName}.`);
  }

  if (stays[2]) {
    sentences.push(`Then ${stays[2].playlistName} (${formatDisplayDate(stays[2].addedAt)}).`);
  }
  if (stays[3]) {
    sentences.push(`Then ${stays[3].playlistName} (${formatDisplayDate(stays[3].addedAt)}).`);
  }
  if (migration.hops > 3) {
    const extra = migration.hops - 3;
    sentences.push(`And ${extra} more room${extra === 1 ? '' : 's'} after that.`);
  }

  if (migration.kind === 'panic') {
    sentences.push('Four rooms in a week — saved like it had to exist everywhere.');
  }

  return {
    kicker: 'This song graduated',
    title: migration.name,
    artist: migration.artistKey || 'Unknown artist',
    meta: `${migration.rooms} rooms · ${formatSpanShort(migration.spanMs)} · ${KIND_LABEL[migration.kind]}`,
    sentences,
  };
}

export function buildRoomIndex(migrations) {
  const rooms = new Map();

  function ensure(stay) {
    let room = rooms.get(stay.playlistId);
    if (!room) {
      room = {
        playlistId: stay.playlistId,
        playlistName: stay.playlistName,
        arrived: [],
        left: [],
        born: [],
      };
      rooms.set(stay.playlistId, room);
    }
    return room;
  }

  for (const migration of migrations) {
    migration.stays.forEach((stay, index) => {
      const room = ensure(stay);
      if (index === 0) {
        room.born.push({ migration, stay });
      }
      if (index > 0) {
        room.arrived.push({
          migration,
          fromStay: migration.stays[index - 1],
          intoStay: stay,
        });
      }
      if (index < migration.stays.length - 1) {
        room.left.push({
          migration,
          fromStay: stay,
          intoStay: migration.stays[index + 1],
        });
      }
    });
  }

  const list = [...rooms.values()].sort((a, b) => (
    (b.arrived.length + b.left.length) - (a.arrived.length + a.left.length)
    || a.playlistName.localeCompare(b.playlistName)
  ));

  return {
    all: list,
    featured: list.slice(0, ROOM_FLOW_CAP),
  };
}

export function roomMatchesQuery(room, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return room.playlistName.toLowerCase().includes(q);
}

export function spotifyTrackUrl(trackId) {
  return trackId ? `https://open.spotify.com/track/${trackId}` : null;
}
