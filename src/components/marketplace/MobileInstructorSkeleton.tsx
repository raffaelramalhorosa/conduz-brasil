import { Skeleton } from "@/components/ui/skeleton";

const MobileInstructorSkeleton = () => {
  return (
    <div className="flex gap-3 p-4 border-b border-border/40">
      <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="shrink-0 space-y-1">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-5 w-14" />
      </div>
    </div>
  );
};

export default MobileInstructorSkeleton;
