/*
  Поиск «как слышится»: пользователь пишет исполнителя русскими буквами
  («ту холис», «билли айлиш»), а каталоги знают его латиницей («2hollis», «Billie Eilish»).
  Строим несколько вариантов запроса; поисковики Deezer/Audius сами нечёткие и добивают остальное.
*/

const HAS_CYRILLIC = /[а-яё]/i;

// Сочетания идут раньше одиночных букв: «дж» → j, а не d + zh.
const COMBOS: [RegExp, string][] = [
  [/дж/g, "j"],
  [/кс/g, "x"],
  [/айл/g, "eil"], // айлиш → eilish
  [/ай/g, "ai"],
  [/ейк/g, "ake"], // дрейк → drake
  [/ей/g, "ey"],
  [/ий/g, "y"],
  [/ый/g, "y"],
  [/ой/g, "oy"],
  [/уи/g, "wee"], // уикенд → weekend
];

const LETTERS: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

// Цифры в никах читаются по-английски: «ту холис» = 2hollis, «фор тет» = 4tet.
const NUMBER_WORDS: Record<string, string> = {
  ван: "1", ту: "2", тю: "2", фри: "3", сри: "3", фор: "4", файв: "5",
  сикс: "6", севен: "7", эйт: "8", найн: "9", тен: "10",
};

export function transliterate(text: string) {
  let s = text.toLowerCase();
  for (const [re, to] of COMBOS) s = s.replace(re, to);
  return [...s].map((ch) => LETTERS[ch] ?? ch).join("");
}

function withNumbers(text: string) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => NUMBER_WORDS[w] ?? w)
    .join(" ");
}

const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

function bigrams(s: string) {
  const out = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i++) {
    const bg = s.slice(i, i + 2);
    out.set(bg, (out.get(bg) ?? 0) + 1);
  }
  return out;
}

/** Похожесть строк 0..1 (коэффициент Дайса по парам букв), без учёта регистра, пробелов и знаков. */
export function similarity(a: string, b: string) {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.length > 3 && y.includes(x)) return 0.95;
  const bx = bigrams(x);
  const by = bigrams(y);
  let overlap = 0;
  for (const [bg, n] of bx) overlap += Math.min(n, by.get(bg) ?? 0);
  return (2 * overlap) / (x.length - 1 + (y.length - 1)) || 0;
}

/** Насколько строка похожа хоть на один вариант запроса. */
export function bestMatch(text: string, variants: string[]) {
  return Math.max(...variants.map((v) => similarity(v, text)));
}

/** Варианты запроса: исходный → латиница → с цифрами → цифры слитно со словом. Без дублей. */
export function queryVariants(query: string): string[] {
  const q = query.trim();
  if (!HAS_CYRILLIC.test(q)) return [q];

  const latin = transliterate(q);
  const numbered = transliterate(withNumbers(q));
  const glued = numbered.replace(/(\d)\s+(?=\S)/g, "$1");
  return [...new Set([q, latin, numbered, glued])].filter(Boolean);
}
