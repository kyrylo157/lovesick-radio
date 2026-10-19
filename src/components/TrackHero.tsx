"use client";

import { useMemo } from "react";
import { fmtTime, pseudoWave } from "@/lib/format";
import { useFullTracks } from "@/lib/fullMode";
import { SOURCE_NAME, type Track } from "@/lib/types";
import { currentTrack, usePlayer } from "@/store/player";
import { ExternalIcon, PauseIcon, PlayIcon } from "./Icons";
import { LikeButton } from "./LikeButton";
import { Artwork, PreviewBadge } from "./TrackList";
import { TrackMenu } from "./TrackMenu";

const BARS = 72;

/** Шапка трека + «волна» для перемотки (рисунок условный: формы волны источники не отдают). */
export function TrackHero({ track }: { track: Track }) {
  const isCurrent = usePlayer((s) => currentTrack(s)?.id === track.id);
  const playing = usePlayer((s) => s.playing);
  const position = usePlayer((s) => (isCurrent ? s.position : 0));
  const full = useFullTracks();
  const listed = full ? (track.fullDuration ?? track.duration) : track.duration;
  const duration = usePlayer((s) => (isCurrent && s.duration ? s.duration : listed));
  const wave = useMemo(() => pseudoWave(track.id, BARS), [track.id]);
  const { playTrack, toggle, seek } = usePlayer.getState();
  const progress = duration ? position / duration : 0;

  const onWave = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (isCurrent) seek(ratio * duration);
    else playTrack(track);
  };

  return (
    <section className="grid gap-8 md:grid-cols-[minmax(220px,320px)_1fr] md:items-end">
      <Artwork
        src={track.artwork}
        alt={`Обложка: ${track.title}`}
        className="sticker aspect-square w-full max-w-xs -rotate-2 rounded-[var(--radius-blob)]"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-bold text-muted">
          <span>
            {track.full
              ? `${SOURCE_NAME[track.source]} — трек целиком`
              : full
                ? "Deezer — целиком через YouTube"
                : "Deezer — превью"}
          </span>
          {!track.full && <PreviewBadge />}
          {track.genre && <span>· {track.genre}</span>}
        </div>
        <h1 className="mt-2 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{track.title}</h1>
        <p className="mt-1 text-xl font-bold text-accent">{track.artist}</p>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (isCurrent ? toggle() : playTrack(track))}
            aria-label={isCurrent && playing ? "Пауза" : "Играть"}
            className="sticker grid size-16 place-items-center rounded-full bg-accent text-ink transition-transform hover:scale-105 active:scale-95"
          >
            {isCurrent && playing ? <PauseIcon className="size-8" /> : <PlayIcon className="size-8" />}
          </button>
          <LikeButton track={track} className="size-11 [&_svg]:size-7" />
          <TrackMenu track={track} />
          <a
            href={track.link}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-extrabold text-muted hover:text-fg"
          >
            {track.full || full ? `В ${SOURCE_NAME[track.source]}` : "Полная версия на Deezer"} <ExternalIcon className="size-4" />
          </a>
        </div>

        <div className="mt-6">
          <div
            role="slider"
            tabIndex={0}
            aria-label="Перемотка"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(position)}
            aria-valuetext={`${fmtTime(position)} из ${fmtTime(duration)}`}
            onClick={onWave}
            onKeyDown={(e) => {
              if (!isCurrent) return;
              if (e.key === "ArrowRight") seek(position + 5);
              if (e.key === "ArrowLeft") seek(position - 5);
            }}
            className="flex h-20 cursor-pointer items-center gap-[3px]"
          >
            {wave.map((h, i) => (
              <span
                key={i}
                className={`flex-1 rounded-full transition-colors ${i / BARS < progress ? "bg-accent" : "bg-surface-2"}`}
                style={{ height: `${h * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs tabular-nums text-muted">
            <span>{fmtTime(position)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
