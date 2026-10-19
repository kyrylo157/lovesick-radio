"use client";

import { useState } from "react";
import type { Track } from "@/lib/types";
import { useLibrary } from "@/store/library";
import { Bone, Heart } from "./Mascots";

const BITS = 9;

/** Лайк с взрывом сердечек и косточек. */
export function LikeButton({ track, className = "" }: { track: Track; className?: string }) {
  const liked = useLibrary((s) => s.liked.some((t) => t.id === track.id));
  const toggleLike = useLibrary((s) => s.toggleLike);
  const [burst, setBurst] = useState(0);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (toggleLike(track)) setBurst((b) => b + 1);
      }}
      aria-pressed={liked}
      aria-label={liked ? "Убрать из любимых" : "В любимые"}
      className={`relative grid place-items-center rounded-full p-1.5 transition-transform active:scale-90 ${
        liked ? "text-accent" : "text-muted hover:text-fg"
      } ${className}`}
    >
      <Heart className="size-5" filled={liked} />
      {burst > 0 && (
        <span key={burst} className="pointer-events-none absolute inset-0" aria-hidden>
          {Array.from({ length: BITS }, (_, i) => {
            const angle = (i / BITS) * Math.PI * 2;
            const dist = 26 + (i % 3) * 8;
            const style = {
              "--dx": `${Math.cos(angle) * dist}px`,
              "--dy": `${Math.sin(angle) * dist}px`,
              "--rot": `${(i % 2 ? 1 : -1) * 90}deg`,
            } as React.CSSProperties;
            return (
              <span key={i} className="burst-bit absolute left-1/2 top-1/2 -ml-2 -mt-2" style={style}>
                {i % 3 === 0 ? (
                  <Bone className="size-4 text-bone" />
                ) : (
                  <Heart className={`size-4 ${i % 2 ? "text-accent" : "text-rose"}`} />
                )}
              </span>
            );
          })}
        </span>
      )}
    </button>
  );
}
