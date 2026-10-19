"use client";

import { useEffect } from "react";
import { useLibrary } from "@/store/library";
import { initPlayer, usePlayer } from "@/store/player";
import { StorageWarning } from "./StorageWarning";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useLibrary.persist.rehydrate();
    initPlayer();

    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, [contenteditable], button, a, select")) return;
      if (e.code === "Space") {
        e.preventDefault();
        usePlayer.getState().toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {children}
      <StorageWarning />
    </>
  );
}
