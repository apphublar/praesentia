export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="page-skeleton" aria-hidden="true">
      <div className="page-skeleton-header">
        <div className="page-skeleton-line page-skeleton-line-sm" />
        <div className="page-skeleton-line page-skeleton-line-lg" />
      </div>
      <div className="page-skeleton-grid">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="page-skeleton-card" />
        ))}
      </div>
    </div>
  );
}

export function EventAdminSkeleton() {
  return (
    <div className="event-admin-skeleton" aria-hidden="true">
      <div className="event-admin-skeleton-header">
        <div className="page-skeleton-line page-skeleton-line-md" />
        <div className="page-skeleton-tabs">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="page-skeleton-tab" />
          ))}
        </div>
      </div>
      <div className="event-admin-skeleton-body">
        <div className="page-skeleton-card page-skeleton-card-tall" />
        <div className="page-skeleton-card page-skeleton-card-tall" />
      </div>
    </div>
  );
}
