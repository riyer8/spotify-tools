import React, { useEffect, useRef } from 'react';
import spotifyLogo from './assets/spotify.png';

export default function PlaylistLoadScreen({ items, phase }) {
  const listRef = useRef(null);
  const itemRefs = useRef({});
  const prevStatusRef = useRef({});

  const doneCount = items.filter(i => i.status === 'done').length;
  const errorCount = items.filter(i => i.status === 'error').length;
  const loadingCount = items.filter(i => i.status === 'loading').length;
  const total = items.length;
  const pct = total ? Math.round(((doneCount + errorCount) / total) * 100) : 0;

  useEffect(() => {
    if (!listRef.current || items.length === 0) return;

    let scrollTargetId = null;

    for (const item of items) {
      const prevStatus = prevStatusRef.current[item.id];
      if (prevStatus !== item.status) {
        scrollTargetId = item.id;
        prevStatusRef.current[item.id] = item.status;
      }
    }

    if (!scrollTargetId) {
      const active = items.find(i => i.status === 'loading');
      if (active) scrollTargetId = active.id;
    }

    const el = scrollTargetId ? itemRefs.current[scrollTargetId] : null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [items]);

  useEffect(() => {
    if (items.length === 0) prevStatusRef.current = {};
  }, [items.length]);

  return (
    <div className="load-screen">
      <div className="load-screen-inner">
        <div className="load-screen-header">
          <div className="load-pulse-ring">
            <img src={spotifyLogo} alt="" className="load-logo" />
          </div>
          <h2>{phase === 'playlists' ? 'Finding your playlists…' : 'Loading your library'}</h2>
          <p className="load-subtitle">
            {phase === 'playlists'
              ? 'Connecting to Spotify'
              : `${doneCount + errorCount} of ${total || '…'} playlists`}
            {loadingCount > 0 && phase === 'tracks' && ` · ${loadingCount} in flight`}
          </p>
          {total > 0 && (
            <div className="load-progress-track">
              <div className="load-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="load-list-wrap">
            <div className="load-list-fade load-list-fade-top" />
            <ul className="load-list" ref={listRef}>
              {items.map((item) => (
                <li
                  key={item.id}
                  ref={el => { itemRefs.current[item.id] = el; }}
                  className={`load-item load-item-${item.status}`}
                >
                  <span className="load-item-icon">
                    {item.status === 'done' && '✓'}
                    {item.status === 'error' && '!'}
                    {item.status === 'loading' && <span className="load-dot" />}
                    {item.status === 'pending' && '·'}
                  </span>
                  <span className="load-item-name">{item.name}</span>
                  {item.status === 'done' && item.trackCount != null && (
                    <span className="load-item-meta">{item.trackCount} tracks</span>
                  )}
                  {item.status === 'error' && (
                    <span className="load-item-meta load-item-skip" title={item.error}>
                      skipped
                    </span>
                  )}
                  {item.status === 'loading' && (
                    <span className="load-item-meta load-item-active">loading…</span>
                  )}
                </li>
              ))}
            </ul>
            <div className="load-list-fade load-list-fade-bottom" />
          </div>
        )}

        {errorCount > 0 && doneCount + errorCount === total && (
          <p className="load-footnote">
            {errorCount} playlist{errorCount === 1 ? '' : 's'} couldn't be loaded and were skipped.
          </p>
        )}
      </div>
    </div>
  );
}
