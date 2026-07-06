import React from 'react';
import { Upload } from 'lucide-react';

export default function AuditTab({
  selectedSystem,
  handleDownloadAuditLog
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Assessor Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-1">Chronological record of scoping updates, evidence changes, reviewer decisions, and risk approvals.</p>
        </div>
        <button
          onClick={handleDownloadAuditLog}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-650 hover:bg-blue-600 border border-blue-500/30 text-xs font-semibold rounded text-slate-200 hover:text-white transition-all uppercase tracking-wider"
        >
          <Upload size={12} className="rotate-180" /> Export CSV
        </button>
      </div>

      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        {selectedSystem.auditLogs && selectedSystem.auditLogs.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Author</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">Notes / Comment</th>
              </tr>
            </thead>
            <tbody>
              {selectedSystem.auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-850 hover:bg-slate-900/40 text-slate-300">
                  <td className="p-4 font-mono text-[10px] text-slate-555">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 font-bold text-slate-200">{log.userId}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400' :
                      log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-400' :
                      log.action === 'DELETE' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-slate-450">{log.entityType}</td>
                  <td className="p-4 font-semibold italic text-slate-300">{log.comment || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-slate-500 italic">
            No change events recorded in system scope.
          </div>
        )}
      </div>
    </div>
  );
}
