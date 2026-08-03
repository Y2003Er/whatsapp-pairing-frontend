import { Inbox, Plus } from "lucide-react";

export function Skeleton({ className = "", style }) {
  return <span className={`ui-skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function CardSkeleton({ rows = 3 }) {
  return <div className="skeleton-card" aria-label="Loading content" role="status"><Skeleton className="skeleton-title" />{Array.from({ length: rows }, (_, index) => <Skeleton className="skeleton-line" key={index} />)}</div>;
}

export function DashboardSkeleton({ cards = 3 }) {
  return <div className="dashboard-skeleton" role="status" aria-label="Loading dashboard">{Array.from({ length: cards }, (_, index) => <CardSkeleton key={index} rows={index === 0 ? 4 : 3} />)}</div>;
}

export function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction, className = "" }) {
  return <section className={`empty-state ${className}`} aria-live="polite">
    <span className="empty-state-icon"><Icon size={22} aria-hidden="true" /></span>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {actionLabel && onAction && <button type="button" className="empty-state-action" onClick={onAction}><Plus size={15} aria-hidden="true" />{actionLabel}</button>}
  </section>;
}
