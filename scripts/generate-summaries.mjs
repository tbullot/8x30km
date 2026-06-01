// Run this once locally to generate all summaries:
// node scripts/generate-summaries.mjs
//
// Requires: ANTHROPIC_API_KEY in your .env.local
// Output: data/summaries.json (commit this file)

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = join(__dirname, "../.env.local");
try {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
} catch {
  console.error("Could not read .env.local — make sure it exists with ANTHROPIC_API_KEY");
  process.exit(1);
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY in .env.local");
  process.exit(1);
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m}m`;
}

function formatPace(distanceKm, movingTimeS) {
  const paceSecPerKm = movingTimeS / distanceKm;
  const paceMin = Math.floor(paceSecPerKm / 60);
  const paceSec = Math.round(paceSecPerKm % 60);
  return `${paceMin}:${String(paceSec).padStart(2, "0")} /km`;
}

const editions = [
  { year: "2018", label: "Paris → Lille", activities: [
    { day: 1, date: "2018-03-24", distance_km: 27.15, elevation_m: 203, moving_time_s: 9911 },
    { day: 2, date: "2018-03-25", distance_km: 27.63, elevation_m: 219, moving_time_s: 10425 },
    { day: 3, date: "2018-03-26", distance_km: 29.75, elevation_m: 287, moving_time_s: 11274 },
    { day: 4, date: "2018-03-27", distance_km: 27.18, elevation_m: 278, moving_time_s: 10298 },
    { day: 5, date: "2018-03-28", distance_km: 29.65, elevation_m: 253, moving_time_s: 10258 },
    { day: 6, date: "2018-03-29", distance_km: 29.54, elevation_m: 121, moving_time_s: 9765 },
    { day: 7, date: "2018-03-30", distance_km: 23.11, elevation_m: 77,  moving_time_s: 7154 },
    { day: 8, date: "2018-03-31", distance_km: 26.85, elevation_m: 106, moving_time_s: 8552 },
  ]},
  { year: "2021", label: "Aachen → Lille", activities: [
    { day: 1, date: "2021-10-02", distance_km: 25.8,  elevation_m: 191, moving_time_s: 8932 },
    { day: 2, date: "2021-10-03", distance_km: 25.06, elevation_m: 230, moving_time_s: 8809 },
    { day: 3, date: "2021-10-04", distance_km: 26.66, elevation_m: 192, moving_time_s: 9052 },
    { day: 4, date: "2021-10-05", distance_km: 27,    elevation_m: 326, moving_time_s: 9743 },
    { day: 5, date: "2021-10-06", distance_km: 27,    elevation_m: 208, moving_time_s: 9716 },
    { day: 6, date: "2021-10-07", distance_km: 26.83, elevation_m: 220, moving_time_s: 9512 },
    { day: 7, date: "2021-10-08", distance_km: 26.85, elevation_m: 210, moving_time_s: 9641 },
    { day: 8, date: "2021-10-09", distance_km: 31,    elevation_m: 125, moving_time_s: 12011 },
  ]},
  { year: "2026", label: "London → Lille", activities: [
    { day: 1, date: "2026-05-23", distance_km: 32.01, elevation_m: 466, moving_time_s: 11870 },
    { day: 2, date: "2026-05-24", distance_km: 32.04, elevation_m: 456, moving_time_s: 12993 },
    { day: 3, date: "2026-05-25", distance_km: 29.01, elevation_m: 319, moving_time_s: 12115 },
    { day: 4, date: "2026-05-26", distance_km: 35.51, elevation_m: 667, moving_time_s: 16650 },
    { day: 5, date: "2026-05-27", distance_km: 29.07, elevation_m: 352, moving_time_s: 12319 },
    { day: 6, date: "2026-05-28", distance_km: 31.2,  elevation_m: 186, moving_time_s: 12370 },
    { day: 7, date: "2026-05-29", distance_km: 34,    elevation_m: 466, moving_time_s: 14499 },
    { day: 8, date: "2026-05-30", distance_km: 33.01, elevation_m: 64,  moving_time_s: 13578 },
  ]},
];

async function generateSummary(edition, activity) {
  const prompt = `You are summarizing a day from a running adventure called 8x30km, where two friends (Tom and Julien) run ~30km/day across 8 consecutive days, city to city.

Edition: ${edition.label} (${edition.year})
Day ${activity.day} of 8 — ${activity.date}
Distance: ${activity.distance_km} km
Elevation: ${activity.elevation_m} m
Moving time: ${formatTime(activity.moving_time_s)}
Pace: ${formatPace(activity.distance_km, activity.moving_time_s)}

Write a vivid 2–3 sentence summary of this day's run. Be specific, evocative, and human. Don't repeat the stats verbatim — bring the adventure to life.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  if (!data.content?.[0]?.text) {
    throw new Error(`API error: ${JSON.stringify(data)}`);
  }
  return data.content[0].text;
}

async function main() {
  const summaries = {};
  let total = 0;

  for (const edition of editions) {
    summaries[edition.year] = {};
    for (const activity of edition.activities) {
      const key = `${edition.year}-${activity.day}`;
      process.stdout.write(`Generating ${key}... `);
      try {
        const summary = await generateSummary(edition, activity);
        summaries[edition.year][activity.day] = summary;
        total++;
        console.log("✓");
        // Small delay to avoid rate limits
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error(`✗ ${err.message}`);
        summaries[edition.year][activity.day] = null;
      }
    }
  }

  const outPath = join(__dirname, "../data/summaries.json");
  writeFileSync(outPath, JSON.stringify(summaries, null, 2));
  console.log(`\n✅ Generated ${total}/24 summaries → data/summaries.json`);
  console.log("Commit this file and push to Vercel.");
}

main();
