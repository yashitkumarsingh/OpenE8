import React from 'react';
import RiskBadge from '../shared/RiskBadge';

export default function ExceptionsTab({
  exceptions,
  selectedSystem,
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Exceptions Register</h2>
          <p className="text-xs text-slate-400 mt-1">Formal exceptions, documented compensating controls, residual risk logs, and audit trails.</p>
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              <th className="p-4">Req ID</th>
              <th className="p-4">Risk Statement</th>
              <th className="p-4">Compensating Control</th>
              <th className="p-4">Approved By</th>
              <th className="p-4">Residual Risk</th>
              <th className="p-4">Expiry Date</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {exceptions.length > 0 ? (
              exceptions.map(ex => (
                <tr key={ex.id} className="border-b border-slate-800 hover:bg-slate-900/35 transition-colors">
                  <td className="p-4 font-bold text-blue-400">{ex.requirementId}</td>
                  <td className="p-4 text-slate-300 max-w-xs truncate">{ex.riskStatement}</td>
                  <td className="p-4 text-slate-300 max-w-xs truncate">{ex.compensatingControl}</td>
                  <td className="p-4 text-slate-400 font-semibold">{ex.approvedBy}</td>
                  <td className="p-4"><RiskBadge risk={ex.residualRisk} /></td>
                  <td className="p-4 text-slate-500">{new Date(ex.expiryDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">{ex.status}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500 italic">No formal exceptions registered for this system.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
