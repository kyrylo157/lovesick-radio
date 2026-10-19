"use client";

import { create } from "zustand";
import { fullTracksEnabled } from "@/lib/fullMode";
import { audiusStreamUrl } from "@/lib/stream";
import type { Track } from "@/lib/types";
import { setYTHandlers, ytLoad, ytPlay, ytSeek, ytStop, ytToggle, ytVolume } from "@/lib/ytEngine";

export type RepeatMode = "off" | "all" | "one";
/** Чем играем: <audio> (Audius, превью Deezer) или YouTube-плеер (полные версии хитов). */
export type Engine = "audio" | "youtube";

interface PlayerState {
  engine: Engine;
  queue: Track[];
  index: number;
  playing: boolean;
  loading: boolean;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  error: string | null;

  playList: (tracks: Track[], start?: number) => void;
  playTrack: (track: Track) => void;
  addToQueue: (track: Track) => void;
  toggle: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  jumpTo: (index: number) => void;
  removeFromQueue: (index: number) => void;
  clearError: () => void;
  /** YouTube-версия не подошла — переключить текущий трек на 30-сек превью. */
  playPreviewInstead: () => void;
}

/* ---------- движок: один <audio> на всё приложение ---------- */

let audio: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let levelBuf: Uint8Array<ArrayBuffer> | null = null;
let loadToken = 0;

function getAudio() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "auto";
  // Оба источника отдают Access-Control-Allow-Origin: * — значит можно анализировать звук.
  audio.crossOrigin = "anonymous";

  // События <audio> учитываем, только пока играет именно он, а не YouTube.
  const set = (s: Partial<PlayerState>) => {
    if (usePlayer.getState().engine === "audio") usePlayer.setState(s);
  };
  audio.addEventListener("play", () => set({ playing: true }));
  audio.addEventListener("pause", () => set({ playing: false }));
  audio.addEventListener("waiting", () => set({ loading: true }));
  audio.addEventListener("playing", () => set({ loading: false }));
  audio.addEventListener("canplay", () => set({ loading: false }));
  audio.addEventListener("timeupdate", () => set({ position: audio!.currentTime }));
  audio.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(audio!.duration)) set({ duration: audio!.duration });
  });
  audio.addEventListener("ended", () => {
    if (usePlayer.getState().engine === "audio") usePlayer.getState().next(true);
  });
  audio.addEventListener("error", () => {
    if (!audio!.src || usePlayer.getState().engine !== "audio") return;
    set({ loading: false, playing: false, error: "Этот трек не захотел вставать из могилы — включаю следующий" });
    setTimeout(() => usePlayer.getState().next(true), 1200);
  });
  return audio;
}

function ensureAnalyser() {
  if (analyser || typeof window === "undefined") return;
  try {
    ctx = new AudioContext();
    const src = ctx.createMediaElementSource(getAudio());
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    levelBuf = new Uint8Array(analyser.frequencyBinCount);
  } catch {
    analyser = null;
  }
}

/** Громкость 0..1 для анимаций (маскот кивает, мышки-эквалайзер). */
export function getLevel(bands = 1): number[] {
  if (!analyser || !levelBuf) return Array(bands).fill(0);
  analyser.getByteFrequencyData(levelBuf);
  // Верхняя половина спектра почти пустая — берём нижние 60%.
  const usable = Math.floor(levelBuf.length * 0.6);
  const per = Math.max(1, Math.floor(usable / bands));
  return Array.from({ length: bands }, (_, b) => {
    let sum = 0;
    for (let i = b * per; i < (b + 1) * per; i++) sum += levelBuf![i];
    return sum / per / 255;
  });
}

async function resolveSrc(track: Track) {
  if (track.source === "audius") return audiusStreamUrl(track.sourceId);
  const res = await fetch(`/api/preview/${track.sourceId}`);
  if (!res.ok) throw new Error("no preview");
  return ((await res.json()) as { url: string }).url;
}

/** id полной версии на YouTube для Deezer-трека; null — играем 30-сек превью. */
async function resolveYouTube(track: Track) {
  if (track.source !== "deezer" || !fullTracksEnabled()) return null;
  try {
    const res = await fetch(`/api/full/${track.sourceId}`);
    if (!res.ok) return null;
    return ((await res.json()) as { videoId: string }).videoId;
  } catch {
    return null;
  }
}

