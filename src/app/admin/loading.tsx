import { PageHeaderSkeleton, StatsSkeleton, TableSkeleton } from "@/components/admin/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <StatsSkeleton />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <TableSkeleton rows={4} />
        <TableSkeleton rows={4} />
      </div>
    </div>
  );
}
