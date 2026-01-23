import { Skeleton } from '@/components/ui/skeleton';

export function InstrutorCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-full bg-zinc-800" />
          <div>
            <Skeleton className="h-5 w-32 mb-2 bg-zinc-800" />
            <Skeleton className="h-4 w-48 bg-zinc-800" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded bg-zinc-800" />
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-24 bg-zinc-800" />
        <Skeleton className="h-4 w-32 bg-zinc-800" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-zinc-800/50 rounded-lg">
        {[1, 2, 3].map(i => (
          <div key={i} className="text-center">
            <Skeleton className="h-3 w-10 mx-auto mb-2 bg-zinc-700" />
            <Skeleton className="h-6 w-8 mx-auto bg-zinc-700" />
          </div>
        ))}
      </div>

      {/* Vehicles */}
      <div className="mb-4">
        <Skeleton className="h-4 w-28 mb-2 bg-zinc-800" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-32 rounded bg-zinc-800" />
          <Skeleton className="h-6 w-28 rounded bg-zinc-800" />
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        <Skeleton className="h-4 w-32 bg-zinc-800" />
        <Skeleton className="h-5 w-10 rounded-full bg-zinc-800" />
      </div>
    </div>
  );
}
