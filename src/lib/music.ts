import { audiusSearch, audiusTrack, audiusTrending } from "./audius";
import { deezerArtistSearch, deezerSearch, deezerTrack } from "./deezer";
import type { Mood } from "./moods";
import { bestMatch, queryVariants } from "./translit";
import { splitTrackId, type Track } from "./types";
import { hasYouTube } from "./youtube";
import { ytmSearch, ytmTrack } from "./ytmusic";

const PER_VARIANT = 15;
const MAX_RESULTS = 25;

/**
 * Склеивает выдачу по всем вариантам запроса. Если вариант один (запрос латиницей) —
 * доверяем ранжированию самого источника. Если вариантов несколько (запрос кириллицей) —
 * сортируем по похожести исполнителя/названия на любой вариант, иначе «ту холис» → «tu holis»
 * выведет наверх случайных Thalles Roberto вместо 2hollis.
 */
function merge(lists: Track[][], variants: string[], likelyArtist?: string) {
  const seen = new Set<string>();
  const all = lists.flat().filter((t) => !seen.has(t.id) && seen.add(t.id));
  if (variants.length === 1) return all.slice(0, MAX_RESULTS);
  // Если по запросу уверенно угадан исполнитель («дрейк» → Drake), его треки — выше песен,
  // которые просто так называются (русская песня «Дрейк» совпадает с запросом буквально).
  const artistBoost = (t: Track) => (likelyArtist && bestMatch(t.artist, [likelyArtist]) >= 0.85 ? 0.5 : 0);
  const score = (t: Track) =>
    artistBoost(t) +
    Math.max(bestMatch(t.artist, variants), bestMatch(t.title, variants), bestMatch(`${t.artist} ${t.title}`, variants));
  return all
    .map((t, i) => ({ t, i, s: score(t) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, MAX_RESULTS)
    .map((x) => x.t);
}

export async function searchEverywhere(query: string) {
  const variants = queryVariants(query);
  // YouTube Music сам понимает кириллицу, ему варианты не нужны. Если он не ответил —
  // падаем обратно на Deezer (превью / полная версия через тот же YouTube позже).
  const [indie, hitsYT, charts, artists] = await Promise.all([
    Promise.all(variants.map((v) => audiusSearch(v, PER_VARIANT))),
    hasYouTube() ? ytmSearch(query, MAX_RESULTS) : Promise.resolve([]),
    Promise.all(variants.map((v) => deezerSearch(v, PER_VARIANT))),
    variants.length > 1 ? Promise.all(variants.slice(1).map((v) => deezerArtistSearch(v, 4))) : Promise.resolve([]),
  ]);

  // «Похоже, вы ищете»: исполнители, чьё имя похоже на латинский вариант запроса.
  const seen = new Set<string>();
  const suggestions = artists
    .flat()
    .filter((a) => !seen.has(a.name.toLowerCase()) && seen.add(a.name.toLowerCase()))
    .map((a) => ({ ...a, score: bestMatch(a.name, variants.slice(1)) }))
    .filter((a) => a.score >= 0.45)
    .sort((a, b) => b.score - a.score || b.fans - a.fans)
    .slice(0, 4);

  // Не угадываем, если исполнитель с ровно таким русским именем уже есть («кино» → группа «Кино»).
  const exactCyrillicArtist = [...indie.flat(), ...charts.flat()].some((t) => bestMatch(t.artist, [variants[0]]) >= 0.95);
  const likelyArtist = !exactCyrillicArtist && suggestions[0]?.score >= 0.75 ? suggestions[0].name : undefined;
  return {
    indie: merge(indie, variants, likelyArtist),
    hits: hitsYT.length ? hitsYT : merge(charts, variants, likelyArtist),
    variants,
    suggestions,
  };
}

export async function getTrack(id: string): Promise<Track | null> {
  const parts = splitTrackId(id);
  if (!parts) return null;
  if (parts.source === "audius") return audiusTrack(parts.sourceId);
  if (parts.source === "youtube") return ytmTrack(parts.sourceId);
  return deezerTrack(parts.sourceId);
}

export function moodTracks(mood: Mood) {
  return audiusTrending({ genre: mood.genre, limit: 30 });
}
