"use client";

import { useEffect, useRef } from "react";
import { getLevel, usePlayer } from "@/store/player";
import { ZombieKid } from "./Mascots";

/** Зомбик в герое: когда играет музыка, кивает в такт (по низким частотам). */
export function DancingZombie({ className = "" }: { className?: string }) {
  const playing = usePlayer((s) => s.playing);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!playing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.transform = "";
      return;
    }
    let raf = 0;
    let smooth = 0;
    const tick = (t: number) => {
      const [bass] = getLevel(1);
      const lvl = bass || 0.4 + 0.25 * Math.sin(t / 230);
      smooth = smooth * 0.7 + lvl * 0.3;
      el.style.transform = `rotate(${(smooth - 0.4) * 18}deg) translateY(${-smooth * 14}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return (
    <div className={playing ? "" : "float-bob"}>
      <div ref={ref} className={`origin-bottom ${className}`}>
        <ZombieKid className="h-full w-full drop-shadow-[6px_6px_0_var(--outline)]" />
      </div>
    </div>
  );
}
