import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListSkeleton, Section } from "@/components/Section";
import { TrackHero } from "@/components/TrackHero";
import { TrackList } from "@/components/TrackList";
import { audiusTrending } from "@/lib/audius";
import { deezerSearch } from "@/lib/deezer";
import { getTrack } from "@/lib/music";
import { ytmSearch } from "@/lib/ytmusic";

export async function generateMetadata({ params }: PageProps<"/track/[id]">): Promise<Metadata> {
  const track = await getTrack(decodeURIComponent((await params).id));
  return { title: track ? `${track.title} — ${track.artist}` : "Трек" };
}

export default function TrackPage({ params }: PageProps<"/track/[id]">) {
  return (
    <Suspense fallback={<ListSkeleton rows={4} />}>
      <TrackContent params={params} />
    </Suspense>
  );
}

async function TrackContent({ params }: Pick<PageProps<"/track/[id]">, "params">) {
  const track = await getTrack(decodeURIComponent((await params).id));
  if (!track) notFound();

  // «Похожее»: для Audius — тренды того же жанра, для остальных — другие треки артиста.
  const more = (
    track.source === "audius"
      ? await audiusTrending({ genre: track.genre, limit: 11 })
      : track.source === "youtube"
        ? await ytmSearch(track.artist, 11)
        : await deezerSearch(`artist:"${track.artist}"`, 11)
  )
    .filter((t) => t.id !== track.id)
    .slice(0, 10);

  return (
    <>
      <TrackHero track={track} />
      {more.length > 0 && (
        <Section title={track.source === "audius" ? "Ещё в этом жанре" : `Ещё от ${track.artist}`}>
          <TrackList tracks={more} />
        </Section>
      )}
    </>
  );
}
