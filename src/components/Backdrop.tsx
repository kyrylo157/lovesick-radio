"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BACKDROPS, DEFAULT_BG } from "@/lib/backdrops";

/*
  Объёмный фон сайта. Варианты переключаются атрибутом <html data-bg>:
  fog — плывущее свечение, lace — кружевные обои, velvet — бархатные складки,
  moon — луна, облака и кладбище на трёх глубинах. Общие слои: свечение, виньетка, зерно.
*/

function Graveyard() {
  return (
    <svg viewBox="0 0 1440 220" preserveAspectRatio="xMidYMax slice" className="bd-graves" aria-hidden>
      <g fill="currentColor">
        <path d="M0 220V160q180-34 400-8t460-4 580 10v62z" />
        {/* надгробия */}
        <path d="M120 168v-46a22 22 0 0 1 44 0v46z" />
        <path d="M520 160v-52a26 26 0 0 1 52 0v52z" />
        <path d="M1010 166v-40a18 18 0 0 1 36 0v40z" />
        <path d="M1290 168v-50a24 24 0 0 1 48 0v50z" />
        {/* кресты */}
        <path d="M318 162v-64h9v64zM302 114h41v9h-41z" />
        <path d="M772 156v-50h8v50zM759 118h34v8h-34z" />
        <path d="M1172 164v-58h9v58zM1157 120h39v9h-39z" />
        {/* оградка */}
        <path d="M640 158v-30l5-7 5 7v30zM664 157v-30l5-7 5 7v30zM688 156v-30l5-7 5 7v30zM636 136h66v5h-66z" />
      </g>
      {/* голое дерево */}
      <g fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round">
        <path d="M900 160c4-36-4-64 6-104" />
        <path d="M904 96c16-10 28-22 48-24M903 74c-12-10-24-16-38-14M906 60c8-12 10-22 22-30M952 72c8-6 12-12 24-12" strokeWidth="4" />
      </g>
      {/* сердечко на надгробии — подмигиваем стилю */}
      <path d="M546 128c-4-6-12-4-12 2 0 6 12 12 12 12s12-6 12-12c0-6-8-8-12-2z" fill="var(--glow-pink)" />
    </svg>
  );
}

export function Backdrop() {
  const root = useRef<HTMLDivElement>(null);

  // Параллакс: слои сдвигаются при прокрутке с разной скоростью — отсюда ощущение глубины.
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => el.style.setProperty("--scroll", String(window.scrollY)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={root} className="backdrop" aria-hidden>
      <div className="bd-glow" />
      <div className="bd-blobs">
        <span />
        <span />
        <span />
      </div>
      <div className="bd-lace" />
      <div className="bd-velvet" />
      <div className="bd-moon">
        <span className="bd-moon-disk" />
        <span className="bd-cloud" />
        <span className="bd-cloud" />
        <span className="bd-cloud" />
        <Graveyard />
      </div>
      <div className="bd-vignette" />
      <div className="bd-grain" />
    </div>
  );
}

/* ---------- кнопка выбора фона ---------- */

function subscribeBg(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-bg"] });
  return () => obs.disconnect();
}

function WallpaperIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="15.5" cy="9" r="2" />
      <path d="M3 17l5-5 4 4 2-2 7 6" />
    </svg>
  );
}

/** Кнопка рядом с переключателем темы: открывает список фонов. `up` — меню раскрывается вверх. */
export function BackdropButton({ up = false }: { up?: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = useSyncExternalStore(
    subscribeBg,
    () => document.documentElement.dataset.bg ?? DEFAULT_BG,
    () => DEFAULT_BG,
  );

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Выбрать фон"
        className="grid size-9 place-items-center rounded-full border-2 border-outline bg-surface-2 text-fg hover:text-accent"
      >
        <WallpaperIcon className="size-5" />
      </button>
      {open && (
        <div
          role="menu"
          className={`sticker absolute z-50 w-56 rounded-2xl bg-surface p-1.5 ${up ? "bottom-11 left-0" : "right-0 top-11"}`}
        >
          <p className="px-3 pb-1 pt-1 text-xs font-extrabold text-muted">Фон</p>
          {BACKDROPS.map((b) => (
            <button
              key={b.id}
              type="button"
              role="menuitemradio"
              aria-checked={current === b.id}
              onClick={() => {
                document.documentElement.dataset.bg = b.id;
                try {
                  localStorage.setItem("lovesick-bg", b.id);
                } catch {}
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-surface-2 ${
                current === b.id ? "text-accent" : ""
              }`}
            >
              <span className={`bg-swatch bg-swatch-${b.id} size-9 shrink-0 rounded-lg border-2 border-outline`} />
              <span>
                <span className="block text-sm font-extrabold">{b.name}</span>
                <span className="block text-xs text-muted">{b.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
