import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden w-64 shrink-0 bg-sidebar lg:flex lg:flex-col">
        <div className="p-3 py-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="px-3 pb-3">
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="flex-1 space-y-2 px-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <div className="border-t border-sidebar-border p-3">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="mt-8 h-6 w-40" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
