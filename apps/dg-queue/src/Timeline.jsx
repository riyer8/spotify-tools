import { useEffect, useRef } from 'react';
import { TRANSITION_LABELS, formatClock, overlaps } from './mix.js';

const PX_PER_MS = 0.18;

export default function Timeline({ mix, timeMs, selectedId, playing, onScrub, onSelect }) {
  const scrollerRef = useRef(null);
  const tracks = mix.tracks;
  const width = mix.runtimeMs * PX_PER_MS;
  const playX = timeMs * PX_PER_MS;

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollLeft = 0;
  }, [mix.id]);

  useEffect(() => {
    if (!playing || !scrollerRef.current) return;
    const el = scrollerRef.current;
    const target = playX - el.clientWidth * 0.35;
    el.scrollLeft = Math.max(0, target);
  }, [playing, playX]);

  const cuts = overlaps(mix);
  const minutes = [];
  for (let m = 0; m <= Math.floor(mix.runtimeMs / 60000); m += 1) {
    minutes.push(m);
  }

  const onClickRuler = (event) => {
    const scroller = event.currentTarget.closest('.timeline-scroll');
    const x = event.clientX - scroller.getBoundingClientRect().left + scroller.scrollLeft;
    onScrub(Math.max(0, Math.min(mix.runtimeMs, x / PX_PER_MS)));
  };

  return (
    <section className="timeline-wrap">
      <div className="timeline-head">
        <h2>Two decks · when they overlap, that is the transition</h2>
        <p>{mix.legend} Click anywhere on the ruler.</p>
      </div>
      <div className="timeline-scroll" ref={scrollerRef}>
        <div className="timeline" style={{ width }} onClick={onClickRuler} role="presentation">
          <div className="ruler">
            {minutes.map((m) => (
              <span key={m} className="ruler-mark" style={{ left: m * 60000 * PX_PER_MS }}>
                {m}:00
              </span>
            ))}
          </div>

          {['A', 'B'].map((deck) => (
            <div key={deck} className={`deck deck-${deck.toLowerCase()}`}>
              <span className="deck-label">DECK {deck}</span>
              {tracks.filter((t) => t.deck === deck).map((t) => {
                const left = t.mixInMs * PX_PER_MS;
                const w = (t.mixOutMs - t.mixInMs) * PX_PER_MS;
                const live = timeMs >= t.mixInMs && timeMs < t.mixOutMs;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`clip vibe-${t.vibe}${live ? ' is-live' : ''}${selectedId === t.id ? ' is-selected' : ''}`}
                    style={{ left, width: Math.max(w, 8) }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(t.id);
                      onScrub(t.mixInMs);
                    }}
                  >
                    <span className="clip-n">{t.n}</span>
                    <span className="clip-title">{t.title}</span>
                    <span className="clip-meta">
                      {formatClock(t.mixInMs)}–{formatClock(t.mixOutMs)}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          <div className="overlap-lane">
            {cuts.map((cut) => {
              const left = cut.startMs * PX_PER_MS;
              const w = cut.hardCut ? 72 : Math.max(cut.durationMs * PX_PER_MS, 48);
              return (
                <button
                  key={cut.id}
                  type="button"
                  className={`overlap${cut.hardCut ? ' is-cut' : ''} vibe-${cut.to.vibe}`}
                  style={{ left: cut.hardCut ? left - 36 : left, width: w }}
                  title={cut.note}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(cut.to.id);
                    onScrub(cut.startMs);
                  }}
                >
                  {TRANSITION_LABELS[cut.type] || cut.type}
                  <span>{cut.hardCut ? formatClock(cut.startMs) : formatClock(cut.durationMs)}</span>
                </button>
              );
            })}
          </div>

          <div className="playhead" style={{ left: playX }} />
        </div>
      </div>
    </section>
  );
}
