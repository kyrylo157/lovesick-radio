import Link from "next/link";
import { ZombieKid } from "@/components/Mascots";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
      <ZombieKid className="w-40" />
      <h1 className="mt-6 font-display text-5xl text-accent [text-shadow:3px_3px_0_var(--outline)]">404</h1>
      <p className="mt-2 font-bold">Этой страницы нет — даже среди мёртвых.</p>
      <Link href="/" className="sticker mt-6 rounded-full bg-accent px-5 py-2 font-extrabold text-ink">
        На главную
      </Link>
    </div>
  );
}
