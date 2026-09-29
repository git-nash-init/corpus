export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} style={style} />;
}

export function StatSkeleton() {
  return (
    <div className="panel p-6" role="status" aria-label="Loading">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-9 w-40" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="panel p-6" role="status" aria-label="Loading">
      <Skeleton className="h-3 w-48" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" style={{ opacity: 1 - i * 0.12 }} />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-10 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton />
    </div>
  );
}
