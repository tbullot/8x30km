import { NextResponse } from "next/server";

export async function GET() {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN } = process.env;

  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
    return NextResponse.json({ error: "Missing Strava env vars" }, { status: 500 });
  }

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: STRAVA_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
    next: { revalidate: 3600 }, // cache for 1 hour
  });

  const data = await res.json();
  if (!data.access_token) {
    return NextResponse.json({ error: "Token refresh failed", detail: data }, { status: 500 });
  }

  return NextResponse.json({ access_token: data.access_token, expires_at: data.expires_at });
}
