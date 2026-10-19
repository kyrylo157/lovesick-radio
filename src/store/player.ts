"use client";

import { create } from "zustand";
import { fullTracksEnabled } from "@/lib/fullMode";
import { audiusStreamUrl } from "@/lib/stream";
import type { Track } from "@/lib/types";
import { setYTHandlers, ytLoad, ytPause, ytPlay, ytSeek, ytStop, ytVolume } from "@/lib/ytEngine";

export type RepeatMode = "off" | "all" | "one";
/** Чем играем: <audio> (Audius, превью Deezer) или YouTube-плеер (YouTube Music, полные версии хитов). */
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
  /** id треков, которые уже отыграли — чтобы «назад» в режиме перемешивания вёл к реально предыдущему. */
  history: string[];

  playList: (tracks: Track[], start?: number) => void;
  playTrack: (track: Track) => void;
  addToQueue: (track: Track) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
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

/*
  Сколько треков подряд не загрузилось. Сбрасывается, как только что-то заиграло.
  Без этого при пропавшем интернете и «повторе всего» плеер перебирал бы очередь вечно.
*/
let failStreak = 0;
const MAX_FAILS = 3;
/** Трек, для которого уже пробовали взять свежую ссылку на превью (они протухают). */
let refreshedPreviewFor: string | null = null;

const st = () => usePlayer.getState();

/** Загрузка, по которой уже засчитана неудача: на одну неудачу браузер шлёт и ошибку play(), и событие error. */
let failedLoad = -1;

/** Трек не загрузился: пропускаем, но не больше MAX_FAILS раз подряд. */
function skipBroken(message: string) {
  if (failedLoad === loadToken) return;
  failedLoad = loadToken;
  failStreak += 1;
  const s = st();
  if (failStreak >= Math.min(MAX_FAILS, s.queue.length)) {
    getAudio().pause();
    ytStop();
    usePlayer.setState({
      playing: false,
      loading: false,
      error: "Не получается ничего включить — проверь интернет и попробуй ещё раз",
    });
    failStreak = 0;
    return;
  }
  usePlayer.setState({ loading: false, playing: false, error: message });
  setTimeout(() => st().next(true), 1200);
}

function markPlaying() {
  failStreak = 0;
  refreshedPreviewFor = null;
}

