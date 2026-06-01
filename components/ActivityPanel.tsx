"use client";

import summaries from "@/data/summaries.json";

import { useEffect, useState } from "react";
import { Activity, Edition } from "@/data/editions";
import { formatTime, formatPace } from "@/lib/utils";

type TumblrPost = {
  id: number;
  date: string;
  url: string;
  title: string | null;
  body: string | null;
  summary: string | null;
  tags: string[];
  photos: string[];
};

type Props = {
  edition: Edition;
  activity: Activity;
  onClose: () => void;
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 flex flex-col gap-1">
      <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>
      <span className="text-lg font-semibold text-white">{value}</span>
    </div>
  );
}

export default function ActivityPanel({ edition, activity, onClose }: Props) {
  const [post, setPost] = useState<TumblrPost | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Fetch Tumblr posts and try to match by date
  useEffect(() => {
    setPost(null);
    setSummary(null);
    setLoadingPost(true);

    // Day 8 of editions 2021 and 2026 have no blog post
    if (activity.day === 8 && (edition.year === "2021" || edition.year === "2026")) {
      setLoadingPost(false);
      return;
    }

    fetch(`/api/tumblr?limit=50`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.posts) return;
        const activityDate = new Date(activity.date);

        // Posts are published the same day as the run.
        // Day 8 of 2018 was posted a few days later (up to 5 days window).
        const isLatePost = activity.day === 8 && edition.year === "2018";

        const matched = data.posts.find((p: TumblrPost) => {
          const postDate = new Date(p.date);
          const diffDays = (postDate.getTime() - activityDate.getTime()) / (24 * 60 * 60 * 1000);
          return isLatePost ? diffDays >= 0 && diffDays <= 5 : Math.abs(diffDays) < 1;
        });
        setPost(matched || null);
        setLoadingPost(false);
      })
      .catch(() => setLoadingPost(false));
  }, [activity.date]);


  // Load pre-generated summary from static JSON
  useEffect(() => {
    const yearData = summaries[edition.year as keyof typeof summaries] as Record<string, string>;
    const text = yearData?.[String(activity.day)] || null;
    setSummary(text);
    setLoadingSummary(false);
  }, [activity, edition]);


  return (
    <div className="fixed inset-0 sm:absolute sm:inset-auto sm:top-0 sm:right-0 sm:h-full sm:w-[400px] bg-zinc-900 sm:bg-zinc-900/95 backdrop-blur-sm border-l border-white/10 flex flex-col overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10" style={{ borderLeftColor: edition.color, borderLeftWidth: 4 }}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: edition.color }}>
            {edition.label} · Day {activity.day}/8
          </div>
          <div className="text-white font-bold text-base">{activity.date}</div>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none px-2">×</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 p-4">
        <StatCard label="Distance" value={`${activity.distance_km} km`} />
        <StatCard label="Elevation" value={`${activity.elevation_m} m`} />
        <StatCard label="Time" value={formatTime(activity.moving_time_s)} />
        <StatCard label="Pace" value={formatPace(activity.distance_km, activity.moving_time_s)} />
      </div>

      {/* Strava link */}
      <div className="px-4 pb-2">
        <a
          href={`https://www.strava.com/activities/${activity.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          style={{ color: edition.color }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
          View on Strava
        </a>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* AI Summary */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">AI Summary</div>
          {loadingSummary ? (
            <div className="text-white/40 text-sm animate-pulse">Generating summary…</div>
          ) : summary ? (
            <p className="text-white/80 text-sm leading-relaxed">{summary}</p>
          ) : (
            <p className="text-white/30 text-sm italic">No summary available.</p>
          )}
        </div>

        {/* Blog post */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Blog Post</div>
          {loadingPost ? (
            <div className="text-white/40 text-sm animate-pulse">Loading post…</div>
          ) : post ? (
            <div className="space-y-3">
              {post.photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.photos[0]} alt="" className="w-full rounded-lg object-cover max-h-48" />
              )}
              {post.title && <div className="text-white font-semibold text-sm">{post.title}</div>}
              {post.body && (
                <div
                  className="text-white/70 text-sm leading-relaxed prose-sm prose-invert line-clamp-8"
                  dangerouslySetInnerHTML={{ __html: post.body }}
                />
              )}
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-white/40 hover:text-white/70 underline"
              >
                Read full post on Tumblr →
              </a>
            </div>
          ) : (
            <p className="text-white/30 text-sm italic">
              {activity.day === 8 && (edition.year === "2021" || edition.year === "2026")
                ? "No blog post for the final day of this edition."
                : "No blog post found for this day."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
