"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Playlist, Track } from "@/lib/types";

interface LibraryState {
  liked: Track[];
  playlists: Playlist[];
  toggleLike: (track: Track) => boolean;
  createPlaylist: (name: string, first?: Track, cover?: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  setCover: (id: string, cover: string | undefined) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (id: string, track: Track) => void;
  removeFromPlaylist: (id: string, trackId: string) => void;
}

const newId = () => Math.random().toString(36).slice(2, 10);

// Пока без аккаунтов: всё хранится в браузере. Схема та же, что потом уедет в базу.
export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      liked: [],
      playlists: [],

      toggleLike: (track) => {
        const isLiked = get().liked.some((t) => t.id === track.id);
        set({
          liked: isLiked ? get().liked.filter((t) => t.id !== track.id) : [track, ...get().liked],
        });
        return !isLiked;
      },

      createPlaylist: (name, first, cover) => {
        const id = newId();
        const playlist: Playlist = {
          id,
          name: name.trim() || "Без названия",
          tracks: first ? [first] : [],
          createdAt: Date.now(),
          cover,
        };
        set({ playlists: [playlist, ...get().playlists] });
        return id;
      },

      renamePlaylist: (id, name) =>
        set({
          playlists: get().playlists.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)),
        }),

      setCover: (id, cover) =>
        set({ playlists: get().playlists.map((p) => (p.id === id ? { ...p, cover } : p)) }),

      deletePlaylist: (id) => set({ playlists: get().playlists.filter((p) => p.id !== id) }),

      addToPlaylist: (id, track) =>
        set({
          playlists: get().playlists.map((p) =>
            p.id === id && !p.tracks.some((t) => t.id === track.id)
              ? { ...p, tracks: [...p.tracks, track] }
              : p,
          ),
        }),

      removeFromPlaylist: (id, trackId) =>
        set({
          playlists: get().playlists.map((p) =>
            p.id === id ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) } : p,
          ),
        }),
    }),
    // skipHydration: сервер и первый рендер клиента видят пустую библиотеку, иначе будет hydration mismatch.
    { name: "lovesick-library", skipHydration: true },
  ),
);
