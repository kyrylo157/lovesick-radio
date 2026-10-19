"use client";

import { useSyncExternalStore } from "react";

/*
  Включены ли полные версии хитов (есть ключ YouTube на сервере).
  Сервер ставит <html data-full="1">, клиент читает отсюда — без лишнего запроса.
*/

export function fullTracksEnabled() {
  return typeof document !== "undefined" && document.documentElement.dataset.full === "1";
}

const noop = () => () => {};

export function useFullTracks() {
  return useSyncExternalStore(noop, fullTracksEnabled, () => false);
}
