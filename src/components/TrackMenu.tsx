"use client";

import { useEffect, useRef, useState } from "react";
import { useFullTracks } from "@/lib/fullMode";
import { SOURCE_NAME, type Track } from "@/lib/types";
import { useLibrary } from "@/store/library";
import { usePlayer } from "@/store/player";
import { ExternalIcon, PlusIcon, QueueIcon, TrashIcon } from "./Icons";

/** Меню трека: в очередь, в плейлист, открыть у источника, убрать из плейлиста. */
export function TrackMenu({ track, playlistId }: { track: Track; playlistId?: string }) {
  const [open, setOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const playlists = useLibrary((s) => s.playlists);
  const full = useFullTracks();
  const { addToPlaylist, createPlaylist, removeFromPlaylist } = useLibrary.getState();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) {
        setOpen(false);
        setNaming(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const flash = (msg: string) => {
    setDone(msg);
    setOpen(false);
    setNaming(false);
    setTimeout(() => setDone(null), 1400);
  };

  const item =
    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-surface-2";

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label="Ещё действия"
        aria-expanded={open}
        className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
      >
        <PlusIcon className="size-5" />
      </button>
      {done && (
        <span role="status" className="absolute right-9 top-1 whitespace-nowrap rounded-full bg-zombie px-2 py-0.5 text-xs font-extrabold text-ink">
          {done}
        </span>
      )}
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="sticker absolute right-0 top-9 z-40 w-60 rounded-2xl bg-surface p-1.5"
        >
          <button
            type="button"
            className={item}
            onClick={() => {
              usePlayer.getState().addToQueue(track);
              flash("В очереди");
            }}
          >
            <QueueIcon className="size-4" /> В очередь
          </button>
          {playlistId && (
            <button
              type="button"
              className={item}
              onClick={() => {
                removeFromPlaylist(playlistId, track.id);
                flash("Убрано");
              }}
            >
              <TrashIcon className="size-4" /> Убрать из плейлиста
            </button>
          )}
          <a href={track.link} target="_blank" rel="noreferrer" className={item}>
            <ExternalIcon className="size-4" />
            {track.full || full ? `Открыть в ${SOURCE_NAME[track.source]}` : "Полная версия на Deezer"}
          </a>
          <div className="my-1 border-t-2 border-dashed border-surface-2" />
          <p className="px-3 pb-1 pt-1 text-xs font-extrabold text-muted">Добавить в плейлист</p>
          <div className="max-h-44 overflow-y-auto">
            {playlists
              .filter((p) => p.id !== playlistId)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={item}
                  onClick={() => {
                    addToPlaylist(p.id, track);
                    flash(`В «${p.name}»`);
                  }}
                >
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
          </div>
          {naming ? (
            <form
              className="flex gap-1 p-1"
              onSubmit={(e) => {
                e.preventDefault();
                createPlaylist(name || "Новый плейлист", track);
                setName("");
                flash("Плейлист создан");
              }}
            >
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название"
                className="min-w-0 flex-1 rounded-xl border-2 border-outline bg-bg px-2 py-1 text-sm"
              />
              <button type="submit" className="rounded-xl bg-accent px-2 text-sm font-extrabold text-ink">
                OK
              </button>
            </form>
          ) : (
            <button type="button" className={`${item} text-accent`} onClick={() => setNaming(true)}>
              <PlusIcon className="size-4" /> Новый плейлист
            </button>
          )}
        </div>
      )}
    </div>
  );
}
