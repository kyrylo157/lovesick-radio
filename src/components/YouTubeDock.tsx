"use client";

import { YT_HOST_ID } from "@/lib/ytEngine";
import { usePlayer } from "@/store/player";

/**
 * «Телевизор в склепе»: окошко официального YouTube-плеера, когда играет полная версия хита.
 * Правила YouTube требуют, чтобы плеер был виден (не меньше 200×200), поэтому окошко не прячется,
 * пока играет YouTube. Не нужно — кнопка «Превью» переключает трек на 30 сек из Deezer.
 */
export function YouTubeDock() {
  const active = usePlayer((s) => s.engine === "youtube");
  // «Превью» есть только у треков из Deezer-чартов; у песен из YouTube Music его нет.
  const hasPreview = usePlayer((s) => s.queue[s.index]?.source === "deezer");
  const playPreviewInstead = usePlayer((s) => s.playPreviewInstead);

  return (
    // Хост монтируется всегда: плеер создаётся в нём один раз и переиспользуется между треками.
    <aside
      aria-label="Видео YouTube"
      hidden={!active}
      // На телефоне — квадрат 200×200 в углу (меньше правила YouTube не разрешают), на ПК — 356×200.
      // Отступ снизу учитывает кружевную кромку над плеером (~22px), чтобы она не налезала на видео.
      className="sticker fixed bottom-[calc(var(--player-h)+64px+28px)] right-3 z-40 w-[200px] overflow-hidden rounded-2xl bg-ink md:bottom-[calc(var(--player-h)+28px)] md:right-4 md:w-[356px]"
    >
      <div className="flex items-center justify-between gap-2 border-b-2 border-outline bg-surface px-3 py-1 text-xs font-extrabold">
        <span className="truncate text-muted">
          <span className="hidden md:inline">Полная версия · </span>YouTube
        </span>
        {hasPreview && (
          <button type="button" onClick={playPreviewInstead} className="rounded-full px-2 py-0.5 text-accent hover:bg-surface-2">
            Превью
          </button>
        )}
      </div>
      <div id={YT_HOST_ID} className="h-[200px] w-full [&>iframe]:size-full" />
    </aside>
  );
}
