import { NextResponse } from "next/server";

const BLOG = "8x30km.tumblr.com";
const API_KEY = process.env.TUMBLR_API_KEY || "";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") || "20";
  const offset = searchParams.get("offset") || "0";

  if (!API_KEY) {
    return NextResponse.json({ error: "Missing TUMBLR_API_KEY" }, { status: 500 });
  }

  const url = `https://api.tumblr.com/v2/blog/${BLOG}/posts?api_key=${API_KEY}&limit=${limit}&offset=${offset}&notes_info=false`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    if (data.meta?.status !== 200) {
      return NextResponse.json({ error: "Tumblr error", detail: data }, { status: 500 });
    }

    const posts = (data.response?.posts || []).map((p: Record<string, unknown>) => {
      // Structured photos from photo-type posts
      let photos: string[] = [];
      if (p.type === "photo" && Array.isArray(p.photos)) {
        photos = (p.photos as Array<{ original_size: { url: string } }>)
          .map((ph) => ph.original_size?.url)
          .filter(Boolean);
      }
      // Also extract any <img src> from the HTML body (covers text-type posts with embedded images)
      const body = (p.body || p.caption || "") as string;
      const imgMatches = Array.from(body.matchAll(/<img[^>]+src=["']([^"']+)["']/gi));
      const bodyImages = imgMatches.map((m) => m[1]).filter(Boolean) as string[];
      // Merge, deduplicate
      const allPhotos = [...new Set([...photos, ...bodyImages])];

      return {
        id: p.id,
        type: p.type,
        date: p.date,
        timestamp: p.timestamp,
        url: p.post_url,
        title: p.title || null,
        body: body || null,
        summary: p.summary || null,
        tags: p.tags || [],
        photos: allPhotos,
      };
    });

    return NextResponse.json({ posts, total: data.response?.total_posts });
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed", detail: String(err) }, { status: 500 });
  }
}
