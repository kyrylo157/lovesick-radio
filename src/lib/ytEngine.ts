"use client";

/*
  Второй «движок» плеера — официальный YouTube IFrame Player.
  Плеер живёт в окошке YouTubeDock (правила YouTube требуют, чтобы он был виден, от 200×200).
  Наружу — те же действия, что у <audio>: загрузить, пауза, перемотка, громкость.
*/

/* eslint-disable @typescript-eslint/no-explicit-any -- у IFrame API нет типов в проекте */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YTHandlers {
  /** blocked — видео загружено, но браузер не дал ему стартовать без нажатия (Safari на iPhone). */
  onState: (state: "playing" | "paused" | "buffering" | "ended" | "blocked") => void;
  onTime: (position: number, duration: number) => void;
  onError: (code: number) => void;
}

export const YT_HOST_ID = "yt-host";

let apiPromise: Promise<any> | null = null;
let playerPromise: Promise<any> | null = null;
let player: any = null;
let handlers: YTHandlers | null = null;
let poll = 0;

export function setYTHandlers(h: YTHandlers) {
  handlers = h;
}

function loadApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return apiPromise;
}

function getPlayer() {
  playerPromise ??= loadApi().then(
    (YT) =>
      new Promise((resolve) => {
        // Внутренний div создаём сами: IFrame API заменяет его на <iframe>, React его не трогает.
        const host = document.getElementById(YT_HOST_ID);
        const mount = document.createElement("div");
        host?.appendChild(mount);
        player = new YT.Player(mount, {
          // Режим без cookies: YouTube не ставит трекинговые cookies, пока видео не запущено вручную
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: () => resolve(player),
            onStateChange: (e: { data: number }) => {
              const S = YT.PlayerState;
              if (e.data === S.PLAYING) handlers?.onState("playing");
              else if (e.data === S.PAUSED) handlers?.onState("paused");
              else if (e.data === S.BUFFERING) handlers?.onState("buffering");
              else if (e.data === S.ENDED) handlers?.onState("ended");
            },
            onError: (e: { data: number }) => handlers?.onError(e.data),
          },
        });
      }),
  );
  return playerPromise;
}

function startPoll() {
  stopPoll();
  poll = window.setInterval(() => {
    if (!player?.getCurrentTime) return;
    handlers?.onTime(player.getCurrentTime() || 0, player.getDuration() || 0);
  }, 250);
}

function stopPoll() {
  if (poll) window.clearInterval(poll);
  poll = 0;
}

let startCheck = 0;

export async function ytLoad(videoId: string, volume: number, muted: boolean, startAt = 0) {
  const p = await getPlayer();
  p.setVolume(Math.round(volume * 100));
  if (muted) p.mute();
  else p.unMute();
  p.loadVideoById({ videoId, startSeconds: Math.floor(startAt) });
  startPoll();
  // Если за 4 сек видео так и не пошло (ни игры, ни буферизации) — автозапуск заблокирован.
  window.clearTimeout(startCheck);
  startCheck = window.setTimeout(() => {
    const S = window.YT?.PlayerState;
    const state = player?.getPlayerState?.();
    if (S && state !== S.PLAYING && state !== S.BUFFERING) handlers?.onState("blocked");
  }, 4000);
}

export function ytPlay() {
  player?.playVideo();
}

export function ytPause() {
  player?.pauseVideo();
}

export function ytSeek(seconds: number) {
  player?.seekTo(seconds, true);
}

export function ytVolume(volume: number, muted: boolean) {
  if (!player) return;
  player.setVolume(Math.round(volume * 100));
  if (muted) player.mute();
  else player.unMute();
}

export function ytStop() {
  stopPoll();
  window.clearTimeout(startCheck);
  player?.stopVideo?.();
}
