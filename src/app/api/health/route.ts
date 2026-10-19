import { connection } from "next/server";
import { ytmPing } from "@/lib/ytmusic";

/*
  Проверка живости источников музыки. Её раз в 6 часов дёргает GitHub Actions
  (.github/workflows/health.yml): если что-то отвалилось — ответ 503, workflow падает,
  и GitHub присылает письмо. Особенно важно для YouTube Music: API неофициальный.
*/

async function check(name: string, fn: () => Promise<number>) {
  const t0 = Date.now();
  try {
    const count = await fn();
    return { name, ok: count > 0, count, ms: Date.now() - t0 };
  } catch (e) {
    return { name, ok: false, count: 0, ms: Date.now() - t0, error: e instanceof Error ? e.message : String(e) };
  }
}

async function json<T>(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export async function GET() {
  await connection(); // всегда на живую, без кэша
  const results = await Promise.all([
    check("audius", async () =>
      (await json<{ data: unknown[] }>("https://api.audius.co/v1/tracks/trending?limit=3&app_name=lovesick-radio")).data.length,
    ),
    check("deezer", async () => (await json<{ data: unknown[] }>("https://api.deezer.com/chart/0/tracks?limit=3")).data.length),
    check("youtube-music", ytmPing),
  ]);
  const ok = results.every((r) => r.ok);
  return Response.json({ ok, checkedAt: new Date().toISOString(), results }, { status: ok ? 200 : 503 });
}
