"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fmtTime } from "@/lib/format";
import { currentTrack, usePlayer } from "@/store/player";
import { BatEqualizer } from "./BatEqualizer";
import {
  CloseIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  QueueIcon,
  RepeatIcon,
  ShuffleIcon,
  VolumeIcon,
} from "./Icons";
import { LikeButton } from "./LikeButton";
import { Artwork, PreviewBadge } from "./TrackList";

function SeekBar({ className = "" }: { className?: string }) {
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const seek = usePlayer((s) => s.seek);
  const pct = duration ? (position / duration) * 100 : 0;
  return (
    <input
      type="range"
      min={0}
      max={duration || 1}
      step={0.1}
      value={position}
      onChange={(e) => seek(Number(e.target.value))}
      aria-label="Перемотка"
      aria-valuetext={`${fmtTime(position)} из ${fmtTime(duration)}`}
      className={`bone-range w-full ${className}`}
      style={{ "--fill": `${pct}%` } as React.CSSProperties}
    />
  );
}

function QueuePanel({ onClose }: { onClose: () => void }) {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const { jumpTo, removeFromQueue, toggleShuffle, cycleRepeat } = usePlayer.getState();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside
      aria-label="Очередь"
      className="sticker fixed bottom-[calc(var(--player-h)+64px+28px)] right-3 z-50 flex max-h-[60vh] w-[min(380px,calc(100vw-24px))] flex-col rounded-3xl bg-surface md:bottom-[calc(var(--player-h)+28px)]"
    >
      <header className="flex items-center justify-between gap-2 border-b-2 border-dashed border-surface-2 px-4 py-3">
        <h2 className="font-display text-2xl text-accent">Очередь</h2>
        {/* На телефоне в нижней панели нет места — перемешивание и повтор живут здесь */}
        <div className="ml-auto flex items-center gap-1 text-muted">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-pressed={shuffle}
            aria-label="Перемешать"
            className={`grid size-9 place-items-center rounded-full hover:bg-surface-2 ${shuffle ? "text-zombie" : ""}`}
          >
            <ShuffleIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={cycleRepeat}
            aria-label={repeat === "off" ? "Повтор выключен" : repeat === "all" ? "Повтор очереди" : "Повтор трека"}
            className={`grid size-9 place-items-center rounded-full hover:bg-surface-2 ${repeat !== "off" ? "text-zombie" : ""}`}
          >
            <RepeatIcon className="size-5" one={repeat === "one"} />
          </button>
          <button type="button" onClick={onClose} aria-label="Закрыть очередь" className="grid size-9 place-items-center rounded-full hover:bg-surface-2">
            <CloseIcon className="size-5" />
          </button>
        </div>
      </header>
      <ol className="overflow-y-auto p-2">
        {queue.map((t, i) => (
          <li
            key={t.id}
            className={`group flex items-center gap-3 rounded-2xl px-2 py-1.5 ${i === index ? "bg-surface-2" : "hover:bg-bg"}`}
          >
            <button type="button" onClick={() => jumpTo(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <Artwork src={t.artwork} alt="" className="size-10 shrink-0 rounded-lg border-2 border-outline" />
              <span className="min-w-0">
                <span className={`block truncate text-sm font-extrabold ${i === index ? "text-accent" : ""}`}>{t.title}</span>
                <span className="block truncate text-xs text-muted">{t.artist}</span>
              </span>
            </button>
            {i !== index && (
              <button
                type="button"
                onClick={() => removeFromQueue(i)}
                aria-label={`Убрать из очереди: ${t.title}`}
                // На телефоне наведения нет — крестик виден всегда
                className="rounded-full p-1 text-muted hover:text-fg md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
              >
                <CloseIcon className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ol>
    </aside>
  );
}

const ctrl = "grid place-items-center rounded-full transition-colors hover:text-fg disabled:opacity-40";

export function PlayerBar() {
  const track = usePlayer(currentTrack);
  const playing = usePlayer((s) => s.playing);
  const loading = usePlayer((s) => s.loading);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const error = usePlayer((s) => s.error);
  const engine = usePlayer((s) => s.engine);
  const p = usePlayer.getState();
  const [queueOpen, setQueueOpen] = useState(false);

  useEffect(() => {
    if (!error) return;
    // «Ничего не включается» — важное сообщение, держим дольше обычных подсказок
    const t = setTimeout(() => usePlayer.getState().clearError(), error.startsWith("Не получается") ? 10000 : 3500);
    return () => clearTimeout(t);
  }, [error]);

  if (!track) return null;

  const playBtn = (size: string) => (
    <button
      type="button"
      onClick={p.toggle}
      aria-label={playing ? "Пауза" : "Играть"}
      className={`sticker grid place-items-center rounded-full bg-accent text-ink transition-transform hover:scale-105 active:scale-95 ${size} ${
        loading ? "animate-pulse" : ""
      }`}
    >
      {playing ? <PauseIcon className="size-1/2" /> : <PlayIcon className="size-1/2" />}
    </button>
  );

  return (
    <>
      {error && (
        <div
          role="alert"
          className="sticker fixed bottom-[calc(var(--player-h)+72px)] left-1/2 z-50 -translate-x-1/2 rounded-full bg-rose px-4 py-2 text-sm font-extrabold text-bone md:bottom-[calc(var(--player-h)+12px)]"
        >
          {error}
        </div>
      )}
      {queueOpen && <QueuePanel onClose={() => setQueueOpen(false)} />}

      <section
        aria-label="Плеер"
        className="lace-top fixed inset-x-0 bottom-16 z-40 border-t-3 border-outline bg-surface/80 backdrop-blur-xl md:bottom-0"
        style={{ height: "var(--player-h)" }}
      >
        {/* мобильная перемотка: тянется пальцем по всей ширине над плеером */}
        <div className="absolute inset-x-3 top-1.5 md:hidden">
          <SeekBar className="bone-range-thin" />
        </div>

        <div className="mx-auto grid h-full max-w-[1600px] grid-cols-[1fr_auto] items-center gap-3 px-3 pt-2 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] md:gap-6 md:px-6">
          {/* трек */}
          <div className="flex min-w-0 items-center gap-3">
            <Artwork src={track.artwork} alt="" className="size-12 shrink-0 rounded-xl border-3 border-outline md:size-14" />
            <div className="min-w-0">
              <Link href={`/track/${track.id}`} className="block truncate font-extrabold hover:underline">
                {track.title}
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted">
                <span className="truncate">{track.artist}</span>
                {!track.full && engine === "audio" && <PreviewBadge force />}
              </div>
            </div>
            <LikeButton track={track} className="hidden sm:grid" />
          </div>

          {/* мобильные кнопки */}
          <div className="flex items-center gap-1 md:hidden">
            <button type="button" onClick={p.prev} aria-label="Предыдущий" className={`${ctrl} size-9 text-muted`}>
              <PrevIcon className="size-5" />
            </button>
            {playBtn("size-11")}
            <button type="button" onClick={() => p.next()} aria-label="Следующий" className={`${ctrl} size-9 text-muted`}>
              <NextIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setQueueOpen((o) => !o)}
              aria-expanded={queueOpen}
              aria-label="Очередь"
              className={`${ctrl} size-9 ${queueOpen ? "text-accent" : "text-muted"}`}
            >
              <QueueIcon className="size-5" />
            </button>
          </div>

          {/* центр: управление */}
          <div className="hidden flex-col items-center gap-1.5 md:flex">
            <div className="flex items-center gap-4 text-muted">
              <button
                type="button"
                onClick={p.toggleShuffle}
                aria-pressed={shuffle}
                aria-label="Перемешать"
                className={`${ctrl} size-9 ${shuffle ? "text-zombie" : ""}`}
              >
                <ShuffleIcon className="size-5" />
              </button>
              <button type="button" onClick={p.prev} aria-label="Предыдущий" className={`${ctrl} size-9`}>
                <PrevIcon className="size-6" />
              </button>
              {playBtn("size-12")}
              <button type="button" onClick={() => p.next()} aria-label="Следующий" className={`${ctrl} size-9`}>
                <NextIcon className="size-6" />
              </button>
              <button
                type="button"
                onClick={p.cycleRepeat}
                aria-label={repeat === "off" ? "Повтор выключен" : repeat === "all" ? "Повтор очереди" : "Повтор трека"}
                className={`${ctrl} size-9 ${repeat !== "off" ? "text-zombie" : ""}`}
              >
                <RepeatIcon className="size-5" one={repeat === "one"} />
              </button>
            </div>
            <div className="flex w-full max-w-xl items-center gap-3 text-xs tabular-nums text-muted">
              <span className="w-10 text-right">{fmtTime(position)}</span>
              <SeekBar />
              <span className="w-10">{fmtTime(duration)}</span>
            </div>
          </div>

          {/* справа */}
          <div className="hidden items-center justify-end gap-3 text-muted md:flex">
            <BatEqualizer className={playing ? "" : "opacity-30"} />
            <button
              type="button"
              onClick={() => setQueueOpen((o) => !o)}
              aria-expanded={queueOpen}
              aria-label="Очередь"
              className={`${ctrl} size-9 ${queueOpen ? "text-accent" : ""}`}
            >
              <QueueIcon className="size-5" />
            </button>
            <button type="button" onClick={p.toggleMute} aria-label={muted ? "Включить звук" : "Выключить звук"} className={`${ctrl} size-9`}>
              <VolumeIcon className="size-5" muted={muted || volume === 0} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => p.setVolume(Number(e.target.value))}
              aria-label="Громкость"
              className="bone-range w-24"
              style={{ "--fill": `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
            />
          </div>
        </div>
      </section>
    </>
  );
}
