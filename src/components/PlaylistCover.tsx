"use client";

import { useRef, useState } from "react";
import { fileToCover } from "@/lib/image";
import type { Playlist } from "@/lib/types";
import { Artwork } from "./TrackList";

/** Обложка плейлиста: своя картинка → коллаж из 4 обложек треков → фирменный горошек. */
export function PlaylistCover({ playlist, className = "" }: { playlist: Pick<Playlist, "cover" | "tracks">; className?: string }) {
  if (playlist.cover) {
    return <img src={playlist.cover} alt="" className={`object-cover ${className}`} />;
  }
  if (playlist.tracks.length >= 4) {
    return (
      <div className={`grid grid-cols-2 overflow-hidden ${className}`}>
        {playlist.tracks.slice(0, 4).map((t) => (
          <Artwork key={t.id} src={t.artwork} alt="" className="size-full" />
        ))}
      </div>
    );
  }
  if (playlist.tracks[0]) return <Artwork src={playlist.tracks[0].artwork} alt="" className={className} />;
  return <div className={`polka ${className}`} />;
}

/**
 * Кнопка «выбрать картинку»: открывает выбор файла, ужимает картинку и отдаёт data URL.
 * Внешний вид задаёт `children`, чтобы её можно было повесить хоть на всю обложку.
 */
export function CoverPicker({
  onPick,
  children,
  className = "",
  label = "Выбрать обложку",
}: {
  onPick: (cover: string) => void;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button type="button" aria-label={label} onClick={() => input.current?.click()} className={className}>
        {children}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            setError(null);
            onPick(await fileToCover(file));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Не получилось открыть картинку");
          }
        }}
      />
      {error && (
        <span role="alert" className="text-xs font-bold text-rose">
          {error}
        </span>
      )}
    </>
  );
}
