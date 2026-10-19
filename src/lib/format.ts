export function fmtTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Детерминированный «волновой» рисунок из id трека: у источников нет данных о форме волны. */
export function pseudoWave(seed: string, bars: number) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const r = ((h ^= h >>> 16) >>> 0) / 4294967295;
    // огибающая: тише в начале и конце, громче в середине
    const env = 0.45 + 0.55 * Math.sin((Math.PI * (i + 0.5)) / bars);
    out.push(Math.max(0.12, Math.min(1, env * (0.35 + 0.65 * r))));
  }
  return out;
}
