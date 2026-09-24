import { PageHeaderSkeleton, TableSkeleton } from "@/components/admin/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton rows={5} />
    </div>
  );
}
