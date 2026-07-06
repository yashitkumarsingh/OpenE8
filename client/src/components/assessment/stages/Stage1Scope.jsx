import React from 'react';

export default function Stage1Scope({ selectedSystem, setActiveTab }) {
  return (
    <div className="space-y-3.5 pt-2 text-xs text-slate-200">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stage 1: Target Definition</h4>
      <p className="text-xs text-slate-400">Set target maturity and plan the assessment lifecycle details.</p>
      <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold">Current Target: {selectedSystem.targetMaturity}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Define if this system requires Maturity Level 1, 2, or 3 controls.</p>
        </div>
        <button 
          onClick={() => setActiveTab('systems')}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold rounded text-slate-300 transition-colors"
        >
          Configure
        </button>
      </div>
    </div>
  );
}