async function load(track: Track | undefined, opts: { forcePreview?: boolean } = {}) {
  const el = getAudio();
  if (!track) {
    el.pause();
    ytStop();
    return;
  }
  const token = ++loadToken;
  usePlayer.setState({ loading: true, position: 0, duration: track.fullDuration ?? track.duration, error: null });
  setMediaSession(track);
  ensureAnalyser();
  if (ctx?.state === "suspended") void ctx.resume();

  // Трек из YouTube Music играет напрямую; Deezer-трек сначала ищем там же.
  const videoId =
    track.source === "youtube" ? track.sourceId : opts.forcePreview ? null : await resolveYouTube(track);
  if (token !== loadToken) return;
  if (videoId) {
    el.pause();
    usePlayer.setState({ engine: "youtube" });
    const { volume, muted } = usePlayer.getState();
    await ytLoad(videoId, volume, muted);
    return;
  }

  ytStop();
  usePlayer.setState({ engine: "audio", duration: track.duration });
  try {
    const src = await resolveSrc(track);
    if (token !== loadToken) return; // пока грузили, пользователь уже переключил
    el.src = src;
    await el.play();
  } catch (e) {
    if (token !== loadToken) return;
    // Автоплей заблокирован браузером — это не ошибка трека, просто ждём клика.
    if (e instanceof DOMException && e.name === "NotAllowedError") {
      usePlayer.setState({ loading: false, playing: false });
      return;
    }
    if (e instanceof DOMException && e.name === "AbortError") return;
    usePlayer.setState({ loading: false, playing: false, error: "Не получилось достать трек из склепа" });
  }
}

function setMediaSession(track: Track) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: "Lovesick Radio",
    artwork: track.artwork ? [{ src: track.artwork, sizes: "480x480" }] : [],
  });
}

function pickNext(s: PlayerState, auto: boolean): number | null {
  const n = s.queue.length;
  if (!n) return null;
  if (auto && s.repeat === "one") return s.index;
  if (s.shuffle && n > 1) {
    let i = s.index;
    while (i === s.index) i = Math.floor(Math.random() * n);
    return i;
  }
  if (s.index + 1 < n) return s.index + 1;
  return s.repeat === "all" || !auto ? 0 : null;
}

