import React from 'react';
import Modal from '../shared/Modal';

export default function RemediationModal({
  isOpen,
  onClose,
  selectedReqId,
  remediationForm,
  setRemediationForm,
  onSubmit
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Create Remediation Task (${selectedReqId})`} maxWidth="max-w-md">
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs text-slate-200">
        <div>
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Task Title</label>
          <input 
            type="text" 
            value={remediationForm.title} 
            data-testid="remediation-input-title"
            onChange={(e) => setRemediationForm({ ...remediationForm, title: e.target.value })}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none animate-none"
            placeholder="e.g. Set up Entra JIT for Global Admins"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Description</label>
          <textarea 
            value={remediationForm.description} 
            data-testid="remediation-input-description"
            onChange={(e) => setRemediationForm({ ...remediationForm, description: e.target.value })}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 h-16 focus:outline-none animate-none"
            placeholder="Detail work scope required to meet compliance target..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Assigned To</label>
            <input 
              type="text" 
              value={remediationForm.assignedTo} 
              data-testid="remediation-input-assignedTo"
              onChange={(e) => setRemediationForm({ ...remediationForm, assignedTo: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none animate-none"
              placeholder="DevOps Team / Eng Name"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Due Date</label>
            <input 
              type="date" 
              value={remediationForm.dueDate} 
              data-testid="remediation-input-dueDate"
              onChange={(e) => setRemediationForm({ ...remediationForm, dueDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-850 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none animate-none"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Ticket Reference Link</label>
          <input 
            type="text" 
            value={remediationForm.ticketLink} 
            data-testid="remediation-input-ticketLink"
            onChange={(e) => setRemediationForm({ ...remediationForm, ticketLink: e.target.value })}
            className="w-full bg-slate-950 border border-slate-850 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none animate-none"
            placeholder="e.g. https://jira.internal/browse/SEC-102"
          />
        </div>
        <button 
          type="submit"
          data-testid="remediation-submit"
          className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white rounded transition-colors uppercase tracking-wider"
        >
          Log Remediation Action
        </button>
      </form>
    </Modal>
  );
}
