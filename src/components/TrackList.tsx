"use client";

import Link from "next/link";
import { useState } from "react";
import { fmtTime } from "@/lib/format";
import { useFullTracks } from "@/lib/fullMode";
import type { Track } from "@/lib/types";
import { currentTrack, usePlayer } from "@/store/player";
import { BatEqualizer } from "./BatEqualizer";
import { PauseIcon, PlayIcon } from "./Icons";
import { LikeButton } from "./LikeButton";
import { TrackMenu } from "./TrackMenu";

/** Значок «30 сек». Если полные версии включены — прячется; `force` — показать всё равно (играет превью). */
export function PreviewBadge({ force = false }: { force?: boolean }) {
  const full = useFullTracks();
  if (full && !force) return null;
  return (
    <span
      title="Deezer даёт только 30 секунд — полная версия по ссылке в меню трека"
      className="shrink-0 rounded-full border-2 border-current px-1.5 text-[10px] font-extrabold leading-4 text-muted"
    >
      30 сек
    </span>
  );
}

export function Artwork({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  // Узлы Audius иногда лежат (503) — тогда вместо пустого квадрата фирменный горошек.
  const [failed, setFailed] = useState<string | null>(null);
  return src && failed !== src ? (
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(src)} className={`object-cover ${className}`} />
  ) : (
    <div className={`polka ${className}`} role="img" aria-label={alt} />
  );
}

export function TrackList({
  tracks,
  playlistId,
  empty,
}: {
  tracks: Track[];
  playlistId?: string;
  empty?: React.ReactNode;
}) {
  const current = usePlayer(currentTrack);
  const playing = usePlayer((s) => s.playing);
  const full = useFullTracks();
  const { playList, toggle } = usePlayer.getState();

  if (!tracks.length) return <>{empty}</>;

  return (
    <ol className="flex flex-col gap-1">
      {tracks.map((t, i) => {
        const isCurrent = current?.id === t.id;
        const onPlay = () => (isCurrent ? toggle() : playList(tracks, i));
        return (
          <li
            key={t.id}
            onDoubleClick={onPlay}
            className={`group grid grid-cols-[2rem_3rem_1fr_auto] items-center gap-3 rounded-2xl border px-2 py-1.5 transition-colors sm:grid-cols-[2rem_3rem_1fr_auto_auto] ${
              isCurrent
                ? "glass border-accent/40"
                : "border-transparent hover:border-fg/10 hover:bg-surface/40 hover:backdrop-blur-md"
            }`}
          >
            <button
              type="button"
              onClick={onPlay}
              aria-label={isCurrent && playing ? `Пауза: ${t.title}` : `Играть: ${t.title}`}
              className="grid size-8 place-items-center rounded-full text-sm font-extrabold text-muted hover:text-fg"
            >
              {isCurrent && playing ? (
                <>
                  <BatEqualizer compact className="group-hover:hidden" />
                  <PauseIcon className="hidden size-4 group-hover:block" />
                </>
              ) : (
                <>
                  <span className="group-hover:hidden">{i + 1}</span>
                  <PlayIcon className="hidden size-4 group-hover:block" />
                </>
              )}
            </button>
            <Artwork src={t.artwork} alt="" className="size-12 rounded-xl border-2 border-outline" />
            <div className="min-w-0">
              <Link
                href={`/track/${t.id}`}
                className={`block truncate font-extrabold hover:underline ${isCurrent ? "text-accent" : ""}`}
              >
                {t.title}
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted">
                <span className="truncate">{t.artist}</span>
                {!t.full && <PreviewBadge />}
              </div>
            </div>
            <span className="hidden text-sm tabular-nums text-muted sm:block">
              {fmtTime(full ? (t.fullDuration ?? t.duration) : t.duration)}
            </span>
            <div className="flex items-center">
              <LikeButton track={t} />
              <TrackMenu track={t} playlistId={playlistId} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
