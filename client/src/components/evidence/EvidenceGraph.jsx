import React from 'react';
import { ArrowRight } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';

export default function EvidenceGraph({
  currentReq,
  currentTest,
  currentExceptions,
  currentRemediations,
  selectedReqId,
  setActiveStage,
  setExceptionForm,
  setShowExceptionModal,
  setRemediationForm,
  setShowRemediationModal,
  exceptionForm,
  remediationForm
}) {
  if (!currentReq) return null;

  // Determine colors based on status
  const getStatusColor = (status) => {
    if (status === 'EFFECTIVE') return '#10b981'; // emerald
    if (status === 'NOT_IMPLEMENTED') return '#f59e0b'; // amber
    if (status === 'INEFFECTIVE') return '#f43f5e'; // rose
    if (status === 'PASS_CANDIDATE') return '#84cc16'; // lime
    if (status === 'FAIL_CANDIDATE') return '#f97316'; // orange
    if (status === 'ALTERNATE_CONTROL') return '#6366f1'; // indigo
    if (status === 'NO_VISIBILITY') return '#eab308'; // yellow
    if (status === 'NOT_APPLICABLE') return '#3b82f6'; // blue
    if (status === 'NOT_ASSESSED') return '#475569'; // slate
    return '#475569'; // slate
  };
  
  const testColor = currentTest ? getStatusColor(currentTest.status) : '#475569';
  const mitigationColor = currentExceptions.length > 0 ? '#f59e0b' : currentRemediations.length > 0 ? '#f43f5e' : '#475569';

  return (
    <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4">
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .path-flow {
          animation: dash 1.5s linear infinite;
        }
      `}</style>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Interactive Evidence Graph</h3>
        <p className="text-[10px] text-slate-500 mt-0.5">Lineage flow indicating compliance logic trace from inputs to outcomes.</p>
      </div>

      {/* GRAPH CANVAS & CONTAINERS */}
      <div className="relative overflow-x-auto py-6 min-h-[220px]">
        <div className="relative w-[980px] h-44 z-10">
          
          {/* SVG PATHS OVERLAY */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="grad-req-ev" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.75" />
              </linearGradient>
              <linearGradient id="grad-ev-test" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
                <stop offset="100%" stopColor={testColor} stopOpacity="0.75" />
              </linearGradient>
              <linearGradient id="grad-test-mit" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={testColor} stopOpacity="0.75" />
                <stop offset="100%" stopColor={mitigationColor} stopOpacity="0.75" />
              </linearGradient>

              <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Wires */}
            <path 
              d="M 224 88 C 244 88, 244 88, 264 88" 
              stroke="url(#grad-req-ev)" 
              strokeWidth="3" 
              fill="none" 
              filter="url(#glow-filter)"
              strokeDasharray="6, 4"
              className="path-flow"
            />
            <path 
              d="M 472 88 C 492 88, 492 88, 512 88" 
              stroke="url(#grad-ev-test)" 
              strokeWidth="3" 
              fill="none" 
              filter="url(#glow-filter)"
              strokeDasharray="6, 4"
              className="path-flow"
            />
            <path 
              d="M 720 88 C 740 88, 740 88, 760 88" 
              stroke="url(#grad-test-mit)" 
              strokeWidth="3" 
              fill="none" 
              filter="url(#glow-filter)"
              strokeDasharray="6, 4"
              className="path-flow"
            />
          </svg>

          {/* NODE 1: REQUIREMENT */}
          <div className="absolute left-4 top-0 w-52 h-44 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex flex-col justify-between shadow-xl z-10 glass-card">
            <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border-[3px] border-slate-950 shadow shadow-blue-500/80 z-20" />
            <div>
              <span className="text-[9px] font-extrabold text-blue-400 block mb-1">REQUIREMENT</span>
              <p className="font-bold text-slate-200">{currentReq.id}</p>
              <p className="text-[10px] text-slate-400 line-clamp-3 mt-1 leading-relaxed">{currentReq.text}</p>
            </div>
            <span className="text-[9px] text-slate-500 mt-2 font-semibold font-mono">ISM: {currentReq.ismMapping.join(', ')}</span>
          </div>

          {/* NODE 2: EVIDENCE */}
          <div className="absolute left-[264px] top-0 w-52 h-44 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex flex-col justify-between shadow-xl z-10 glass-card">
            <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-500 border-[3px] border-slate-950 shadow shadow-emerald-500/80 z-20" />
            <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-500 border-[3px] border-slate-950 shadow shadow-emerald-500/80 z-20" />
            
            <div>
              <span className="text-[9px] font-extrabold text-emerald-400 block mb-1">EVIDENCE SOURCE</span>
              {currentTest?.evidenceList && currentTest.evidenceList.length > 0 ? (
                <div className="space-y-1.5">
                  {currentTest.evidenceList.slice(0, 2).map((ev, i) => (
                    <div key={i} className="p-1.5 rounded bg-slate-950 border border-slate-800/80 text-[10px]">
                      <p className="font-bold text-slate-350 truncate">{ev.name}</p>
                      <p className="text-slate-500 text-[8px] truncate">{ev.sourceSystem}</p>
                    </div>
                  ))}
                  {currentTest.evidenceList.length > 2 && (
                    <span className="text-[8px] text-slate-500 font-semibold block">+{currentTest.evidenceList.length - 2} more items</span>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 italic text-[10px] py-3">No evidence linked.</p>
              )}
            </div>
            <button 
              onClick={() => setActiveStage(3)}
              className="text-[10px] font-bold text-blue-500 hover:text-blue-400 text-left flex items-center gap-1 w-max"
            >
              Manage <ArrowRight size={10}/>
            </button>
          </div>

          {/* NODE 3: TEST RESULT */}
          <div className="absolute left-[512px] top-0 w-52 h-44 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex flex-col justify-between shadow-xl z-10 glass-card">
            <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-[3px] border-slate-950 z-20 shadow" style={{ backgroundColor: testColor, boxShadow: `0 0 8px ${testColor}` }} />
            <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-[3px] border-slate-950 z-20 shadow" style={{ backgroundColor: testColor, boxShadow: `0 0 8px ${testColor}` }} />

            <div>
              <span className="text-[9px] font-extrabold text-amber-400 block mb-1">COMPLIANCE TEST</span>
              <div className="mt-1.5">
                {currentTest ? <StatusBadge status={currentTest.status} /> : <span className="text-slate-500">Not Assessed</span>}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                {currentTest?.notes || 'No findings recorded.'}
              </p>
            </div>
            <button
              onClick={() => setActiveStage(4)}
              className="text-[10px] font-bold text-blue-500 hover:text-blue-400 text-left flex items-center gap-1 w-max"
            >
              Review Desk <ArrowRight size={10}/>
            </button>
          </div>

          {/* NODE 4: EXCEPTION OR REMEDIATION */}
          <div className="absolute left-[760px] top-0 w-52 h-44 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex flex-col justify-between shadow-xl z-10 glass-card">
            <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-[3px] border-slate-950 z-20 shadow" style={{ backgroundColor: mitigationColor, boxShadow: `0 0 8px ${mitigationColor}` }} />

            <div>
              <span className="text-[9px] font-extrabold text-rose-400 block mb-1">MITIGATION STATE</span>
              {currentExceptions.length > 0 ? (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/25">
                  <span className="text-[9px] font-bold text-amber-400 block uppercase">EXCEPTION APPROVED</span>
                  <p className="text-[9px] text-slate-350 mt-1 line-clamp-2 leading-relaxed">Risk: {currentExceptions[0].residualRisk}</p>
                </div>
              ) : currentRemediations.length > 0 ? (
                <div className="p-2 rounded bg-rose-500/10 border border-rose-500/25">
                  <span className="text-[9px] font-bold text-rose-400 block uppercase">REMEDIATION TASK</span>
                  <p className="text-[9px] text-slate-350 mt-1 line-clamp-2 leading-relaxed">{currentRemediations[0].title}</p>
                </div>
              ) : (
                <div className="py-3 text-center">
                  <p className="text-slate-500 italic text-[10px]">No active exception or remediation.</p>
                </div>
              )}
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setExceptionForm({ ...exceptionForm, requirementId: selectedReqId });
                  setShowExceptionModal(true);
                }}
                className="text-[9px] font-bold text-amber-400 hover:underline"
              >
                + Exception
              </button>
              <button
                onClick={() => {
                  setRemediationForm({ ...remediationForm, requirementId: selectedReqId });
                  setShowRemediationModal(true);
                }}
                className="text-[9px] font-bold text-rose-400 hover:underline"
              >
                + Fix
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
