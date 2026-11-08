import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:3010";

function imageUrl(images) {
  if (!images?.length) return "";
  const sorted = [...images].sort((a, b) => (a.width || 0) - (b.width || 0));
  return (sorted.find((img) => (img.width || 0) >= 64) || sorted[sorted.length - 1]).url;
}

function RankedList({ items, kind }) {
  if (!items.length) {
    return <p className="empty">Spotify did not return any {kind} for this window.</p>;
  }

  return (
    <ol className="rank">
      {items.map((item, index) => {
        const artists = kind === "tracks" ? item.artists.map((artist) => artist.name).join(", ") : "";
        const detail = kind === "tracks" ? artists : (item.genres || []).slice(0, 2).join(" · ");
        const href = item.external_urls?.spotify;
        return (
          <li key={item.id}>
            <span className="rank-num">{index + 1}</span>
            {imageUrl(kind === "tracks" ? item.album?.images : item.images) ? (
              <img
                className={kind === "artists" ? "art round" : "art"}
                src={imageUrl(kind === "tracks" ? item.album?.images : item.images)}
                alt=""
              />
            ) : (
              <span className={kind === "artists" ? "art round placeholder" : "art placeholder"} />
            )}
            <span className="rank-copy">
              {href ? (
                <a href={href} target="_blank" rel="noreferrer">{item.name}</a>
              ) : (
                <span className="title">{item.name}</span>
              )}
              {detail && <span className="detail">{detail}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function App() {
  const [token, setToken] = useState("");
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromURL = params.get("access_token");
    if (!tokenFromURL) return;

    window.history.replaceState({}, "", window.location.pathname);
    setToken(tokenFromURL);
    setStatus("loading");

    const headers = { Authorization: `Bearer ${tokenFromURL}` };
    Promise.all([
      axios.get(`${API}/top/artists`, { headers }),
      axios.get(`${API}/top/tracks`, { headers }),
    ])
      .then(([artists, tracks]) => {
        setTopArtists(artists.data.items || []);
        setTopTracks(tracks.data.items || []);
        setStatus("ready");
      })
      .catch((err) => {
        const message = err.response?.data?.error || err.message;
        setError(message);
        setStatus("error");
      });
  }, []);

  return (
    <main>
      <header>
        <p className="kicker">Since April</p>
        <h1>Your last six months</h1>
        <p className="lede">
          Spotify’s medium-term ranking, about April through now. Order is affinity, not a play count.
        </p>
      </header>

      {!token && status !== "loading" && (
        <a className="login" href={`${API}/login`}>Log in with Spotify</a>
      )}

      {status === "loading" && <p className="empty">Pulling your top artists and tracks…</p>}

      {status === "error" && (
        <p className="error">
          Could not load your listening ranks. {error}
          {" "}
          <a href={`${API}/login`}>Try logging in again</a>
        </p>
      )}

      {status === "ready" && (
        <div className="columns">
          <section>
            <h2>Top artists</h2>
            <RankedList items={topArtists} kind="artists" />
          </section>
          <section>
            <h2>Top tracks</h2>
            <RankedList items={topTracks} kind="tracks" />
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
