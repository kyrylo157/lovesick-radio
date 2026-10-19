"use client";

import Link from "next/link";
import type { Track } from "@/lib/types";
import { currentTrack, usePlayer } from "@/store/player";
import { PauseIcon, PlayIcon } from "./Icons";
import { Artwork, PreviewBadge } from "./TrackList";

/** Горизонтальная лента карточек-наклеек. */
export function TrackShelf({ tracks }: { tracks: Track[] }) {
  const current = usePlayer(currentTrack);
  const playing = usePlayer((s) => s.playing);
  const { playList, toggle } = usePlayer.getState();

  return (
    // Лента прокручивается по горизонтали, а значит обрезает всё, что вылезает за её края:
    // запас сверху/снизу/по бокам нужен, чтобы приподнятая карточка и её тень не срезались.
    <div className="shelf -mx-2 flex gap-4 overflow-x-auto px-2 pb-4 pt-3">
      {tracks.map((t, i) => {
        const isCurrent = current?.id === t.id;
        return (
          <article key={t.id} className="group w-40 shrink-0 sm:w-44">
            <div className="relative transition-transform duration-200 group-hover:-translate-y-1.5">
              <Artwork
                src={t.artwork}
                alt={`Обложка: ${t.title}`}
                className="sticker aspect-square w-full rounded-[var(--radius-card)] transition-shadow duration-200 group-hover:shadow-[6px_8px_0_var(--outline)]"
              />
              <button
                type="button"
                onClick={() => (isCurrent ? toggle() : playList(tracks, i))}
                aria-label={isCurrent && playing ? `Пауза: ${t.title}` : `Играть: ${t.title}`}
                className={`sticker absolute bottom-2 right-2 grid size-11 place-items-center rounded-full bg-accent text-ink transition-all hover:scale-105 ${
                  isCurrent ? "opacity-100" : "opacity-100 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                }`}
              >
                {isCurrent && playing ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5" />}
              </button>
            </div>
            <Link href={`/track/${t.id}`} className="mt-3 block truncate font-extrabold hover:underline">
              {t.title}
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="truncate">{t.artist}</span>
              {!t.full && <PreviewBadge />}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function PlayAllButton({ tracks, label = "Слушать всё" }: { tracks: Track[]; label?: string }) {
  return (
    <button
      type="button"
      disabled={!tracks.length}
      onClick={() => usePlayer.getState().playList(tracks, 0)}
      className="sticker inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-extrabold text-ink transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-50"
    >
      <PlayIcon className="size-5" /> {label}
    </button>
  );
}
