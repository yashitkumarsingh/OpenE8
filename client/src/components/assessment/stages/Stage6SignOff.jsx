import React from 'react';

export default function Stage6SignOff({
  activeAssessment,
  user,
  handleSignOff,
  generateReport
}) {
  if (!activeAssessment) return null;

  return (
    <div className="space-y-4 pt-2 text-xs text-slate-205">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stage 6: Report, Sign-off & Lock</h4>
      <p className="text-xs text-slate-400">Produce formal audit packages and sign off to seal this assessment period.</p>
      
      {/* Dual Cryptographic Sign-offs Panel */}
      <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
          <span className="text-xs font-bold text-slate-200">Cryptographic Sign-off Status</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase ${
            activeAssessment.status === 'COMPLETED'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-750'
          }`}>
            {activeAssessment.status === 'COMPLETED' ? 'COMPLETED & LOCKED' : 'IN REVIEW'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Assessor Sign box */}
          <div className="p-3.5 rounded bg-slate-950/80 border border-slate-850 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lead Security Assessor</span>
              {activeAssessment.assessorSignature ? (
                <span className="text-[10px] text-emerald-450 font-bold">✓ SIGNED</span>
              ) : (
                <span className="text-[10px] text-slate-500 italic">PENDING</span>
              )}
            </div>
            {activeAssessment.assessorSignature ? (
              <div className="space-y-1 font-mono text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-850">
                <div className="italic text-slate-350">"{activeAssessment.assessorSignature}"</div>
                <div className="text-[8px] text-slate-500 mt-1">Signed: {new Date(activeAssessment.assessorSignedAt).toLocaleString()}</div>
              </div>
            ) : user?.role === 'ASSESSOR' ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSignOff('ASSESSOR', e.target.sig.value);
              }} className="flex gap-2">
                <input 
                  name="sig" 
                  data-testid="sign-input-assessor"
                  required 
                  placeholder="Type full name to sign" 
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                />
                <button 
                  data-testid="sign-button-assessor"
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded transition-colors"
                >
                  Sign
                </button>
              </form>
            ) : (
              <p className="text-[10px] text-slate-500 italic">Requires Assessor profile credentials.</p>
            )}
          </div>

          {/* Owner Sign box */}
          <div className="p-3.5 rounded bg-slate-950/80 border border-slate-850 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">System Owner</span>
              {activeAssessment.ownerSignature ? (
                <span className="text-[10px] text-emerald-450 font-bold">✓ SIGNED</span>
              ) : (
                <span className="text-[10px] text-slate-500 italic">PENDING</span>
              )}
            </div>
            {activeAssessment.ownerSignature ? (
              <div className="space-y-1 font-mono text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-850">
                <div className="italic text-slate-350">"{activeAssessment.ownerSignature}"</div>
                <div className="text-[8px] text-slate-500 mt-1">Signed: {new Date(activeAssessment.ownerSignedAt).toLocaleString()}</div>
              </div>
            ) : user?.role === 'SYSTEM_OWNER' ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSignOff('SYSTEM_OWNER', e.target.sig.value);
              }} className="flex gap-2">
                <input 
                  name="sig" 
                  data-testid="sign-input-owner"
                  required 
                  placeholder="Type full name to sign" 
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                />
                <button 
                  data-testid="sign-button-owner"
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded transition-colors"
                >
                  Sign
                </button>
              </form>
            ) : (
              <p className="text-[10px] text-slate-500 italic">Requires System Owner profile credentials.</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold">Generate Governance Package</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Produces Markdown, JSON trace logs, and compliance matrices.</p>
        </div>
        <button 
          onClick={generateReport}
          data-testid="generate-report-redirect"
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded text-white transition-colors"
        >
          Go to Reports
        </button>
      </div>
    </div>
  );
}
