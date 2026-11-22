import type { ReactNode } from 'react';

export function PendingPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pending-panel">
      <span className="badge badge-pending">Pendiente de integración</span>
      <h2>{title}</h2>
      <div className="panel-copy">{children}</div>
    </section>
  );
}
