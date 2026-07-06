import React from 'react';

export default function TopBar({ selectedSystem }) {
  return (
    <header className="h-16 border-b border-slate-800/80 px-8 flex items-center justify-between bg-slate-900/10 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-slate-400 font-semibold text-xs tracking-wide">Selected Boundary:</span>
        <span className="px-2.5 py-1 rounded bg-slate-800/80 text-[11px] font-bold border border-slate-800 text-slate-200 uppercase tracking-wide">
          {selectedSystem?.name || 'No System Seeding'}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400 font-semibold text-xs tracking-wide">Target:</span>
        <span className="px-2.5 py-1 rounded bg-blue-500/10 text-[11px] font-bold border border-blue-500/30 text-blue-400">
          {selectedSystem?.targetMaturity || 'ML2'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Technical (Raw) Maturity:</span>
          <span className={`px-2.5 py-1 rounded text-xs font-bold ${
            selectedSystem?.maturity?.technicalMaturity === 'ML0' 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {selectedSystem?.maturity?.technicalMaturity || 'ML0'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Assessed Maturity:</span>
          <span className={`px-2.5 py-1 rounded text-xs font-bold ${
            selectedSystem?.maturity?.overallMaturity === 'ML0' 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {selectedSystem?.maturity?.overallMaturity || 'ML0'}
          </span>
        </div>
      </div>
    </header>
  );
}
