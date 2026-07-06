import React from 'react';
import { Shield, AlertTriangle, Terminal, FileCheck, BarChart2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function DashboardTab({
  selectedSystem,
  exceptions,
  remediations,
  activeAssessment,
  chartData
}) {
  if (!selectedSystem) return null;

  return (
    <div className="space-y-6 text-xs text-slate-200">
      
      {/* TOP CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* CARD 1: OVERALL MATURITY */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between h-36 relative overflow-hidden bg-slate-900/10">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-semibold">Maturity Status</span>
            <Shield size={18} className="text-blue-500" />
          </div>
          <div>
            <div className="flex gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">{selectedSystem.maturity?.overallMaturity || 'ML0'}</h2>
                <p className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">Assessed Score</p>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <h2 className="text-3xl font-extrabold text-slate-400 tracking-tight">{selectedSystem.maturity?.technicalMaturity || 'ML0'}</h2>
                <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Technical Score</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-semibold uppercase">Target: {selectedSystem.targetMaturity}</p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-3 translate-x-3">
            <Shield size={120} />
          </div>
        </div>

        {/* CARD 2: ACTIVE EXTREME/HIGH RISK EXCEPTIONS */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between h-36 bg-slate-900/10">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-semibold">Active Exceptions</span>
            <AlertTriangle size={18} className="text-amber-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {exceptions.filter(ex => ex.status === 'APPROVED').length}
            </h2>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold uppercase">
              {exceptions.filter(ex => ex.residualRisk === 'HIGH' || ex.residualRisk === 'EXTREME').length} High/Extreme Residual Risk
            </p>
          </div>
        </div>

        {/* CARD 3: REMEDIATION DEBT */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between h-36 bg-slate-900/10">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-semibold">Remediation Board</span>
            <Terminal size={18} className="text-slate-400" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {remediations.filter(r => r.status !== 'DONE').length}
            </h2>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold uppercase">
              {remediations.filter(r => r.status === 'IN_PROGRESS').length} In Progress Tasks
            </p>
          </div>
        </div>

        {/* CARD 4: EVIDENCE COMPLETENESS */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between h-36 bg-slate-900/10">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-semibold">Evidence Coverage</span>
            <FileCheck size={18} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {Math.round(
                ((activeAssessment?.testResults?.filter(r => r.evidenceList?.length > 0).length || 0) / 
                (activeAssessment?.testResults?.length || 1)) * 100
              )}%
            </h2>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold uppercase">
              {activeAssessment?.testResults?.flatMap(tr => tr.evidenceList || []).length || 0} Total Vault Items
            </p>
          </div>
        </div>
      </div>

      {/* MATURITY CHART & BLOCKING STRATEGIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHARTS CARD */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800 lg:col-span-2 space-y-4 bg-slate-900/10">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Target vs Current Maturity Levels</h3>
            <BarChart2 size={16} className="text-slate-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} domain={[0, 3]} tickCount={4} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', wrapperAlign: 'center', fontWeight: 'semibold' }} />
                <Bar dataKey="Target" fill="#3b82f6" fillOpacity={0.15} stroke="#3b82f6" strokeWidth={1.5} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Current" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BLOCKING LIST */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4 bg-slate-900/10">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Target Blockers</h3>
          {selectedSystem.maturity?.blockingStrategies?.length > 0 ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="font-bold">Not Compliant with Target {selectedSystem.targetMaturity}</p>
                  <p className="text-[11px] text-rose-450/85 mt-0.5">The following strategies have requirements below target and lack active exceptions.</p>
                </div>
              </div>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {selectedSystem.maturity.blockingStrategies.map((strat, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 rounded bg-slate-900/60 border border-slate-800 text-xs font-semibold">
                    <span className="text-slate-300 truncate mr-2">{strat}</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px]">
                      {selectedSystem.maturity.strategyScores[strat]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
              <CheckCircle2 size={36} className="text-emerald-500 mb-2 animate-bounce-subtle" />
              <p className="text-xs font-bold text-slate-300">All strategies match or exceed target maturity level!</p>
              <p className="text-[11px] text-slate-500 mt-1">Excellent governance control alignment.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
