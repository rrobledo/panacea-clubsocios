import { Clock } from 'lucide-react';
import { Skeleton, EmptyState, ErrorState } from '../ui';
import { Timeline } from './Timeline';

export const ActivitySection = ({ activity, loading, error, onRetry }) => (
  <section id="rw-activity" className="rw-section" aria-labelledby="rw-activity-heading">
    <h2 id="rw-activity-heading" className="rw-section-title">Actividad reciente</h2>

    {loading ? (
      <div className="rw-card rw-activity-skeleton">
        <div className="rw-card-body">
          <Skeleton height={16} width="40%" style={{ marginBottom: 12 }} />
          <Skeleton height={14} width="90%" style={{ marginBottom: 8 }} />
          <Skeleton height={14} width="70%" />
        </div>
      </div>
    ) : error ? (
      <ErrorState message="No pudimos cargar tu actividad." onRetry={onRetry} />
    ) : activity.length === 0 ? (
      <EmptyState icon={Clock} title="Todavía no hay actividad." />
    ) : (
      <div className="rw-card">
        <div className="rw-card-body">
          <Timeline entries={activity} />
        </div>
      </div>
    )}
  </section>
);
