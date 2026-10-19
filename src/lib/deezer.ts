import { cacheLife } from "next/cache";
import type { Track } from "./types";

const API = "https://api.deezer.com";

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  link: string;
  preview: string;
  artist: { name: string };
  album: { cover_medium?: string; cover_big?: string };
}

const PREVIEW_SECONDS = 30;

function toTrack(t: DeezerTrack): Track {
  return {
    id: `deezer-${t.id}`,
    source: "deezer",
    sourceId: String(t.id),
    title: t.title,
    artist: t.artist?.name ?? "unknown ghost",
    artwork: t.album?.cover_big ?? t.album?.cover_medium ?? null,
    duration: Math.min(PREVIEW_SECONDS, t.duration || PREVIEW_SECONDS),
    full: false,
    fullDuration: t.duration || undefined,
    link: t.link,
  };
}

const hasPreview = (t: DeezerTrack) => Boolean(t.preview);

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) return null;
    const json = (await res.json()) as T & { error?: unknown };
    return json.error ? null : json;
  } catch {
    return null;
  }
}

export async function deezerChart(limit = 20) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 1800, expire: 86400 });
  const data = await get<{ data: DeezerTrack[] }>(`/chart/0/tracks?limit=${limit}`);
  return (data?.data ?? []).filter(hasPreview).map(toTrack);
}

export async function deezerSearch(query: string, limit = 20) {
  "use cache";
  cacheLife("minutes");
  const data = await get<{ data: DeezerTrack[] }>(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return (data?.data ?? []).filter(hasPreview).map(toTrack);
}

export async function deezerArtistSearch(query: string, limit = 5) {
  "use cache";
  cacheLife("hours");
  const data = await get<{ data: { id: number; name: string; picture_medium?: string; nb_fan?: number }[] }>(
    `/search/artist?q=${encodeURIComponent(query)}&limit=${limit}`,
  );
  return (data?.data ?? []).map((a) => ({ name: a.name, picture: a.picture_medium ?? null, fans: a.nb_fan ?? 0 }));
}

export async function deezerTrack(id: string) {
  "use cache";
  // Метаданные трека живут долго; ссылку на превью отсюда не берём — она протухает.
  cacheLife("hours");
  const data = await get<DeezerTrack>(`/track/${encodeURIComponent(id)}`);
  return data && hasPreview(data) ? toTrack(data) : null;
}

/** Ссылки на превью подписаны и протухают — всегда берём свежую, без кэша. */
export async function deezerPreviewUrl(id: string) {
  const data = await get<DeezerTrack>(`/track/${encodeURIComponent(id)}`);
  return data?.preview || null;
}
