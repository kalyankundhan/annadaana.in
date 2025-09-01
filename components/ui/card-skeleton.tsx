import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <Skeleton className="h-40 w-full rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-full mt-2" />
      </div>
    </div>
  );
}
