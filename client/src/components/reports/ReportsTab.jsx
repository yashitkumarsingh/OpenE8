import React from 'react';
import { FileText, Clipboard, Printer, CheckCircle2 } from 'lucide-react';
import RiskBadge from '../shared/RiskBadge';

export default function ReportsTab({
  reportData,
  selectedSystem,
  exceptions,
  remediations,
  activeAssessment,
  onCopyMarkdown
}) {
  if (!reportData) return null;

  const handlePrint = () => {
    window.print();
  };

  const getSignatureBlock = (roleName, signature, date) => {
    return (
      <div className="p-4 rounded border border-slate-800 bg-slate-900/50 print:bg-white print:border-slate-300 print:text-black">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold print:text-slate-650">{roleName}</p>
        {signature ? (
          <div className="mt-2 space-y-1">
            <div className="font-mono text-xs italic text-slate-350 print:text-slate-800 font-bold">"{signature}"</div>
            <div className="text-[9px] text-slate-500 print:text-slate-600">Signed: {new Date(date).toLocaleString()}</div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic mt-2">Not signed (Pending Review)</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl text-xs text-slate-200">
      
      {/* HUB HEADER (Hidden on print) */}
      <div className="flex justify-between items-center border-b border-slate-850 pb-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Governance Reporting Hub</h2>
          <p className="text-xs text-slate-400 mt-1">Exportable markdown summaries, compliance matrices, and assessment details ready for board submission.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onCopyMarkdown}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold rounded text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Clipboard size={14} /> Copy Markdown
          </button>
          <button 
            onClick={handlePrint}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded text-white transition-colors flex items-center gap-1.5"
          >
            <Printer size={14} /> Print Report (PDF)
          </button>
        </div>
      </div>

      {/* PRINT-ONLY HEADER (Visible on print) */}
      <div className="hidden print:block mb-8 text-black bg-white">
        <div className="border-b-4 border-slate-900 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">ASD Essential Eight Governance Report</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">OpenE8 Governance OS Generated Summary</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold">{selectedSystem.name}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* REPORT CONTENT BODY */}
      <div className="glass-panel p-8 rounded-xl border border-slate-800 bg-slate-900/20 shadow-xl prose prose-invert max-w-none text-xs leading-relaxed space-y-6 print:bg-white print:border-none print:shadow-none print:text-black print:p-0">
        
        {/* Cover Block */}
        <div className="print:text-black">
          <h2 className="text-xl font-extrabold text-white mb-2 print:text-black print:text-lg">Governance Overview</h2>
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800 my-4 text-xs print:bg-slate-100 print:border-slate-300 print:text-black">
            <div>
              <p className="text-slate-400 print:text-slate-650 font-semibold">System Scope Boundary: <span className="text-white print:text-black font-bold">{selectedSystem.name}</span></p>
              <p className="text-slate-400 print:text-slate-650 mt-1">Target Maturity Level: <span className="text-blue-400 print:text-blue-700 font-bold">{reportData.maturity.targetMaturity}</span></p>
            </div>
            <div>
              <p className="text-slate-400 print:text-slate-650">Calculated Maturity Level: <span className="text-emerald-400 print:text-emerald-700 font-bold">{reportData.maturity.overallMaturity}</span></p>
              <p className="text-slate-400 print:text-slate-650 mt-1">Generated Timestamp: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Section 1: Scope Boundary Details */}
        <div className="space-y-4 print:text-black">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 print:text-black print:border-slate-300">1. Scope Boundary Details</h3>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            <span className="text-slate-400 print:text-slate-600 font-bold">Business Owner:</span>
            <span className="font-semibold">{selectedSystem.businessOwner}</span>
            
            <span className="text-slate-400 print:text-slate-600 font-bold">Technical Owner:</span>
            <span className="font-semibold">{selectedSystem.technicalOwner}</span>
            
            <span className="text-slate-400 print:text-slate-600 font-bold">Environment classification:</span>
            <span className="font-semibold">{selectedSystem.environment}</span>
            
            <span className="text-slate-400 print:text-slate-600 font-bold">Platform profile:</span>
            <span className="font-semibold">{selectedSystem.platform}</span>
            
            <span className="text-slate-400 print:text-slate-600 font-bold">Out of Scope items:</span>
            <span className="font-semibold">{selectedSystem.outOfScopeItems || 'None'}</span>
            
            <span className="text-slate-400 print:text-slate-600 font-bold">Scope Justification:</span>
            <span className="font-semibold">{selectedSystem.scopeJustification || 'N/A'}</span>
          </div>
        </div>

        {/* Section 2: Maturity Posture */}
        <div className="space-y-4 print:text-black">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 print:text-black print:border-slate-300">2. Maturity Level Posture</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(reportData.maturity.strategyScores).map(([strat, score], idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded bg-slate-900/60 border border-slate-800 text-xs print:bg-slate-50 print:border-slate-200">
                <span className="text-slate-300 print:text-slate-800 font-semibold">{strat}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  score === 'ML0' 
                    ? 'bg-rose-500/10 text-rose-450 print:bg-red-100 print:text-red-800' 
                    : 'bg-emerald-500/10 text-emerald-400 print:bg-emerald-100 print:text-emerald-800'
                }`}>{score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Exceptions & Risk Register */}
        <div className="space-y-4 print:text-black">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 print:text-black print:border-slate-300">3. Exceptions & Risk Register</h3>
          {exceptions.filter(ex => ex.status === 'APPROVED').length > 0 ? (
            <div className="space-y-3">
              {exceptions.filter(ex => ex.status === 'APPROVED').map(ex => (
                <div key={ex.id} className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 text-xs print:bg-slate-50 print:border-slate-200">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-200 print:text-slate-900">Requirement: {ex.requirementId}</p>
                    <span className="print:hidden">
                      <RiskBadge risk={ex.residualRisk} />
                    </span>
                    <span className="hidden print:inline text-[9px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                      Residual Risk: {ex.residualRisk}
                    </span>
                  </div>
                  <p className="text-slate-400 print:text-slate-700 mt-1"><span className="font-semibold text-slate-500 print:text-slate-800">Risk Statement:</span> {ex.riskStatement}</p>
                  <p className="text-slate-400 print:text-slate-700 mt-0.5"><span className="font-semibold text-slate-500 print:text-slate-800">Compensating Control:</span> {ex.compensatingControl}</p>
                  {ex.compensatingControlEfficacy && (
                    <p className="text-[10px] text-slate-450 print:text-slate-700 mt-0.5"><span className="font-semibold text-slate-550 print:text-slate-850">Control Efficacy:</span> {ex.compensatingControlEfficacy}</p>
                  )}
                  {ex.riskAcceptedBy && (
                    <p className="text-[10px] text-slate-450 print:text-slate-700 mt-0.5"><span className="font-semibold text-slate-550 print:text-slate-850">Risk Accepted By:</span> {ex.riskAcceptedBy}</p>
                  )}
                  <p className="text-[10px] text-slate-500 print:text-slate-600 mt-2">Approved by {ex.approvedBy} • Expiry Date: {new Date(ex.expiryDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 print:text-slate-600 italic">No approved exceptions active for this scope.</p>
          )}
        </div>

        {/* Section 4: Remediation Backlog */}
        <div className="space-y-4 print:text-black">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 print:text-black print:border-slate-300">4. Remediation Backlog</h3>
          {remediations.filter(r => r.status !== 'DONE').length > 0 ? (
            <div className="space-y-2">
              {remediations.filter(r => r.status !== 'DONE').map(task => (
                <div key={task.id} className="flex justify-between items-center p-3 rounded bg-slate-900/60 border border-slate-800 text-xs print:bg-slate-50 print:border-slate-200">
                  <div>
                    <span className="font-bold text-slate-300 print:text-slate-900">{task.title} ({task.requirementId})</span>
                    <p className="text-[10px] text-slate-500 print:text-slate-600 mt-0.5">Assigned to: {task.assignedTo || 'Unassigned'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 print:bg-blue-100 print:text-blue-800 text-[10px] uppercase font-bold border border-blue-500/20 print:border-blue-200">{task.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 print:text-slate-600 italic">No pending remediation requirements found.</p>
          )}
        </div>

        {/* Section 5: Signature Attestations */}
        {activeAssessment && (
          <div className="space-y-4 pt-4 border-t border-slate-800 print:border-slate-300 print:text-black">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 print:text-black print:border-slate-300">5. Sign-off Attestations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getSignatureBlock("Lead Security Assessor", activeAssessment.assessorSignature, activeAssessment.assessorSignedAt)}
              {getSignatureBlock("System Owner / Risk Acceptor", activeAssessment.ownerSignature, activeAssessment.ownerSignedAt)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
