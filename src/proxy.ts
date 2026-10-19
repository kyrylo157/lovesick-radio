import { NextResponse, type NextRequest } from "next/server";

/*
  Ограничение частоты запросов с одного IP. Без него любой скрипт может заспамить поиск
  и подбор полных версий — YouTube заблокирует сервера, и у всех хиты станут по 30 сек.
  Счётчики живут в памяти экземпляра сервера: на Vercel экземпляров несколько, так что
  лимит приблизительный, но от тупого спама защищает.
*/

const WINDOW_MS = 60_000;

// Сколько запросов в минуту можно на одного человека. Обычное прослушивание — единицы.
const LIMITS: { test: (req: NextRequest) => boolean; bucket: string; max: number }[] = [
  { bucket: "full", max: 40, test: (r) => r.nextUrl.pathname.startsWith("/api/full/") },
  { bucket: "preview", max: 80, test: (r) => r.nextUrl.pathname.startsWith("/api/preview/") },
  { bucket: "search", max: 40, test: (r) => r.nextUrl.pathname === "/search" && r.nextUrl.searchParams.has("q") },
  { bucket: "health", max: 6, test: (r) => r.nextUrl.pathname === "/api/health" },
];

const hits = new Map<string, number[]>();

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function tooMany(key: string, max: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  // Чистим старые ключи, чтобы карта не росла бесконечно
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now - v[v.length - 1] > WINDOW_MS) hits.delete(k);
  }
  return recent.length > max;
}

/*
  Формат id трека: audius — буквы/цифры, deezer — цифры, youtube — 11 символов id видео.
  Кривые id сразу получают настоящий 404 (страница трека стримится, и сама вернуть 404 не успевает).
*/
const TRACK_ID = /^(audius-[A-Za-z0-9]{1,20}|deezer-\d{1,15}|youtube-[A-Za-z0-9_-]{11})$/;

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/track/")) {
    let id = "";
    try {
      id = decodeURIComponent(pathname.slice("/track/".length));
    } catch {
      // битая %-последовательность — тоже 404
    }
    if (!TRACK_ID.test(id)) return NextResponse.rewrite(new URL("/_not-found", req.url), { status: 404 });
    return NextResponse.next();
  }

  const rule = LIMITS.find((l) => l.test(req));
  if (!rule) return NextResponse.next();
  if (!tooMany(`${rule.bucket}:${clientIp(req)}`, rule.max)) return NextResponse.next();

  const retry = { "Retry-After": "60" };
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "too many requests" }, { status: 429, headers: retry });
  }
  return new NextResponse("Слишком много запросов — подожди минуту и попробуй снова.", {
    status: 429,
    headers: { ...retry, "Content-Type": "text/plain; charset=utf-8" },
  });
}

export const config = {
  matcher: ["/api/full/:path*", "/api/preview/:path*", "/api/health", "/search", "/track/:path*"],
};
