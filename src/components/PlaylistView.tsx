"use client";

import { useRouter } from "next/navigation";
import { use, useSyncExternalStore } from "react";
import { useLibrary } from "@/store/library";
import { TrashIcon } from "./Icons";
import { CoverPicker, PlaylistCover } from "./PlaylistCover";
import { Empty } from "./Section";
import { TrackList } from "./TrackList";
import { PlayAllButton } from "./TrackShelf";

export function PlaylistView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const playlist = useLibrary((s) => s.playlists.find((p) => p.id === id));
  const { renamePlaylist, deletePlaylist, setCover } = useLibrary.getState();
  // На сервере у persist нет API (там нет localStorage) — считаем, что библиотека ещё не загружена.
  const hydrated = useSyncExternalStore(
    (cb) => useLibrary.persist?.onFinishHydration(cb) ?? (() => {}),
    () => useLibrary.persist?.hasHydrated() ?? false,
    () => false,
  );

  if (!playlist) {
    return hydrated ? (
      <Empty>Такого плейлиста нет — возможно, он остался в другом браузере.</Empty>
    ) : null;
  }

  return (
    <>
      <title>{`${playlist.name} · Lovesick Radio`}</title>
      <header className="polka lace-bottom sticker relative grid gap-6 rounded-[var(--radius-blob)] px-6 py-8 text-bone sm:grid-cols-[auto_1fr] sm:items-end sm:px-10">
        {/* Обложка: клик — заменить картинку */}
        <div className="flex flex-col items-start gap-2">
          <CoverPicker
            onPick={(c) => setCover(playlist.id, c)}
            label={playlist.cover ? "Сменить обложку" : "Добавить обложку"}
            className="group relative block size-40 -rotate-2 overflow-hidden rounded-[var(--radius-card)] border-3 border-outline shadow-[6px_6px_0_var(--outline)] sm:size-48"
          >
            <PlaylistCover playlist={playlist} className="size-full" />
            <span className="absolute inset-0 grid place-items-center bg-ink/60 text-sm font-extrabold opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {playlist.cover ? "Сменить обложку" : "+ обложка"}
            </span>
          </CoverPicker>
          {playlist.cover && (
            <button
              type="button"
              onClick={() => setCover(playlist.id, undefined)}
              className="text-xs font-extrabold underline [text-shadow:1px_1px_0_var(--ink)]"
            >
              Убрать обложку
            </button>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold [text-shadow:2px_2px_0_var(--ink)]">Плейлист · {playlist.tracks.length} тр.</p>
          <input
            defaultValue={playlist.name}
            key={playlist.id}
            onBlur={(e) => renamePlaylist(playlist.id, e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            aria-label="Название плейлиста"
            className="mt-1 w-full bg-transparent font-display text-5xl [text-shadow:4px_4px_0_var(--ink)] focus:outline-none sm:text-6xl"
          />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <PlayAllButton tracks={playlist.tracks} />
            <button
              type="button"
              onClick={() => {
                if (confirm(`Удалить плейлист «${playlist.name}»?`)) {
                  deletePlaylist(playlist.id);
                  router.push("/library");
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border-3 border-ink bg-bone px-4 py-2 font-extrabold text-ink"
            >
              <TrashIcon className="size-4" /> Удалить плейлист
            </button>
          </div>
        </div>
      </header>
      <div className="mt-12">
        <TrackList
          tracks={playlist.tracks}
          playlistId={playlist.id}
          empty={<Empty>Пусто. Добавляй треки через «+» в любом списке.</Empty>}
        />
      </div>
    </>
  );
}
