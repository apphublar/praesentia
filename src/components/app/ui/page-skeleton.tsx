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

export function AlbumSkeleton() {
  return (
    <div className="album-skeleton" aria-hidden="true">
      <div className="album-skeleton-header">
        <div className="album-skeleton-title">
          <div className="page-skeleton-line page-skeleton-line-sm" style={{ width: 180 }} />
          <div className="page-skeleton-line page-skeleton-line-lg" style={{ width: 280 }} />
          <div className="page-skeleton-line" style={{ width: 420, height: 14 }} />
        </div>
        <div className="album-skeleton-pricing" />
      </div>
      <div className="album-skeleton-steps">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="album-skeleton-step" />
        ))}
      </div>
      <div className="album-skeleton-panel">
        <div className="album-skeleton-toolbar">
          <div className="page-skeleton-line" style={{ width: 200, height: 36 }} />
          <div className="page-skeleton-line" style={{ width: 120, height: 36 }} />
        </div>
        <div className="album-skeleton-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="album-skeleton-thumb" />
          ))}
        </div>
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
