// Отдельно от audius.ts: этот модуль нужен браузерному плееру, а там серверный кэш недоступен.
export const AUDIUS_APP_NAME = "lovesick-radio";

export function audiusStreamUrl(id: string) {
  return `https://api.audius.co/v1/tracks/${encodeURIComponent(id)}/stream?app_name=${AUDIUS_APP_NAME}`;
}
