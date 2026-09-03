import { useEffect, useMemo, useRef, useState } from 'react';
import Timeline from './Timeline.jsx';
import {
  MIXES,
  TRANSITION_LABELS,
  formatClock,
  liveTracks,
  mixById,
  nextTransition,
  trackAt,
} from './mix.js';

function initialMixId() {
  if (typeof window === 'undefined') return MIXES[0].id;
  const hash = window.location.hash.replace('#', '');
  return MIXES.some((m) => m.id === hash) ? hash : MIXES[0].id;
}

export default function App() {
  const [mixId, setMixId] = useState(initialMixId);
  const mix = mixById(mixId);
  const tracks = mix.tracks;

  const [timeMs, setTimeMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState(tracks[0].id);
  const raf = useRef(null);
  const last = useRef(0);

  const selectMix = (id) => {
    setMixId(id);
    setPlaying(false);
    setTimeMs(0);
    const next = mixById(id);
    setSelectedId(next.tracks[0].id);
    window.location.hash = id;
  };

  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash.replace('#', '');
      if (MIXES.some((m) => m.id === id) && id !== mixId) selectMix(id);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [mixId]);

  useEffect(() => {
    if (!playing) return undefined;
    last.current = performance.now();
    const tick = (now) => {
      const dt = now - last.current;
      last.current = now;
      setTimeMs((t) => {
        const next = t + dt;
        if (next >= mix.runtimeMs) {
          setPlaying(false);
          return mix.runtimeMs;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, mix.runtimeMs]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const current = trackAt(mix, timeMs);
  const live = liveTracks(mix, timeMs);
  const upcoming = nextTransition(mix, timeMs);
  const selected = tracks.find((t) => t.id === selectedId) || current;

  const nextTrack = useMemo(
    () => tracks.find((t) => t.mixInMs > timeMs) || null,
    [tracks, timeMs],
  );

  return (
    <div className="booth">
      <nav className="crates">
        {MIXES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={m.id === mix.id ? 'is-on' : ''}
            onClick={() => selectMix(m.id)}
          >
            {m.title}
            <small>
              {m.tracks.length} tracks · {formatClock(m.runtimeMs)}
            </small>
          </button>
        ))}
      </nav>

      <header className="mast">
        <div>
          <p className="kicker">{mix.kicker}</p>
          <h1>{mix.title}</h1>
          <p className="sub">{mix.subtitle}</p>
        </div>
        <div className="clock-block">
          <button
            type="button"
            className={`play ${playing ? 'is-on' : ''}`}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? 'PAUSE' : 'PLAY THE MAP'}
          </button>
          <p className="clock">
            {formatClock(timeMs)} <span>/ {formatClock(mix.runtimeMs)}</span>
          </p>
        </div>
      </header>

      <section className="now">
        <div>
          <p className="now-label">NOW · DECK {current.deck} · {current.vibe.toUpperCase()}</p>
          <h2>{current.title}</h2>
          <p className="artists">{current.artists.join(', ')}</p>
        </div>
        <div className="now-next">
          <p className="now-label">NEXT</p>
          <h3>{nextTrack ? nextTrack.title : 'lights up'}</h3>
          {upcoming && (
            <p className="countdown">
              {TRANSITION_LABELS[upcoming.kind]} IN {formatClock(upcoming.at - timeMs)}
            </p>
          )}
          {live.length > 1 && (
            <p className="live-overlap">
              BOTH DECKS LIVE · {live.map((t) => t.title).join(' × ')}
            </p>
          )}
        </div>
      </section>

      <Timeline
        mix={mix}
        timeMs={timeMs}
        selectedId={selectedId}
        playing={playing}
        onScrub={(ms) => {
          setTimeMs(ms);
          const t = trackAt(mix, ms);
          if (t) setSelectedId(t.id);
        }}
        onSelect={setSelectedId}
      />

      <section className="detail-grid">
        <article className="cue">
          <p className="now-label">CUE · #{selected.n}</p>
          <h3>{selected.title}</h3>
          <p className="artists">{selected.artists.join(', ')} — {selected.album}</p>
          <dl>
            <div>
              <dt>On the mix</dt>
              <dd>
                {formatClock(selected.mixInMs)} – {formatClock(selected.mixOutMs)}
              </dd>
            </div>
            <div>
              <dt>Slice of the song</dt>
              <dd>
                {formatClock(selected.useFromMs)} – {formatClock(selected.useToMs)} of {formatClock(selected.durationMs)}
              </dd>
            </div>
            <div>
              <dt>In</dt>
              <dd>
                <strong>{TRANSITION_LABELS[selected.transitionIn.type]}</strong>
                {selected.transitionIn.durationMs ? ` · ${formatClock(selected.transitionIn.durationMs)}` : ''}
                <span>{selected.transitionIn.note}</span>
              </dd>
            </div>
            <div>
              <dt>Out</dt>
              <dd>
                <strong>{TRANSITION_LABELS[selected.transitionOut.type]}</strong>
                {selected.transitionOut.durationMs ? ` · ${formatClock(selected.transitionOut.durationMs)}` : ''}
                <span>{selected.transitionOut.note}</span>
              </dd>
            </div>
            <div>
              <dt>Stolen from</dt>
              <dd>{selected.rooms.join(' · ')}</dd>
            </div>
          </dl>
          <a
            className="spotify"
            href={`https://open.spotify.com/track/${selected.spotifyId}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in Spotify
          </a>
        </article>

        <article className="honesty">
          <p className="now-label">CAN YOU HEAR THIS</p>
          <h3>Six cue sheets. Still not an MP3.</h3>
          <p>
            Play walks this {formatClock(mix.runtimeMs)} map — order, overlaps, cuts.
            It does not play the recordings. Switch crates up top; each one is songs
            you already claimed.
          </p>
          <p>
            Cue sheets live in <code>src/mix.js</code>. Same rule as before: local
            files would make a bounce; Spotify will not give us the audio.
          </p>
        </article>
      </section>

      <section className="setlist">
        <h2>The set</h2>
        <ol>
          {tracks.map((t) => {
            const liveNow = timeMs >= t.mixInMs && timeMs < t.mixOutMs;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  className={`row vibe-${t.vibe}${selectedId === t.id ? ' is-selected' : ''}${liveNow ? ' is-live' : ''}`}
                  onClick={() => {
                    setSelectedId(t.id);
                    setTimeMs(t.mixInMs);
                    setPlaying(false);
                  }}
                >
                  <span className="idx">{t.n}</span>
                  <span className="row-main">
                    <strong>{t.title}</strong>
                    <em>{t.artists.join(', ')}</em>
                  </span>
                  <span className="row-vibe">{t.vibe}</span>
                  <span className="row-clock">
                    {formatClock(t.mixInMs)}
                    <small>
                      {TRANSITION_LABELS[t.transitionOut.type]}
                      {t.transitionOut.durationMs ? ` ${formatClock(t.transitionOut.durationMs)}` : ''}
                    </small>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
