"use client";

import Link from "next/link";
import { useState } from "react";
import { PlusIcon } from "@/components/Icons";
import { BatBlob, Heart } from "@/components/Mascots";
import { CoverPicker, PlaylistCover } from "@/components/PlaylistCover";
import { Empty, Section } from "@/components/Section";
import { TrackList } from "@/components/TrackList";
import { PlayAllButton } from "@/components/TrackShelf";
import { useLibrary } from "@/store/library";

export default function LibraryPage() {
  const liked = useLibrary((s) => s.liked);
  const playlists = useLibrary((s) => s.playlists);
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const [name, setName] = useState("");
  const [cover, setCover] = useState<string | undefined>();

  return (
    <>
      <title>Моя коллекция · Lovesick Radio</title>
      <h1 className="font-display text-5xl text-accent [text-shadow:3px_3px_0_var(--outline)]">Моя коллекция</h1>
      <p className="mt-2 text-sm text-muted">Хранится в этом браузере — без регистрации.</p>

      <Section title="Плейлисты">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <li>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createPlaylist(name || "Новый плейлист", undefined, cover);
                setName("");
                setCover(undefined);
              }}
              className="flex aspect-square flex-col justify-end gap-2 rounded-[var(--radius-card)] border-3 border-dashed border-surface-2 p-4"
            >
              <div className="mb-auto flex items-start justify-between gap-2">
                <PlusIcon className="size-8 text-muted" />
                <CoverPicker
                  onPick={setCover}
                  label="Обложка нового плейлиста"
                  className="group/cover relative grid size-16 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-muted text-[10px] font-extrabold leading-tight text-muted hover:border-accent hover:text-accent"
                >
                  {cover ? (
                    <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <span className="px-1 text-center">+ обложка</span>
                  )}
                </CoverPicker>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название"
                aria-label="Название нового плейлиста"
                className="w-full rounded-xl border-2 border-outline bg-bg px-2 py-1 text-sm"
              />
              <button type="submit" className="rounded-xl bg-accent py-1 text-sm font-extrabold text-ink">
                Создать плейлист
              </button>
            </form>
          </li>
          {playlists.map((p) => (
            <li key={p.id}>
              <Link href={`/playlist/${p.id}`} className="group block">
                <PlaylistCover
                  playlist={p}
                  className="sticker aspect-square w-full rounded-[var(--radius-card)] bg-surface-2 transition-transform duration-200 group-hover:-translate-y-1.5"
                />
                <span className="mt-2 block truncate font-extrabold">{p.name}</span>
                <span className="text-sm text-muted">{p.tracks.length} тр.</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Любимое" note={liked.length ? `${liked.length} тр.` : undefined}>
        {liked.length > 0 && (
          <div className="mb-4">
            <PlayAllButton tracks={liked} />
          </div>
        )}
        <TrackList
          tracks={liked}
          empty={
            <Empty>
              <BatBlob className="mx-auto mb-3 w-32" />
              Жми <Heart className="inline size-4 text-accent" /> у любого трека — он появится здесь.
            </Empty>
          }
        />
      </Section>
    </>
  );
}
