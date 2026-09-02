import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [token, setToken] = useState("");
  const [topTracks, setTopTracks] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromURL = params.get("access_token");
    if (tokenFromURL) {
      setToken(tokenFromURL);
      axios.get(`http://127.0.0.1:3000/top/tracks?token=${tokenFromURL}`).then(res => {
        setTopTracks(res.data.items);
      });
    }
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      {!token && <a href="http://127.0.0.1:3000/login">Log in with Spotify</a>}
      {token && (
        <>
          <h2>Your Top Tracks</h2>
          <ul>
            {topTracks.map(track => (
              <li key={track.id}>
                <strong>{track.name}</strong> by {track.artists.map(a => a.name).join(", ")}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;