import Link from "next/link";
import { DancingZombie } from "@/components/DancingZombie";
import { SkullHeart } from "@/components/Mascots";
import { SearchBox } from "@/components/Nav";
import { Empty, Section } from "@/components/Section";
import { TrackList } from "@/components/TrackList";
import { PlayAllButton, TrackShelf } from "@/components/TrackShelf";
import { audiusTrending } from "@/lib/audius";
import { deezerChart } from "@/lib/deezer";
import { MOODS } from "@/lib/moods";
import { hasYouTube } from "@/lib/youtube";

// Цвет «глубокой» плитки; светлые и тёмные грани .deep считает из него сам.
const MOOD_TINTS = ["#c2185b", "#567a2c", "#3a1830", "#b3122e", "#8e0f43", "#5b2a8a"];

export default async function Home() {
  const [fresh, charts] = await Promise.all([audiusTrending({ limit: 16 }), deezerChart(10)]);

  return (
    <>
      <SearchBox className="mb-6 max-w-md md:hidden" />

      {/* Герой: малиновый горошек в кружевной рамке, как на референсе */}
      <section className="polka lace-sides lace-bottom sticker relative grid overflow-visible rounded-[var(--radius-blob)] px-10 pb-10 pt-8 sm:px-14 md:grid-cols-[1.3fr_1fr] md:items-center">
        <div className="relative z-10 min-w-0 text-bone">
          <h1 className="font-display text-[2.4rem] leading-[0.95] [overflow-wrap:anywhere] [text-shadow:4px_4px_0_var(--ink)] sm:text-6xl lg:text-7xl">
            Музыка для влюблённых и немёртвых
          </h1>
          <p className="mt-4 max-w-md text-lg font-bold [text-shadow:2px_2px_0_var(--ink)]">
            {hasYouTube()
              ? "Инди и мировые хиты — целиком. Включай и пусть зомбик потанцует."
              : "Инди-треки целиком, чарты — превью. Включай и пусть зомбик потанцует."}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PlayAllButton tracks={fresh} label="Включить радио" />
            <Link
              href="/search"
              className="rounded-full border-3 border-ink bg-bone px-5 py-2 font-extrabold text-ink transition-transform hover:-translate-y-0.5"
            >
              Найти трек
            </Link>
          </div>
        </div>
        <div className="relative mx-auto mt-8 w-48 sm:w-60 md:mt-0 md:w-72">
          <div className="sticker absolute -left-8 -top-2 z-10 grid size-16 place-items-center rounded-full rounded-br-none bg-blush text-ink sm:-left-12">
            <SkullHeart className="size-11 [--skull-face:var(--blush)]" />
          </div>
          <DancingZombie className="aspect-[200/230] w-full" />
        </div>
      </section>

      <Section title="Свежее из склепа" note="Тренды недели на Audius — играют целиком" href="/mood/graveyard-lofi">
        {fresh.length ? (
          <TrackShelf tracks={fresh} />
        ) : (
          <Empty>Audius сейчас не отвечает. Обнови страницу через минуту.</Empty>
        )}
      </Section>

      <Section title="Настроения">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 pb-2 sm:grid-cols-3">
          {MOODS.map((m, i) => (
            <li key={m.slug}>
              <Link
                href={`/mood/${m.slug}`}
                style={{ "--tint": MOOD_TINTS[i % MOOD_TINTS.length] } as React.CSSProperties}
                className="deep block h-full rounded-[var(--radius-card)] p-4 text-bone [text-shadow:2px_2px_0_rgba(0,0,0,0.35)]"
              >
                <span className="block text-lg font-black leading-tight">{m.name}</span>
                <span className="mt-1 block text-sm font-bold opacity-80">{m.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Топ чартов"
        note={
          hasYouTube()
            ? "Мировой чарт Deezer — играет целиком через YouTube"
            : "Мировой чарт Deezer — 30 секунд, полная версия по ссылке в меню трека"
        }
      >
        {charts.length ? <TrackList tracks={charts} /> : <Empty>Deezer сейчас не отвечает. Обнови страницу через минуту.</Empty>}
      </Section>
    </>
  );
}
