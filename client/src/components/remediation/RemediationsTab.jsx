import React from 'react';
import KanbanBoard from './KanbanBoard';

export default function RemediationsTab({
  remediations,
  onUpdateStatus,
  user,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-wide">Remediation Board</h2>
        <p className="text-xs text-slate-400 mt-1">Track gaps identified during assessments and manage tasks towards maturity uplift.</p>
      </div>
      <KanbanBoard remediations={remediations} onUpdateStatus={onUpdateStatus} user={user} />
    </div>
  );
}
