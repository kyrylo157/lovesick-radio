// Отдельно от Backdrop.tsx: список нужен и серверному layout (скрипт до отрисовки), и клиенту.
export const BACKDROPS = [
  { id: "fog", name: "Туман", hint: "Свечение плывёт" },
  { id: "lace", name: "Кружево", hint: "Обои в склепе" },
  { id: "velvet", name: "Бархат", hint: "Театральная занавеска" },
  { id: "moon", name: "Луна", hint: "Ночь на кладбище" },
  { id: "plain", name: "Обычный", hint: "Ровный цвет, как было сначала" },
] as const;

export const BACKDROP_IDS = BACKDROPS.map((b) => b.id);
export const DEFAULT_BG = "fog";
