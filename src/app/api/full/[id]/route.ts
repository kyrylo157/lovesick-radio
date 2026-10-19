import { deezerTrack } from "@/lib/deezer";
import { hasYouTube } from "@/lib/youtube";
import { ytmFindSong } from "@/lib/ytmusic";

// Deezer-трек → id полной версии в YouTube Music. 501 — YouTube выключен, плеер играет превью.
export async function GET(_req: Request, ctx: RouteContext<"/api/full/[id]">) {
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return Response.json({ error: "bad id" }, { status: 400 });
  if (!hasYouTube()) return Response.json({ error: "youtube off" }, { status: 501 });

  const track = await deezerTrack(id);
  if (!track) return Response.json({ error: "no track" }, { status: 404 });
  try {
    const videoId = await ytmFindSong(track.artist, track.title);
    if (!videoId) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ videoId });
  } catch {
    return Response.json({ error: "youtube unavailable" }, { status: 503 });
  }
}
