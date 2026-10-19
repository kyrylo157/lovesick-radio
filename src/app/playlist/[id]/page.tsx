import { Suspense } from "react";
import { PlaylistView } from "@/components/PlaylistView";
import { ListSkeleton } from "@/components/Section";

// Плейлисты лежат в браузере, поэтому сама страница — клиентская; params читаем внутри Suspense.
export default function PlaylistPage({ params }: PageProps<"/playlist/[id]">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <PlaylistView params={params} />
    </Suspense>
  );
}
