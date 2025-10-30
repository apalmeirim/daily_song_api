export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  } 
  
  try {
    // --- Step 1: Get Spotify access token ---
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

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error("Failed to get Spotify access token: " + JSON.stringify(tokenData));
    }

    const access_token = tokenData.access_token;

    // --- Step 2: Fetch playlist tracks ---
    const playlistId = "35iWgU5Ah270CPSMCcP4h4"; // e.g. 37i9dQZF1DXcBWIGoYBM5M
    const playlistRes = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const data = await playlistRes.json();
    if (!data.items || data.items.length === 0) {
      return res.status(200).json({
        message: "No songs found in the playlist yet 🎧",
        raw: data,
      });
    }

    // --- Step 3: Get the latest added track ---
    const latest = data.items.sort(
      (a, b) => new Date(b.added_at) - new Date(a.added_at)
    )[0];

    // --- Step 4: Send it back ---
    res.status(200).json({
      title: latest.track.name,
      artist: latest.track.artists.map((a) => a.name).join(", "),
      albumArt: latest.track.album.images[0].url,
      spotifyUrl: latest.track.external_urls.spotify,
      addedAt: latest.added_at,
    });
  } catch (error) {
    // 👇 This will prevent the generic 500 page and show you the cause
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}
