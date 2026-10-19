"use client";

import Link from "next/link";
import { ZombieKid } from "@/components/Mascots";

/** Если что-то упало при отрисовке страницы — вместо белого экрана Next.js показываем свой. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
      <ZombieKid className="w-40 -rotate-6" />
      <h1 className="mt-6 font-display text-5xl text-accent [text-shadow:3px_3px_0_var(--outline)]">Ой, кость сломалась</h1>
      <p className="mt-2 font-bold">Что-то пошло не так. Обычно помогает попробовать ещё раз.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="sticker rounded-full bg-accent px-5 py-2 font-extrabold text-ink">
          Попробовать ещё раз
        </button>
        <Link href="/" className="rounded-full border-3 border-outline bg-bone px-5 py-2 font-extrabold text-ink">
          На главную
        </Link>
      </div>
    </div>
  );
}
