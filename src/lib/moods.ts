/** Жанры Audius, переименованные под настроение сайта. `genre` — точное имя в API. */
export const MOODS = [
  { slug: "graveyard-lofi", genre: "Lo-Fi", name: "Лоуфай на кладбище", blurb: "Тихо, как в склепе в 3 ночи" },
  { slug: "bat-rave", genre: "Electronic", name: "Рейв летучих мышей", blurb: "Крылья вверх" },
  { slug: "broken-hearts", genre: "Alternative", name: "Разбитые сердечки", blurb: "Для тех, кого бросили на Хэллоуин" },
  { slug: "zombie-rap", genre: "Hip-Hop/Rap", name: "Зомби-рэп", blurb: "Мозги и биты" },
  { slug: "pink-coffin-pop", genre: "Pop", name: "Розовый гробик", blurb: "Поп, но с клыками" },
  { slug: "slow-dance-crypt", genre: "R&B/Soul", name: "Медляк в склепе", blurb: "Пригласи призрака на танец" },
] as const;

export type Mood = (typeof MOODS)[number];

export function getMood(slug: string) {
  return MOODS.find((m) => m.slug === slug) ?? null;
}
