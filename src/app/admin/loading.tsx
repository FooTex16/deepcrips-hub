import { Skeleton } from "@/components/ui/states";

/**
 * Fallback Suspense untuk semua rute /admin — sidebar tetap terlihat,
 * hanya area konten yang menampilkan kerangka. Memberikan umpan balik
 * instan saat berpindah menu meski jaringan lambat.
 */
export default function AdminLoading() {
  return (
    <div
      className="animate-fade-in space-y-5"
      role="status"
      aria-label="Memuat halaman admin"
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-56 rounded-lg" />
        <Skeleton className="h-4 w-80 max-w-full rounded" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-3 p-5">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="card space-y-3 p-5">
        <Skeleton className="h-9 w-full max-w-md rounded-xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>

      <span className="sr-only">Memuat…</span>
    </div>
  );
}
