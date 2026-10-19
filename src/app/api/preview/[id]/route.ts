import { deezerPreviewUrl } from "@/lib/deezer";

export async function GET(_req: Request, ctx: RouteContext<"/api/preview/[id]">) {
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return Response.json({ error: "bad id" }, { status: 400 });
  const url = await deezerPreviewUrl(id);
  if (!url) return Response.json({ error: "no preview" }, { status: 404 });
  return Response.json({ url }, { headers: { "Cache-Control": "no-store" } });
}
