export default async function handler(req, res) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const basicAuth = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const { access_token } = await tokenRes.json();
    const playlistId = "YOUR_PLAYLIST_ID"; // 👈 replace with your playlist ID

    const playlistRes = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const data = await playlistRes.json();

    if (!data.items || data.items.length === 0) {
      return res.status(200).json({ message: "No songs found in the playlist 🎧" });
    }

    const songs = data.items
      .filter((item) => item.track)
      .map((item) => ({
        title: item.track.name,
        artist: item.track.artists.map((a) => a.name).join(", "),
        albumArt: item.track.album.images[0]?.url,
        spotifyUrl: item.track.external_urls.spotify,
        addedAt: item.added_at,
      }))
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    // Cache response for 1 hour
    res.setHeader("Cache-Control", "s-maxage=3600");

    res.status(200).json(songs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
