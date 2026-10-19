import type { Metadata, Viewport } from "next";
import { Nunito, Rubik_Wet_Paint } from "next/font/google";
import { Suspense } from "react";
import { Backdrop } from "@/components/Backdrop";
import { BACKDROP_IDS } from "@/lib/backdrops";
import { MobileHeader, MobileNav, Sidebar } from "@/components/Nav";
import { PlayerBar } from "@/components/PlayerBar";
import { Providers } from "@/components/Providers";
import { YouTubeDock } from "@/components/YouTubeDock";
import { hasYouTube } from "@/lib/youtube";
import "./globals.css";

// Оба шрифта с кириллицей. Wet Paint — капающая краска, только для логотипа и крупных заголовков.
const wetPaint = Rubik_Wet_Paint({
  variable: "--font-wet-paint",
  weight: "400",
  subsets: ["latin", "cyrillic"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  // Нужен, чтобы картинка-превью (opengraph-image.tsx) получила полный адрес для Telegram/соцсетей
  metadataBase: new URL("https://lovesick-radio.vercel.app"),
  title: { default: "Lovesick Radio", template: "%s · Lovesick Radio" },
  description: "Музыка для влюблённых и немёртвых: инди и мировые хиты целиком — в розово-чёрном склепе.",
  openGraph: { siteName: "Lovesick Radio", locale: "ru_RU", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#140910",
};

// Тема ставится до первой отрисовки, чтобы не мигало.
// Фон из прошлого визита берём, только если такой вариант ещё существует.
// На слабых устройствах (≤4 ядер или ≤4 ГБ памяти) включаем облегчённый режим .lite (см. globals.css).
const themeScript = `try{var d=document.documentElement,n=navigator,t=localStorage.getItem("lovesick-theme"),b=localStorage.getItem("lovesick-bg");if(t)d.dataset.theme=t;if(${JSON.stringify(BACKDROP_IDS)}.indexOf(b)>=0)d.dataset.bg=b;if((n.hardwareConcurrency||8)<=4||(n.deviceMemory||8)<=4)d.classList.add("lite")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      data-theme="dark"
      // Ключ YouTube есть — Deezer-хиты играют целиком (см. lib/youtube.ts, lib/fullMode.ts).
      data-full={hasYouTube() ? "1" : undefined}
      className={`${wetPaint.variable} ${nunito.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <Providers>
          <Backdrop />
          <div className="flex">
            {/* Навигация подсвечивает текущий раздел по URL — значит, ей нужен Suspense */}
            <Suspense fallback={<div className="hidden w-64 shrink-0 border-r-3 border-outline bg-surface/60 md:block" />}>
              <Sidebar />
            </Suspense>
            <div className="min-w-0 flex-1">
              <MobileHeader />
              <main className="mx-auto max-w-[1300px] px-4 pb-[calc(var(--player-h)+96px)] pt-4 sm:px-8 md:pb-[calc(var(--player-h)+40px)] md:pt-8">
                {children}
                {/* Указание источников: требование условий Deezer и просто честно перед авторами */}
                <footer className="mt-16 border-t-2 border-dashed border-surface-2 pt-4 text-xs text-muted">
                  Музыка: <a href="https://audius.co" target="_blank" rel="noreferrer" className="underline hover:text-fg">Audius</a>,{" "}
                  <a href="https://www.deezer.com" target="_blank" rel="noreferrer" className="underline hover:text-fg">Deezer</a>,{" "}
                  <a href="https://music.youtube.com" target="_blank" rel="noreferrer" className="underline hover:text-fg">YouTube Music</a>.
                  Все треки принадлежат их авторам. Некоммерческий проект для своих.
                </footer>
              </main>
            </div>
          </div>
          <YouTubeDock />
          <PlayerBar />
          <Suspense>
            <MobileNav />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
