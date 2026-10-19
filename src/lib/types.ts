export type Source = "audius" | "deezer" | "youtube";
const SOURCES: Source[] = ["audius", "deezer", "youtube"];

export interface Track {
  /** Глобальный id вида `audius-J72oWO6` / `deezer-3602329332` / `youtube-jOLT6ukrQSg` — годится для URL. */
  id: string;
  source: Source;
  sourceId: string;
  title: string;
  artist: string;
  artwork: string | null;
  /** Длительность того, что реально проиграется (у Deezer — 30 сек превью). */
  duration: number;
  /** false — у источника только превью; полная версия — через YouTube (если включено) или по ссылке. */
  full: boolean;
  /** Длительность полной версии, если она отличается от того, что даёт источник (Deezer). */
  fullDuration?: number;
  /** Страница трека у источника. */
  link: string;
  genre?: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
  /** Своя обложка (data URL 400×400). Нет — показываем коллаж из обложек треков. */
  cover?: string;
}

export const SOURCE_NAME: Record<Source, string> = {
  audius: "Audius",
  deezer: "Deezer",
  youtube: "YouTube Music",
};

export function splitTrackId(id: string): { source: Source; sourceId: string } | null {
  const dash = id.indexOf("-");
  if (dash < 0) return null;
  // Делим по первому дефису: в id видео YouTube тоже бывают дефисы.
  const source = id.slice(0, dash) as Source;
  const sourceId = id.slice(dash + 1);
  if (!SOURCES.includes(source) || !sourceId) return null;
  return { source, sourceId };
}
