import { cacheLife } from "next/cache";
import type { Track } from "./types";

import { AUDIUS_APP_NAME as APP_NAME } from "./stream";

const API = "https://api.audius.co/v1";

interface AudiusTrack {
  id: string;
  title: string;
  duration: number;
  permalink: string;
  genre?: string;
  is_streamable?: boolean;
  stream_conditions?: unknown;
  artwork?: Record<string, string> | null;
  user: { name: string; handle: string };
}

function toTrack(t: AudiusTrack): Track {
  return {
    id: `audius-${t.id}`,
    source: "audius",
    sourceId: t.id,
    title: t.title,
    artist: t.user?.name ?? "unknown ghost",
    artwork: t.artwork?.["480x480"] ?? t.artwork?.["150x150"] ?? null,
    duration: t.duration,
    full: true,
    link: `https://audius.co${t.permalink}`,
    genre: t.genre,
  };
}

// Платные/закрытые треки (stream_conditions) и непотоковые отдают 404 — выкидываем.
const playable = (t: AudiusTrack) => t.is_streamable !== false && !t.stream_conditions;

async function get<T>(path: string): Promise<T | null> {
  const sep = path.includes("?") ? "&" : "?";
  try {
    const res = await fetch(`${API}${path}${sep}app_name=${APP_NAME}`);
    if (!res.ok) return null;
    return ((await res.json()) as { data: T }).data;
  } catch {
    return null;
  }
}

export async function audiusTrending(opts: { genre?: string; limit?: number } = {}) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 86400 });
  const params = new URLSearchParams({ time: "week" });
  if (opts.genre) params.set("genre", opts.genre);
  const data = await get<AudiusTrack[]>(`/tracks/trending?${params}`);
  return (data ?? []).filter(playable).slice(0, opts.limit ?? 20).map(toTrack);
}

export async function audiusSearch(query: string, limit = 20) {
  "use cache";
  cacheLife("minutes");
  const data = await get<AudiusTrack[]>(`/tracks/search?query=${encodeURIComponent(query)}`);
  return (data ?? []).filter(playable).slice(0, limit).map(toTrack);
}

export async function audiusTrack(id: string) {
  "use cache";
  cacheLife("hours");
  const data = await get<AudiusTrack>(`/tracks/${encodeURIComponent(id)}`);
  return data && playable(data) ? toTrack(data) : null;
}
