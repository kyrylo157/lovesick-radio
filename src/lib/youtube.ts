/*
  Полные версии хитов: Deezer даёт только 30 сек, поэтому находим трек в YouTube Music
  (lib/ytmusic.ts, без ключа) и играем официальным встраиваемым плеером.
  Выключатель на случай, если YouTube Music сломается: LOVESICK_NO_YOUTUBE=1 в .env.local
  вернёт 30-сек превью.
*/

export function hasYouTube() {
  return process.env.LOVESICK_NO_YOUTUBE !== "1";
}
