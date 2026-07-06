import React from 'react';
import RiskBadge from '../shared/RiskBadge';

export default function ExceptionCard({ exception, onDelete, isCompleted }) {
  return (
    <div className="p-4 rounded-xl bg-slate-900/65 border border-slate-800 space-y-3.5 text-xs text-slate-200">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[9px] font-extrabold text-amber-500 block mb-1">
            EXCEPTION {exception.temporaryOrPermanent ? `(${exception.temporaryOrPermanent})` : ''}
          </span>
          <span className="font-bold text-slate-300">Compensating Control:</span>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge risk={exception.residualRisk} />
          {exception.compensatingControlEfficacy && (
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
              exception.compensatingControlEfficacy === 'HIGH' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              exception.compensatingControlEfficacy === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              'bg-rose-500/10 text-rose-455 border-rose-500/20'
            }`}>
              Efficacy: {exception.compensatingControlEfficacy}
            </span>
          )}
        </div>
      </div>
      
      <p className="text-[11px] text-slate-400 italic">"{exception.compensatingControl}"</p>
      
      {exception.riskStatement && (
        <div>
          <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Risk Statement</span>
          <p className="text-[11px] text-slate-450 leading-relaxed">{exception.riskStatement}</p>
        </div>
      )}

      {exception.approvalReason && (
        <div className="bg-slate-950/40 p-2.5 rounded border border-slate-850">
          <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">Assessor Rationale</span>
          <p className="text-[10.5px] text-slate-400 leading-normal">{exception.approvalReason}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-[10px] text-slate-500 border-t border-slate-850 pt-2.5 mt-2">
        <div>
          <span className="block text-[8px] uppercase tracking-wider text-slate-600">Approved By</span>
          <span className="text-slate-400 font-semibold">{exception.approvedBy || 'CISO Office'}</span>
        </div>
        <div>
          <span className="block text-[8px] uppercase tracking-wider text-slate-600">Risk Accepted By</span>
          <span className="text-slate-400 font-semibold">{exception.riskAcceptedBy || '—'}</span>
        </div>
        <div>
          <span className="block text-[8px] uppercase tracking-wider text-slate-600">Expiry Date</span>
          <span className="text-slate-400 font-semibold">{new Date(exception.expiryDate).toLocaleDateString()}</span>
        </div>
        
        {exception.affectedUserCount !== null && exception.affectedUserCount !== undefined && (
          <div>
            <span className="block text-[8px] uppercase tracking-wider text-slate-600">Affected Scope</span>
            <span className="text-slate-400 font-semibold">{exception.affectedUserCount} Users/Hosts</span>
          </div>
        )}
        {exception.nextReviewOwner && (
          <div>
            <span className="block text-[8px] uppercase tracking-wider text-slate-600">Next Review Owner</span>
            <span className="text-slate-400 font-semibold">{exception.nextReviewOwner}</span>
          </div>
        )}
        <div>
          <span className="block text-[8px] uppercase tracking-wider text-slate-600">Status</span>
          <span className="text-amber-500 font-bold uppercase">{exception.status}</span>
        </div>
      </div>
      
      {!isCompleted && onDelete && (
        <div className="flex justify-end pt-1">
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to revoke/delete exception for requirement ${exception.requirementId}?`)) {
                onDelete(exception.id);
              }
            }}
            className="text-[10px] text-rose-455 hover:text-rose-400 hover:underline font-bold"
          >
            Revoke / Delete Exception
          </button>
        </div>
      )}
    </div>
  );
}
