import { Skeleton } from "@/components/ui/skeleton";

const InstructorCardSkeleton = () => {
  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Left Area */}
        <div className="flex md:flex-col items-center gap-3 md:gap-2">
          <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-full" />
          <div className="flex md:flex-col gap-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>

        {/* Center Area */}
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-14" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>

        {/* Right Area */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-border">
          <div className="space-y-1">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex md:flex-col gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorCardSkeleton;
