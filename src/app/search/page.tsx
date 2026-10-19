import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchBox } from "@/components/Nav";
import { Empty, ListSkeleton, Section } from "@/components/Section";
import { TrackList } from "@/components/TrackList";
import { MOODS } from "@/lib/moods";
import { searchEverywhere } from "@/lib/music";
import { hasYouTube } from "@/lib/youtube";

export const metadata: Metadata = { title: "Поиск" };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <>
      <h1 className="font-display text-5xl text-accent [text-shadow:3px_3px_0_var(--outline)]">Поиск</h1>
      <SearchBox className="mt-4 max-w-xl" />
      <Suspense fallback={<ListSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  if (!q) {
    return (
      <Section title="Или выбери настроение">
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <Link
              key={m.slug}
              href={`/mood/${m.slug}`}
              className="rounded-full border-3 border-outline bg-surface px-4 py-1.5 font-extrabold hover:bg-surface-2"
            >
              {m.name}
            </Link>
          ))}
        </div>
      </Section>
    );
  }

  const { indie, hits, suggestions } = await searchEverywhere(q);
  const hitsFromYouTube = hits[0]?.source === "youtube";
  return (
    <>
      {suggestions.length > 0 && (
        <section className="mt-6" aria-label="Похожие исполнители">
          <p className="text-sm font-bold text-muted">Похоже, ты ищешь</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((a) => (
              <Link
                key={a.name}
                href={`/search?q=${encodeURIComponent(a.name)}`}
                className="glass flex items-center gap-2 rounded-full py-1 pl-1 pr-4 font-extrabold hover:text-accent"
              >
                {a.picture ? (
                  <img src={a.picture} alt="" className="size-8 rounded-full border-2 border-outline object-cover" />
                ) : (
                  <span className="polka size-8 rounded-full border-2 border-outline" />
                )}
                {a.name}
              </Link>
            ))}
          </div>
        </section>
      )}
      <Section
        title={hasYouTube() ? "Песни" : "Из чартов — превью"}
        note={hitsFromYouTube ? `YouTube Music по запросу «${q}» — целиком` : `Deezer по запросу «${q}»`}
      >
        <TrackList tracks={hits} empty={<Empty>Ничего не нашлось. Попробуй написать по-другому.</Empty>} />
      </Section>
      <Section title="Инди" note={`Audius по запросу «${q}» — целиком`}>
        <TrackList tracks={indie} empty={<Empty>На Audius по этому запросу пусто.</Empty>} />
      </Section>
    </>
  );
}
