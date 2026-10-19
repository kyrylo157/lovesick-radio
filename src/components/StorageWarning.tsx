"use client";

import { useEffect, useState } from "react";
import { STORAGE_FULL_EVENT } from "@/store/library";
import { CloseIcon } from "./Icons";

/** Предупреждение, что память браузера переполнена и коллекция больше не сохраняется. */
export function StorageWarning() {
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onFull = () => setFull(true);
    window.addEventListener(STORAGE_FULL_EVENT, onFull);
    return () => window.removeEventListener(STORAGE_FULL_EVENT, onFull);
  }, []);

  if (!full) return null;
  return (
    <div
      role="alert"
      className="sticker fixed left-1/2 top-4 z-[60] flex w-[min(520px,calc(100vw-24px))] -translate-x-1/2 items-start gap-3 rounded-2xl bg-rose p-4 text-sm font-bold text-bone"
    >
      <p className="flex-1">
        Память браузера переполнена — последние изменения в коллекции не сохранятся. Убери обложки у пары плейлистов
        или удали лишние плейлисты.
      </p>
      <button type="button" onClick={() => setFull(false)} aria-label="Закрыть" className="rounded-full p-1 hover:bg-ink/20">
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}
