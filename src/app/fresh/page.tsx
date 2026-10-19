import type { Metadata } from "next";
import { Empty } from "@/components/Section";
import { TrackList } from "@/components/TrackList";
import { PlayAllButton } from "@/components/TrackShelf";
import { audiusTrending } from "@/lib/audius";

export const metadata: Metadata = { title: "Свежее из склепа" };

// Полный список для ссылки «Все треки» под лентой «Свежее из склепа» на главной.
export default async function FreshPage() {
  const tracks = await audiusTrending({ limit: 50 });
  return (
    <>
      <header className="polka lace-bottom sticker relative rounded-[var(--radius-blob)] px-6 py-8 text-bone sm:px-10">
        <p className="font-bold [text-shadow:2px_2px_0_var(--ink)]">Тренды недели на Audius · играют целиком</p>
        <h1 className="mt-1 font-display text-5xl [text-shadow:4px_4px_0_var(--ink)] sm:text-6xl">Свежее из склепа</h1>
        <div className="mt-5">
          <PlayAllButton tracks={tracks} />
        </div>
      </header>
      <div className="mt-12">
        <TrackList tracks={tracks} empty={<Empty>Audius сейчас не отвечает. Обнови страницу через минуту.</Empty>} />
      </div>
    </>
  );
}
