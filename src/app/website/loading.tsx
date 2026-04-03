export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 animate-pulse bg-muted/30 rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-8 animate-pulse bg-muted/30 rounded" />
            <div className="h-8 w-8 animate-pulse bg-muted/30 rounded" />
          </div>
        </div>

        {/* Hero Section Skeleton */}
        <div className="text-center py-16 mb-8">
          <div className="h-12 w-96 mx-auto animate-pulse bg-muted/30 rounded mb-4" />
          <div className="h-6 w-128 mx-auto animate-pulse bg-muted/30 rounded mb-8" />
          <div className="h-10 w-32 mx-auto animate-pulse bg-muted/30 rounded" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-8">
          <div className="flex gap-4 flex-1">
            <div className="h-9 w-64 animate-pulse bg-muted/30 rounded" />
            <div className="h-9 w-48 animate-pulse bg-muted/30 rounded" />
            <div className="h-9 w-48 animate-pulse bg-muted/30 rounded" />
            <div className="h-9 w-48 animate-pulse bg-muted/30 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-9 animate-pulse bg-muted/30 rounded" />
            <div className="h-9 w-9 animate-pulse bg-muted/30 rounded" />
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-80 rounded-2xl animate-pulse bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  )
}