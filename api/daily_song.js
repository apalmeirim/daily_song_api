// api/daily-song.js
export default async function handler(req, res) {
  const basicAuth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  // Step 1. Get access token from Spotify
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tokenRes.json();

  // Step 2. Fetch your playlist tracks
  const playlistId = "YOUR_SPOTIFY_PLAYLIST_ID"; // e.g. 37i9dQZF1DXcBWIGoYBM5M
  const playlistRes = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );
  const data = await playlistRes.json();

  // Step 3. Find latest added track
  const latest = data.items.sort(
    (a, b) => new Date(b.added_at) - new Date(a.added_at)
  )[0];

  // Step 4. Send simplified response
  res.setHeader("Cache-Control", "s-maxage=3600");
  res.status(200).json({
    title: latest.track.name,
    artist: latest.track.artists.map(a => a.name).join(", "),
    albumArt: latest.track.album.images[0].url,
    spotifyUrl: latest.track.external_urls.spotify,
    addedAt: latest.added_at,
  });
}
