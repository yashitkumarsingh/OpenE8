import React from 'react';
import Modal from '../shared/Modal';

export default function ExceptionModal({
  isOpen,
  onClose,
  exceptionForm,
  setExceptionForm,
  onSubmit
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Exception Request" maxWidth="max-w-lg">
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs text-slate-200">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Requirement ID</label>
            <input 
              type="text" 
              value={exceptionForm.requirementId} 
              disabled
              className="w-full bg-slate-900/50 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-400 cursor-not-allowed focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Duration Class</label>
            <select 
              value={exceptionForm.temporaryOrPermanent} 
              data-testid="exception-input-temporaryOrPermanent"
              onChange={(e) => setExceptionForm({ ...exceptionForm, temporaryOrPermanent: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
            >
              <option value="TEMPORARY">Temporary (Time-bound)</option>
              <option value="PERMANENT">Permanent (Continuous Exception)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Risk Statement / Exposure Description</label>
          <textarea 
            value={exceptionForm.riskStatement} 
            data-testid="exception-input-riskStatement"
            onChange={(e) => setExceptionForm({ ...exceptionForm, riskStatement: e.target.value })}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 h-14 focus:outline-none"
            placeholder="Describe the risk exposure (e.g. legacy system unable to parse modern MFA tokens)..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Compensating Control</label>
            <input 
              type="text" 
              value={exceptionForm.compensatingControl} 
              data-testid="exception-input-compensatingControl"
              onChange={(e) => setExceptionForm({ ...exceptionForm, compensatingControl: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
              placeholder="e.g. Strict IP whitelist & jump host"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Compensating Control Efficacy</label>
            <select 
              value={exceptionForm.compensatingControlEfficacy} 
              data-testid="exception-input-compensatingControlEfficacy"
              onChange={(e) => setExceptionForm({ ...exceptionForm, compensatingControlEfficacy: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
            >
              <option value="HIGH">High Effectiveness</option>
              <option value="MEDIUM">Medium Effectiveness</option>
              <option value="LOW">Low Effectiveness</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Residual Risk Rating</label>
            <select 
              value={exceptionForm.residualRisk} 
              data-testid="exception-input-residualRisk"
              onChange={(e) => setExceptionForm({ ...exceptionForm, residualRisk: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="EXTREME">EXTREME</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Affected Scope Count (Users/Hosts)</label>
            <input 
              type="number" 
              value={exceptionForm.affectedUserCount} 
              onChange={(e) => setExceptionForm({ ...exceptionForm, affectedUserCount: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
              placeholder="e.g. 50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Next Review Date</label>
            <input 
              type="date" 
              value={exceptionForm.reviewDate} 
              data-testid="exception-input-reviewDate"
              onChange={(e) => setExceptionForm({ ...exceptionForm, reviewDate: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Expiry Date</label>
            <input 
              type="date" 
              value={exceptionForm.expiryDate} 
              data-testid="exception-input-expiryDate"
              onChange={(e) => setExceptionForm({ ...exceptionForm, expiryDate: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Approved By (Assessor Name)</label>
            <input 
              type="text" 
              value={exceptionForm.approvedBy} 
              data-testid="exception-input-approvedBy"
              onChange={(e) => setExceptionForm({ ...exceptionForm, approvedBy: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
              placeholder="CISO Office Assessor"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Formal Risk Owner (Accepted By)</label>
            <input 
              type="text" 
              value={exceptionForm.riskAcceptedBy} 
              data-testid="exception-input-riskAcceptedBy"
              onChange={(e) => setExceptionForm({ ...exceptionForm, riskAcceptedBy: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
              placeholder="e.g. Chief Information Officer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Next Review Owner</label>
            <input 
              type="text" 
              value={exceptionForm.nextReviewOwner} 
              data-testid="exception-input-nextReviewOwner"
              onChange={(e) => setExceptionForm({ ...exceptionForm, nextReviewOwner: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
              placeholder="e.g. Head of Cybersecurity"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Approval Reason & Assessor Rationale</label>
          <textarea 
            value={exceptionForm.approvalReason} 
            data-testid="exception-input-approvalReason"
            onChange={(e) => setExceptionForm({ ...exceptionForm, approvalReason: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 h-16 focus:outline-none"
            placeholder="Document detailed rationale for accepting this gap..."
          />
        </div>

        <button 
          type="submit"
          data-testid="exception-submit"
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded transition-colors uppercase tracking-wider"
        >
          Request and Seal Exception
        </button>
      </form>
    </Modal>
  );
}
