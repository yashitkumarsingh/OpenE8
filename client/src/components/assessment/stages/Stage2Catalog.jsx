import React from 'react';

export default function Stage2Catalog({ selectedSystem }) {
  return (
    <div className="space-y-3.5 pt-2 text-xs text-slate-200">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stage 2: Boundary Scope Alignment</h4>
      <p className="text-xs text-slate-400">Ensure the systems components are correctly aligned under the scope builder configuration.</p>
      <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
        <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
          <span className="text-slate-400">Platform Scope:</span>
          <span className="font-semibold text-slate-200">{selectedSystem.platform}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
          <span className="text-slate-400">Out of Scope items:</span>
          <span className="font-semibold text-slate-200">{selectedSystem.outOfScopeItems || 'None'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Data sensitivity:</span>
          <span className="font-semibold text-slate-200 uppercase">{selectedSystem.dataSensitivity}</span>
        </div>
      </div>
    </div>
  );
}