export const usePlayer = create<PlayerState>()((set, get) => ({
  engine: "audio",
  queue: [],
  index: -1,
  playing: false,
  loading: false,
  position: 0,
  duration: 0,
  volume: 0.8,
  muted: false,
  shuffle: false,
  repeat: "off",
  error: null,

  playList: (tracks, start = 0) => {
    if (!tracks.length) return;
    set({ queue: tracks, index: start });
    void load(tracks[start]);
  },

  playTrack: (track) => {
    const { queue, index } = get();
    const existing = queue.findIndex((t) => t.id === track.id);
    if (existing >= 0) return get().jumpTo(existing);
    const nextQueue = [...queue.slice(0, index + 1), track, ...queue.slice(index + 1)];
    set({ queue: nextQueue, index: index + 1 });
    void load(track);
  },

  addToQueue: (track) => {
    const { queue, index } = get();
    if (queue.some((t) => t.id === track.id)) return;
    set({ queue: [...queue, track] });
    if (index < 0) get().jumpTo(0);
  },

  toggle: () => {
    const el = getAudio();
    const { index, queue, engine } = get();
    if (index < 0 || !queue[index]) return;
    if (engine === "youtube") return ytToggle();
    if (!el.src) return void load(queue[index]);
    if (ctx?.state === "suspended") void ctx.resume();
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  },

  next: (auto = false) => {
    const i = pickNext(get(), auto);
    if (i === null) {
      getAudio().pause();
      ytStop();
      set({ position: 0, playing: false });
      return;
    }
    if (i === get().index) {
      get().seek(0);
      if (get().engine === "youtube") ytPlay();
      else void getAudio().play().catch(() => {});
      return;
    }
    set({ index: i });
    void load(get().queue[i]);
  },

  prev: () => {
    if (get().position > 3 || get().index <= 0) {
      get().seek(0);
      return;
    }
    const i = get().index - 1;
    set({ index: i });
    void load(get().queue[i]);
  },

  seek: (seconds) => {
    if (get().engine === "youtube") {
      const t = Math.max(0, Math.min(seconds, get().duration || seconds));
      ytSeek(t);
      set({ position: t });
      return;
    }
    const el = getAudio();
    if (!el.src) return;
    el.currentTime = Math.max(0, Math.min(seconds, el.duration || seconds));
    set({ position: el.currentTime });
  },

  setVolume: (v) => {
    const volume = Math.max(0, Math.min(1, v));
    getAudio().volume = volume;
    getAudio().muted = false;
    ytVolume(volume, false);
    set({ volume, muted: false });
    try {
      localStorage.setItem("lovesick-volume", String(volume));
    } catch {}
  },

  toggleMute: () => {
    const muted = !get().muted;
    getAudio().muted = muted;
    ytVolume(get().volume, muted);
    set({ muted });
  },

  playPreviewInstead: () => {
    const track = get().queue[get().index];
    if (track && track.source === "deezer") void load(track, { forcePreview: true });
  },

  toggleShuffle: () => set({ shuffle: !get().shuffle }),

  cycleRepeat: () => {
    const order: RepeatMode[] = ["off", "all", "one"];
    set({ repeat: order[(order.indexOf(get().repeat) + 1) % order.length] });
  },

  jumpTo: (index) => {
    const track = get().queue[index];
    if (!track) return;
    set({ index });
    void load(track);
  },

  removeFromQueue: (i) => {
    const { queue, index } = get();
    if (i === index) return; // играющий трек не удаляем — для этого есть «дальше»
    set({ queue: queue.filter((_, k) => k !== i), index: i < index ? index - 1 : index });
  },

  clearError: () => set({ error: null }),
}));

/** Вызывается один раз на клиенте: громкость из прошлого визита + кнопки на экране блокировки. */
export function initPlayer() {
  const el = getAudio();
  try {
    const saved = Number(localStorage.getItem("lovesick-volume"));
    if (saved >= 0 && saved <= 1 && localStorage.getItem("lovesick-volume") !== null) {
      el.volume = saved;
      usePlayer.setState({ volume: saved });
    } else {
      el.volume = usePlayer.getState().volume;
    }
  } catch {
    el.volume = usePlayer.getState().volume;
  }
  // События YouTube-плеера учитываем, только пока играет именно он.
  const yt = (s: Partial<PlayerState>) => {
    if (usePlayer.getState().engine === "youtube") usePlayer.setState(s);
  };
  setYTHandlers({
    onState: (state) => {
      if (state === "playing") yt({ playing: true, loading: false });
      else if (state === "paused") yt({ playing: false });
      else if (state === "buffering") yt({ loading: true });
      else if (state === "ended" && usePlayer.getState().engine === "youtube") usePlayer.getState().next(true);
    },
    onTime: (position, duration) => yt(duration ? { position, duration } : { position }),
    // 101/150 — владелец запретил встраивание, 100 — видео удалено: играем хотя бы превью.
    onError: () => {
      const s = usePlayer.getState();
      if (s.engine !== "youtube") return;
      // У трека из YouTube Music превью нет — просто идём дальше.
      if (s.queue[s.index]?.source === "youtube") {
        usePlayer.setState({ error: "Это видео нельзя встроить — включаю следующий" });
        setTimeout(() => usePlayer.getState().next(true), 1200);
        return;
      }
      usePlayer.setState({ error: "Полная версия недоступна — включаю 30-секундное превью" });
      s.playPreviewInstead();
    },
  });

  if ("mediaSession" in navigator) {
    const s = () => usePlayer.getState();
    navigator.mediaSession.setActionHandler("play", () => s().toggle());
    navigator.mediaSession.setActionHandler("pause", () => s().toggle());
    navigator.mediaSession.setActionHandler("nexttrack", () => s().next());
    navigator.mediaSession.setActionHandler("previoustrack", () => s().prev());
  }
}

export const currentTrack = (s: PlayerState) => s.queue[s.index] as Track | undefined;
