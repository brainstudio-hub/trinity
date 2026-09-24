import { Skeleton } from "@/components/admin/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-label="Cargando">
      <Skeleton className="h-10 w-full max-w-md" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-5">
          <Skeleton className="h-4 w-1/3" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
