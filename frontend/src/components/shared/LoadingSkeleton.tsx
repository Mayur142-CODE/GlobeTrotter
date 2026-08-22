import { cn } from '@/lib/utils';

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-midnight/8', className)}
      aria-hidden
    />
  );
}

export function TripCardSkeleton() {
  return (
    <div className="boarding-pass p-5">
      <div className="flex justify-between mb-4">
        <LoadingSkeleton className="h-4 w-20" />
        <LoadingSkeleton className="h-4 w-16" />
      </div>
      <LoadingSkeleton className="h-6 w-3/4 mb-2" />
      <LoadingSkeleton className="h-4 w-full mb-4" />
      <div className="border-t border-dashed border-parchment-300 pt-4 flex justify-between">
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="h-4 w-20" />
        <LoadingSkeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

export function CityCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-parchment-300/60 shadow-paper">
      <LoadingSkeleton className="h-40 w-full" />
      <div className="p-4">
        <LoadingSkeleton className="h-5 w-2/3 mb-2" />
        <LoadingSkeleton className="h-4 w-1/2 mb-3" />
        <LoadingSkeleton className="h-9 w-full" />
      </div>
    </div>
  );
}

export function ActivityCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-parchment-300/60 shadow-paper flex">
      <LoadingSkeleton className="h-24 w-24 shrink-0" />
      <div className="p-3 flex-1">
        <LoadingSkeleton className="h-4 w-3/4 mb-2" />
        <LoadingSkeleton className="h-3 w-full mb-2" />
        <LoadingSkeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
