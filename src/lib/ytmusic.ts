import { cacheLife } from "next/cache";
import { Innertube } from "youtubei.js";
import { bestMatch, queryVariants, similarity } from "./translit";
import type { Track } from "./types";

/*
  YouTube Music через youtubei.js — тот же внутренний API, что у приложения YouTube Music.
  Ключ не нужен, лимита в 100 поисков в день нет. Неофициально: если YouTube что-то поменяет,
  поиск может отвалиться до обновления библиотеки (npm i youtubei.js@latest).
  Играем найденное официальным встраиваемым плеером (lib/ytEngine.ts).

  Кэш — "use cache: remote": общий для всех серверов Vercel, а не в памяти одного экземпляра.
  Так повторные поиски и подборы не ходят в YouTube лишний раз — меньше шанс, что он нас заблокирует.
*/

let client: Promise<Innertube> | null = null;

function yt() {
  client ??= Innertube.create({ lang: "ru", location: "UA", retrieve_player: false }).catch((e) => {
    client = null; // следующая попытка создаст клиента заново
    throw e;
  });
  return client;
}

interface SongItem {
  id?: string;
  title?: string;
  item_type?: string;
  artists?: { name: string }[];
  author?: { name: string };
  duration?: { seconds: number };
  thumbnail?: { contents?: { url: string }[] };
}

// Обложки YouTube Music приходят 60×60, размер зашит в URL (=w60-h60) — просим крупнее.
function bigArtwork(url: string | undefined) {
  if (!url) return null;
  return url.replace(/=w\d+-h\d+/, "=w480-h480");
}

const UNKNOWN_ARTIST = "неизвестный призрак";

function toTrack(s: SongItem): Track | null {
  if (!s.id || !s.title) return null;
  const artist = s.artists?.map((a) => a.name).filter(Boolean).join(", ") || s.author?.name || UNKNOWN_ARTIST;
  return {
    id: `youtube-${s.id}`,
    source: "youtube",
    sourceId: s.id,
    title: s.title,
    artist,
    artwork: bigArtwork(s.thumbnail?.contents?.at(-1)?.url),
    duration: s.duration?.seconds ?? 0,
    full: true,
    link: `https://music.youtube.com/watch?v=${s.id}`,
  };
}

async function searchSongs(query: string) {
  const res = await (await yt()).music.search(query, { type: "song" });
  const shelf = res.contents?.find((c) => "contents" in c && Array.isArray(c.contents) && c.contents.length) as
    | { contents: SongItem[] }
    | undefined;
  return (shelf?.contents ?? []).map(toTrack).filter((t): t is Track => t !== null);
}

/** Живая проверка без кэша — для /api/health. Сколько песен нашлось по известному запросу. */
export async function ytmPing() {
  return (await searchSongs("billie eilish")).length;
}

/**
 * Чистим выдачу YouTube Music: выдача зависит от страны сервера (Vercel — США) и бывает
 * замусорена чужими заливками. Порядок YouTube сохраняем, но:
 * - песни без артиста («неизвестный призрак») — в конец;
 * - если запрос похож на имя артиста — его песни наверх;
 * - дубли (то же название у того же артиста) — убираем.
 */
function tidy(songs: Track[], query: string) {
  const variants = queryVariants(query);
  const seen = new Set<string>();
  return songs
    .filter((t) => {
      const key = `${t.artist}|${t.title}`.toLowerCase();
      return !seen.has(key) && seen.add(key);
    })
    .map((t, i) => {
      const known = t.artist !== UNKNOWN_ARTIST;
      const artistHit = known && bestMatch(t.artist, variants) >= 0.8;
      return { t, i, rank: (known ? 0 : 2) - (artistHit ? 1 : 0) };
    })
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((x) => x.t);
}

/** Поиск песен. Кириллицу YouTube Music понимает сам: «ту холис» → 2hollis. */
export async function ytmSearch(query: string, limit = 25) {
  "use cache: remote";
  cacheLife("minutes");
  try {
    return tidy(await searchSongs(query), query).slice(0, limit);
  } catch {
    return [];
  }
}

/** Полная версия трека из Deezer-чарта. Бросает при сбое — такое не кэшируется. */
export async function ytmFindSong(artist: string, title: string) {
  "use cache: remote";
  cacheLife({ stale: 86400, revalidate: 30 * 86400, expire: 90 * 86400 });
  const songs = await searchSongs(`${artist} ${title}`);
  // Лучшая по совпадению артиста и названия, а не первая попавшаяся (часто это чей-то кавер)
  const scored = songs.map((t, i) => ({
    t,
    i,
    s: similarity(t.artist, artist) + similarity(t.title, title),
  }));
  scored.sort((a, b) => b.s - a.s || a.i - b.i);
  return scored[0]?.t.sourceId ?? null;
}

/**
 * Запасной путь — публичный oEmbed YouTube: его не режут, даже когда с серверов хостинга
 * (Vercel) getInfo блокируется. Нет длительности — плеер узнает её при воспроизведении.
 */
async function oembedTrack(videoId: string): Promise<Track | null> {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const o = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
  // У автоканалов YouTube Music имя вида «2hollis - Topic»
  const author = (o.author_name ?? "").replace(/\s+-\s+Topic$/i, "");
  // В oEmbed нет длительности, а обложка — кадр 4:3. Поиск (он с хостинга не режется)
  // обычно находит ту же песню — берём оттуда длительность и квадратную обложку.
  if (o.title) {
    const same = (await searchSongs(`${author} ${o.title}`).catch(() => [])).find((t) => t.sourceId === videoId);
    if (same) return same;
  }
  return toTrack({
    id: videoId,
    title: o.title,
    author: { name: author },
    thumbnail: { contents: o.thumbnail_url ? [{ url: o.thumbnail_url }] : [] },
  });
}

/** Трек по id видео — для страницы трека. */
export async function ytmTrack(videoId: string): Promise<Track | null> {
  "use cache: remote";
  cacheLife("hours");
  try {
    const info = await (await yt()).music.getInfo(videoId);
    const b = info.basic_info;
    if (b.id && b.title) {
      return toTrack({
        id: b.id,
        title: b.title,
        author: { name: b.author ?? "" },
        duration: { seconds: b.duration ?? 0 },
        thumbnail: { contents: b.thumbnail },
      });
    }
  } catch {
    // getInfo заблокирован или упал — пробуем oEmbed ниже
  }
  try {
    return await oembedTrack(videoId);
  } catch {
    return null;
  }
}
