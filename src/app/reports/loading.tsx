import { PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} columns={6} />
    </div>
  )
}
