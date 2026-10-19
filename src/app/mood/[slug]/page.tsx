import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Empty } from "@/components/Section";
import { TrackList } from "@/components/TrackList";
import { PlayAllButton } from "@/components/TrackShelf";
import { getMood, MOODS } from "@/lib/moods";
import { moodTracks } from "@/lib/music";

export function generateStaticParams() {
  return MOODS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/mood/[slug]">): Promise<Metadata> {
  const mood = getMood((await params).slug);
  return { title: mood?.name ?? "Настроение" };
}

export default async function MoodPage({ params }: PageProps<"/mood/[slug]">) {
  const mood = getMood((await params).slug);
  if (!mood) notFound();
  const tracks = await moodTracks(mood);

  return (
    <>
      <header className="polka lace-bottom sticker relative rounded-[var(--radius-blob)] px-6 py-8 text-bone sm:px-10">
        <p className="font-bold [text-shadow:2px_2px_0_var(--ink)]">Настроение · {mood.genre}</p>
        <h1 className="mt-1 font-display text-5xl [text-shadow:4px_4px_0_var(--ink)] sm:text-6xl">{mood.name}</h1>
        <p className="mt-2 text-lg font-bold [text-shadow:2px_2px_0_var(--ink)]">{mood.blurb}</p>
        <div className="mt-5">
          <PlayAllButton tracks={tracks} />
        </div>
      </header>
      <div className="mt-12">
        <TrackList tracks={tracks} empty={<Empty>Здесь пока тихо. Загляни позже.</Empty>} />
      </div>
    </>
  );
}
