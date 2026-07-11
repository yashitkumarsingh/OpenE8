import React from 'react';
import Modal from '../shared/Modal';

export default function EvidenceModal({
  isOpen,
  onClose,
  evidenceForm,
  setEvidenceForm,
  handleFileChange,
  onSubmit
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Evidence File" maxWidth="max-w-md">
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs text-slate-200">
        <div>
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Evidence Name</label>
          <input 
            type="text" 
            value={evidenceForm.name} 
            onChange={(e) => setEvidenceForm({ ...evidenceForm, name: e.target.value })}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            placeholder="e.g. Entra CA Policy Screenshot"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Type</label>
            <select 
              value={evidenceForm.type} 
              onChange={(e) => setEvidenceForm({ ...evidenceForm, type: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
            >
              <option value="FILE">File / Document</option>
              <option value="API_EXPORT">API Export JSON/CSV</option>
              <option value="SCRIPT_OUTPUT">Script Output</option>
              <option value="ATTESTATION">Attestation</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Confidence</label>
            <select 
              value={evidenceForm.confidenceLevel} 
              onChange={(e) => setEvidenceForm({ ...evidenceForm, confidenceLevel: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Quality</label>
            <select 
              value={evidenceForm.qualityScore} 
              onChange={(e) => setEvidenceForm({ ...evidenceForm, qualityScore: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
            >
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Owner</label>
            <input 
              type="text" 
              value={evidenceForm.owner} 
              onChange={(e) => setEvidenceForm({ ...evidenceForm, owner: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
              placeholder="e.g. SecOps Lead"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Source System</label>
            <input 
              type="text" 
              value={evidenceForm.sourceSystem} 
              onChange={(e) => setEvidenceForm({ ...evidenceForm, sourceSystem: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
              placeholder="e.g. Entra ID / Sentinel"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Select File</label>
          <input 
            type="file" 
            onChange={handleFileChange}
            className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-350 hover:file:bg-slate-700"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Notes / Expiry details</label>
          <textarea 
            value={evidenceForm.notes} 
            onChange={(e) => setEvidenceForm({ ...evidenceForm, notes: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 h-16 focus:outline-none"
            placeholder="Additional descriptions..."
          />
        </div>

        <button 
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded transition-colors uppercase tracking-wider"
        >
          Upload Evidence
        </button>
      </form>
    </Modal>
  );
}
