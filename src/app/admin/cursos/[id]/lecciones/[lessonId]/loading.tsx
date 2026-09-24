import { Skeleton } from "@/components/admin/skeletons";

export default function Loading() {
  return (
    <div role="status" aria-label="Cargando lección">
      <Skeleton className="mb-6 h-4 w-40" />
      <div className="mb-8 flex items-start gap-4">
        <Skeleton className="size-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