function getAudio() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "auto";
  // Оба источника отдают Access-Control-Allow-Origin: * — значит можно анализировать звук.
  audio.crossOrigin = "anonymous";

  // События <audio> учитываем, только пока играет именно он, а не YouTube.
  const set = (s: Partial<PlayerState>) => {
    if (st().engine === "audio") usePlayer.setState(s);
  };
  audio.addEventListener("play", () => set({ playing: true }));
  audio.addEventListener("pause", () => set({ playing: false }));
  audio.addEventListener("waiting", () => set({ loading: true }));
  audio.addEventListener("playing", () => {
    if (st().engine === "audio") markPlaying();
    set({ loading: false });
  });
  audio.addEventListener("canplay", () => set({ loading: false }));
  audio.addEventListener("timeupdate", () => set({ position: audio!.currentTime }));
  audio.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(audio!.duration)) set({ duration: audio!.duration });
  });
  audio.addEventListener("ended", () => {
    if (st().engine === "audio") st().next(true);
  });
  audio.addEventListener("error", () => {
    if (!audio!.src || st().engine !== "audio") return;
    const s = st();
    const track = s.queue[s.index];
    // Ссылки на превью Deezer подписаны и протухают (долгая пауза) — один раз берём свежую и продолжаем.
    if (track?.source === "deezer" && refreshedPreviewFor !== track.id) {
      refreshedPreviewFor = track.id;
      void load(track, { forcePreview: true, startAt: s.position, resume: true });
      return;
    }
    skipBroken("Этот трек не захотел вставать из могилы — включаю следующий");
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

interface LoadOptions {
  /** Играть 30-сек превью, даже если есть полная версия. */
  forcePreview?: boolean;
  /** С какой секунды начать (восстановление после перезагрузки, свежая ссылка на превью). */
  startAt?: number;
  /** false — только подготовить трек, не запуская (восстановление сессии). */
  resume?: boolean;
}

async function load(track: Track | undefined, opts: LoadOptions = {}) {
  const el = getAudio();
  if (!track) {
    el.pause();
    ytStop();
    return;
  }
  const { forcePreview = false, startAt = 0, resume = true } = opts;
  const token = ++loadToken;
  usePlayer.setState({
    loading: resume,
    position: startAt,
    duration: track.fullDuration ?? track.duration,
    error: null,
  });
  setMediaSession(track);
  ensureAnalyser();
  if (ctx?.state === "suspended") void ctx.resume();

  // Трек из YouTube Music играет напрямую; Deezer-трек сначала ищем там же.
  const videoId = track.source === "youtube" ? track.sourceId : forcePreview ? null : await resolveYouTube(track);
  if (token !== loadToken) return;
  if (videoId) {
    el.pause();
    usePlayer.setState({ engine: "youtube" });
    const { volume, muted } = st();
    await ytLoad(videoId, volume, muted, startAt);
    return;
  }

  ytStop();
  usePlayer.setState({ engine: "audio", duration: track.duration });
  try {
    const src = await resolveSrc(track);
    if (token !== loadToken) return; // пока грузили, пользователь уже переключил
    el.src = src;
    if (startAt > 0) el.addEventListener("loadedmetadata", () => (el.currentTime = startAt), { once: true });
    await el.play();
  } catch (e) {
    if (token !== loadToken) return;
    // Автоплей заблокирован браузером — это не ошибка трека, просто ждём клика.
    if (e instanceof DOMException && e.name === "NotAllowedError") {
      usePlayer.setState({ loading: false, playing: false });
      return;
    }
    if (e instanceof DOMException && e.name === "AbortError") return;
    skipBroken("Не получилось достать трек из склепа — включаю следующий");
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

/** Запомнить текущий трек, чтобы «назад» мог к нему вернуться. */
function pushHistory(s: PlayerState) {
  const id = s.queue[s.index]?.id;
  if (!id) return s.history;
  return [...s.history, id].slice(-50);
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
  history: [],

  playList: (tracks, start = 0) => {
    if (!tracks.length) return;
    failStreak = 0;
    set({ queue: tracks, index: start, history: [] });
    void load(tracks[start]);
  },

  playTrack: (track) => {
    const { queue, index } = get();
    const existing = queue.findIndex((t) => t.id === track.id);
    if (existing >= 0) return get().jumpTo(existing);
    const nextQueue = [...queue.slice(0, index + 1), track, ...queue.slice(index + 1)];
    set({ queue: nextQueue, index: index + 1, history: pushHistory(get()) });
    void load(track);
  },

  addToQueue: (track) => {
    const { queue, index } = get();
    if (queue.some((t) => t.id === track.id)) return;
    set({ queue: [...queue, track] });
    if (index < 0) get().jumpTo(0);
  },

  toggle: () => (get().playing ? get().pause() : get().play()),

  play: () => {
    const { index, queue, engine, position } = get();
    if (index < 0 || !queue[index]) return;
    if (engine === "youtube") return ytPlay();
    const el = getAudio();
    // Трек ещё не загружен (например, восстановлен после перезагрузки) — грузим с того же места.
    if (!el.src) return void load(queue[index], { startAt: position });
    if (ctx?.state === "suspended") void ctx.resume();
    void el.play().catch(() => {});
  },

  pause: () => {
    if (get().engine === "youtube") return ytPause();
    getAudio().pause();
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
      get().play();
      return;
    }
    set({ index: i, history: pushHistory(get()) });
    void load(get().queue[i]);
  },

  prev: () => {
    const s = get();
    if (s.position > 3) return get().seek(0);
    // В режиме перемешивания «назад» — к тому, что реально играло до этого.
    if (s.shuffle && s.history.length) {
      const history = [...s.history];
      const id = history.pop()!;
      const i = s.queue.findIndex((t) => t.id === id);
      if (i >= 0) {
        set({ index: i, history });
        void load(s.queue[i]);
        return;
      }
    }
    if (s.index <= 0) return get().seek(0);
    const i = s.index - 1;
    set({ index: i });
    void load(s.queue[i]);
  },

  seek: (seconds) => {
    if (get().engine === "youtube") {
      const t = Math.max(0, Math.min(seconds, get().duration || seconds));
      ytSeek(t);
      set({ position: t });
      return;
    }
    const el = getAudio();
    if (!el.src) return set({ position: Math.max(0, seconds) });
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
    set({ index, history: pushHistory(get()) });
    void load(track);
  },

  removeFromQueue: (i) => {
    const { queue, index } = get();
    if (i === index) return; // играющий трек не удаляем — для этого есть «дальше»
    set({ queue: queue.filter((_, k) => k !== i), index: i < index ? index - 1 : index });
  },

  clearError: () => set({ error: null }),
}));

/* ---------- сессия: очередь и место в треке переживают перезагрузку ---------- */

const SESSION_KEY = "lovesick-session";

interface Session {
  queue: Track[];
  index: number;
  position: number;
  shuffle: boolean;
  repeat: RepeatMode;
}

function saveSession() {
  const s = st();
  if (s.index < 0) return;
  const session: Session = {
    queue: s.queue.slice(0, 200),
    index: s.index,
    position: Math.floor(s.position),
    shuffle: s.shuffle,
    repeat: s.repeat,
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // память переполнена — сессию не сохраняем, это не критично
  }
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const s = JSON.parse(raw) as Session;
    const track = s.queue?.[s.index];
    if (!track) return;
    usePlayer.setState({
      queue: s.queue,
      index: s.index,
      position: s.position || 0,
      duration: track.fullDuration ?? track.duration,
      shuffle: !!s.shuffle,
      repeat: s.repeat ?? "off",
      engine: "audio",
      playing: false,
    });
    setMediaSession(track);
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
}

/** Вызывается один раз на клиенте: громкость, сессия, YouTube-события, кнопки на экране блокировки. */
export function initPlayer() {
  const el = getAudio();
  try {
    const saved = localStorage.getItem("lovesick-volume");
    const v = Number(saved);
    if (saved !== null && v >= 0 && v <= 1) {
      el.volume = v;
      usePlayer.setState({ volume: v });
    } else {
      el.volume = st().volume;
    }
  } catch {
    el.volume = st().volume;
  }

  restoreSession();
  // Сохраняем не чаще раза в 5 сек и обязательно при уходе со страницы.
  let lastSave = 0;
  usePlayer.subscribe((s, prev) => {
    const now = Date.now();
    const important = s.index !== prev.index || s.queue !== prev.queue || s.shuffle !== prev.shuffle || s.repeat !== prev.repeat;
    if (important || now - lastSave > 5000) {
      lastSave = now;
      saveSession();
    }
  });
  window.addEventListener("pagehide", saveSession);

  // События YouTube-плеера учитываем, только пока играет именно он.
  const yt = (s: Partial<PlayerState>) => {
    if (st().engine === "youtube") usePlayer.setState(s);
  };
  setYTHandlers({
    onState: (state) => {
      if (state === "playing") {
        if (st().engine === "youtube") markPlaying();
        yt({ playing: true, loading: false, error: null });
      } else if (state === "paused") yt({ playing: false, loading: false });
      else if (state === "buffering") yt({ loading: true });
      else if (state === "blocked") {
        // Браузер (чаще всего Safari на iPhone) не дал YouTube стартовать без нажатия.
        yt({ playing: false, loading: false, error: "Нажми ▶ — браузер не дал включить звук сам" });
      } else if (state === "ended" && st().engine === "youtube") st().next(true);
    },
    onTime: (position, duration) => yt(duration ? { position, duration } : { position }),
    // 101/150 — владелец запретил встраивание, 100 — видео удалено.
    onError: () => {
      const s = st();
      if (s.engine !== "youtube") return;
      // У трека из YouTube Music превью нет — просто идём дальше.
      if (s.queue[s.index]?.source === "youtube") {
        skipBroken("Это видео нельзя встроить — включаю следующий");
        return;
      }
      usePlayer.setState({ error: "Полная версия недоступна — включаю 30-секундное превью" });
      s.playPreviewInstead();
    },
  });

  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => st().play());
    navigator.mediaSession.setActionHandler("pause", () => st().pause());
    navigator.mediaSession.setActionHandler("nexttrack", () => st().next());
    navigator.mediaSession.setActionHandler("previoustrack", () => st().prev());
  }
}

export const currentTrack = (s: PlayerState) => s.queue[s.index] as Track | undefined;
