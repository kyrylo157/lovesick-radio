import Link from "next/link";

export function Section({
  title,
  note,
  href,
  children,
}: {
  title: string;
  note?: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
          {note && <p className="mt-1 text-sm text-muted">{note}</p>}
        </div>
        {href && (
          <Link href={href} className="shrink-0 text-sm font-extrabold text-accent hover:underline">
            Все треки
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Заглушка, пока данные едут: серые «треки» в ряд. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mt-12 flex flex-col gap-2" aria-label="Загрузка" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 px-2 py-1.5">
          <div className="size-12 rounded-xl bg-surface-2" />
          <div className="flex-1">
            <div className="h-4 w-1/2 rounded-full bg-surface-2" />
            <div className="mt-2 h-3 w-1/4 rounded-full bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Пустой экран: зовёт к действию, а не грустит. */
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border-3 border-dashed border-surface-2 px-6 py-10 text-center text-muted">{children}</div>
  );
}
