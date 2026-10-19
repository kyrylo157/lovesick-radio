"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { MOODS } from "@/lib/moods";
import { useLibrary } from "@/store/library";
import { BackdropButton } from "./Backdrop";
import { HomeIcon, LibraryIcon, MoonIcon, SearchIcon } from "./Icons";
import { BatBlob, Heart } from "./Mascots";

const LINKS = [
  { href: "/", label: "Главная", Icon: HomeIcon },
  { href: "/search", label: "Поиск", Icon: SearchIcon },
  { href: "/library", label: "Моя коллекция", Icon: LibraryIcon },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`block leading-none ${className}`} aria-label="Lovesick Radio — на главную">
      <span className="font-display text-[2.1rem] text-accent [text-shadow:3px_3px_0_var(--outline)]">Lovesick</span>
      <span className="ml-1 font-display text-[1.4rem] text-zombie [text-shadow:2px_2px_0_var(--outline)]">Radio</span>
    </Link>
  );
}

// Тема живёт в атрибуте <html data-theme>: подписываемся на него, а не дублируем в state.
function subscribeTheme(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

export function ThemeToggle() {
  const light = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.dataset.theme === "light",
    () => false,
  );
  return (
    <button
      type="button"
      onClick={() => {
        const next = !light;
        document.documentElement.dataset.theme = next ? "light" : "dark";
        try {
          localStorage.setItem("lovesick-theme", next ? "light" : "dark");
        } catch {}
      }}
      aria-label={light ? "Включить ночь в склепе" : "Включить розовую валентинку"}
      className="grid size-9 place-items-center rounded-full border-2 border-outline bg-surface-2 text-fg hover:text-accent"
    >
      {light ? <MoonIcon className="size-5" /> : <Heart className="size-5" />}
    </button>
  );
}

export function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Трек или артист — можно по-русски"
        aria-label="Поиск музыки"
        className="w-full rounded-full border-3 border-outline bg-surface py-2 pl-10 pr-4 font-bold placeholder:text-muted focus:border-accent focus:outline-none"
      />
    </form>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const playlists = useLibrary((s) => s.playlists);
  const likedCount = useLibrary((s) => s.liked.length);

  return (
    // Прокручивается только середина панели: если бы прокручивалась вся панель,
    // она обрезала бы меню фона, которое раскрывается из нижнего ряда наружу.
    <aside className="sticky top-0 z-30 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r-3 border-outline bg-surface/60 px-4 pb-[calc(var(--player-h)+16px)] pt-6 backdrop-blur-xl md:flex">
      <Logo className="px-2" />
      <div className="-mx-2 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-2">
        <nav aria-label="Основное" className="flex flex-col gap-1">
          {LINKS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2 font-extrabold transition-colors ${
                isActive(pathname, href) ? "bg-accent text-ink" : "text-muted hover:bg-surface-2 hover:text-fg"
              }`}
            >
              <Icon className="size-5" /> {label}
            </Link>
          ))}
        </nav>

        <section>
          <h2 className="mb-2 px-3 text-sm font-extrabold text-muted">Настроения</h2>
          <ul className="flex flex-col">
            {MOODS.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/mood/${m.slug}`}
                  aria-current={pathname === `/mood/${m.slug}` ? "page" : undefined}
                  className={`block truncate rounded-xl px-3 py-1.5 text-sm font-bold hover:bg-surface-2 ${
                    pathname === `/mood/${m.slug}` ? "text-accent" : ""
                  }`}
                >
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 px-3 text-sm font-extrabold text-muted">Плейлисты</h2>
          <ul className="flex flex-col">
            <li>
              <Link href="/library" className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold hover:bg-surface-2">
                <Heart className="size-4 text-accent" /> Любимое
                <span className="ml-auto text-xs text-muted">{likedCount}</span>
              </Link>
            </li>
            {playlists.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/playlist/${p.id}`}
                  className={`block truncate rounded-xl px-3 py-1.5 text-sm font-bold hover:bg-surface-2 ${
                    pathname === `/playlist/${p.id}` ? "text-accent" : ""
                  }`}
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex shrink-0 items-end justify-between gap-2">
        <BatBlob className="w-28" />
        <div className="flex gap-2">
          <BackdropButton up />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Основное"
      className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-3 border-t-3 border-outline bg-surface/80 backdrop-blur-xl md:hidden"
    >
      {LINKS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 text-xs font-extrabold ${
            isActive(pathname, href) ? "text-accent" : "text-muted"
          }`}
        >
          <Icon className="size-6" /> {label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileHeader() {
  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-4 md:hidden">
      <Logo />
      <div className="flex gap-2">
        <BackdropButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
