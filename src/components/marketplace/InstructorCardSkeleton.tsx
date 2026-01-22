import { Skeleton } from "@/components/ui/skeleton";

const InstructorCardSkeleton = () => {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 md:p-6">
      <div className="flex flex-col md:flex-row gap-5 md:gap-6">
        {/* Left Area - Photo & Badges */}
        <div className="flex md:flex-col items-center gap-3 md:gap-3">
          <Skeleton className="w-18 h-18 md:w-22 md:h-22 rounded-2xl" />
          <div className="flex md:flex-col gap-1.5 md:mt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>

        {/* Center Area - Info */}
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-56" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>

        {/* Right Area - Price & Actions */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-border/50 md:min-w-[150px]">
          <div className="flex flex-col items-start md:items-end gap-1">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex md:flex-col gap-2 w-full md:w-auto md:mt-3">
            <Skeleton className="h-9 w-24 flex-1 md:flex-none" />
            <Skeleton className="h-9 w-28 flex-1 md:flex-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorCardSkeleton;
