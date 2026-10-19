"use client";

import { useEffect, useRef } from "react";
import { getLevel, usePlayer } from "@/store/player";

/**
 * Эквалайзер из маленьких летучих мышей: каждая прыгает на своей полосе частот.
 * `compact` — две мышки поменьше, чтобы влезть в колонку номера в списке треков.
 */
export function BatEqualizer({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const BATS = compact ? 2 : 4;
  const playing = usePlayer((s) => s.playing);
  const refs = useRef<(SVGSVGElement | null)[]>([]);

  useEffect(() => {
    if (!playing) {
      refs.current.forEach((el) => el && (el.style.transform = ""));
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const tick = (t: number) => {
      const levels = getLevel(BATS);
      const silent = levels.every((l) => l === 0);
      refs.current.forEach((el, i) => {
        if (!el) return;
        // Если анализатор недоступен — мышки просто покачиваются, а не замирают.
        const lvl = silent ? 0.35 + 0.3 * Math.sin(t / 180 + i * 1.3) : levels[i];
        el.style.transform = `translateY(${-lvl * (compact ? 6 : 12)}px) scale(${0.85 + lvl * 0.35})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, BATS, compact]);

  return (
    <div className={`flex items-end gap-0.5 ${className}`} aria-hidden>
      {Array.from({ length: BATS }, (_, i) => (
        <svg
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          viewBox="0 0 24 14"
          className={`${compact ? "h-2 w-3" : "h-3 w-5"} text-accent transition-transform duration-75`}
        >
          <path
            d="M12 4c-1-2-1.6-3-1.6-3L9.6 3.5C7 1 3 1 0 3c2 .6 2.4 2 2 3.4 2-.6 3.6.4 4 2 1.6-1 3.6-.6 4.4 1 .5.6 1 1.6 1.6 3 .6-1.4 1.1-2.4 1.6-3 .8-1.6 2.8-2 4.4-1 .4-1.6 2-2.6 4-2-.4-1.4 0-2.8 2-3.4-3-2-7-2-9.6.5L13.6 1S13 2 12 4z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}
