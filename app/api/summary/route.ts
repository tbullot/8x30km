import { NextResponse } from "next/server";
import { formatTime, formatPace } from "@/lib/utils";
import { Edition, Activity } from "@/data/editions";

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const { edition, activity, postExcerpt, postTitle } = await req.json() as {
    edition: Edition;
    activity: Activity;
    postExcerpt?: string;
    postTitle?: string;
  };

  const prompt = `You are summarizing a day from a running adventure called 8x30km, where two friends (Tom and Julien) run ~30km/day across 8 consecutive days.

Edition: ${edition.label} (${edition.year})
Day ${activity.day} of 8 — ${activity.date}
Distance: ${activity.distance_km} km
Elevation: ${activity.elevation_m} m
Moving time: ${formatTime(activity.moving_time_s)}
Pace: ${formatPace(activity.distance_km, activity.moving_time_s)}
${postTitle ? `\nBlog post title: ${postTitle}` : ""}
${postExcerpt ? `\nBlog post excerpt: ${postExcerpt}` : ""}

Write a vivid 2–3 sentence summary of this day's run. Be specific, evocative, and human. Don't repeat the stats verbatim — bring the adventure to life.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const text = data.content?.[0]?.text || null;

  if (!text) {
    return NextResponse.json({ error: "No summary generated", detail: data }, { status: 500 });
  }

  return NextResponse.json({ summary: text });
}
