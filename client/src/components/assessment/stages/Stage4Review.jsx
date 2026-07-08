import React from 'react';
import StatusBadge from '../../shared/StatusBadge';

export default function Stage4Review({
  reviewView,
  setReviewView,
  activeAssessment,
  currentReq,
  currentTest,
  setSelectedReqId,
  handleUpdateControlTest
}) {
  const isCompleted = activeAssessment?.status === 'COMPLETED';

  return (
    <div className="space-y-4 pt-2 text-xs text-slate-200">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stage 4: Compliance Review Desk</h4>
        {/* View toggle */}
        <div className="flex gap-1 bg-slate-900/80 border border-slate-800 rounded p-0.5">
          <button
            onClick={() => setReviewView('graph')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${reviewView === 'graph' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Graph
          </button>
          <button
            onClick={() => setReviewView('table')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${reviewView === 'table' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Table
          </button>
        </div>
      </div>

      {/* TABLE VIEW — flat, scannable audit grid */}
      {reviewView === 'table' && activeAssessment && (() => {
        const allTests = activeAssessment.testResults || [];
        const statusColor = (st) => {
          if (st === 'EFFECTIVE') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
          if (st === 'NOT_IMPLEMENTED') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
          if (st === 'INEFFECTIVE') return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
          if (st === 'PASS_CANDIDATE') return 'text-lime-400 bg-lime-500/10 border-lime-500/30';
          if (st === 'FAIL_CANDIDATE') return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
          if (st === 'ALTERNATE_CONTROL') return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
          if (st === 'NO_VISIBILITY') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
          if (st === 'NOT_APPLICABLE') return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
          if (st === 'NOT_ASSESSED') return 'text-slate-500 bg-slate-800/50 border-slate-700';
          return 'text-slate-500 bg-slate-800/50 border-slate-700';
        };
        return (
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/10">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="text-left px-3 py-2 text-slate-500 font-bold uppercase tracking-wider">Req ID</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-bold uppercase tracking-wider">Strategy</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-bold uppercase tracking-wider">ML</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-bold uppercase tracking-wider">Status</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-bold uppercase tracking-wider">Evidence</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-bold uppercase tracking-wider">Reviewer</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-bold uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody>
                {allTests.map((test, i) => {
                  const reqParts = test.requirementId.split('-');
                  const strategy = reqParts.slice(1, -2).join('-');
                  const ml = reqParts[reqParts.length - 2] || '';
                  const isCandidate = test.status === 'PASS_CANDIDATE' || test.status === 'FAIL_CANDIDATE';
                  return (
                    <tr
                      key={test.id}
                      onClick={() => { setSelectedReqId(test.requirementId); setReviewView('graph'); }}
                      className={`border-b border-slate-800/50 cursor-pointer transition-colors hover:bg-slate-800/40 ${i % 2 === 0 ? 'bg-slate-950/40' : 'bg-slate-900/20'}`}
                    >
                      <td className="px-3 py-2 font-mono text-slate-300">{test.requirementId}</td>
                      <td className="px-3 py-2 text-slate-400 capitalize">{strategy.toLowerCase().replace(/-/g, ' ')}</td>
                      <td className="px-3 py-2 text-slate-400 font-bold">{ml}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-extrabold uppercase tracking-wide ${statusColor(test.status)}`}>
                          {test.status.replace(/_/g, ' ')}
                        </span>
                        {isCandidate && <span className="ml-1 text-[8px] text-amber-500" title="Candidate finding — assessor review required">⚠</span>}
                      </td>
                      <td className="px-3 py-2 text-slate-400">{(test.evidenceList || []).length} item{(test.evidenceList || []).length !== 1 ? 's' : ''}</td>
                      <td className="px-3 py-2 text-slate-400">{test.reviewedBy || <span className="italic text-slate-600">Unreviewed</span>}</td>
                      <td className="px-3 py-2 text-slate-500 max-w-[180px] truncate" title={test.notes}>{test.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-3 py-2 border-t border-slate-800 bg-slate-900/40 flex gap-4 text-[9px] text-slate-500">
              <span>Click any row to inspect in Graph View.</span>
              {allTests.some(t => t.status === 'PASS_CANDIDATE' || t.status === 'FAIL_CANDIDATE') && (
                <span className="text-amber-500 font-bold">⚠ Candidate findings require assessor review before sign-off.</span>
              )}
            </div>
          </div>
        );
      })()}

      {/* GRAPH VIEW — existing control detail panel */}
      {reviewView === 'graph' && currentReq && currentTest && (
        <div className="space-y-3.5">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Expected Evidence Type</label>
            <div className="flex flex-wrap gap-2">
              {currentReq.expectedEvidence.map((evT, i) => (
                <span key={i} className="px-2 py-1 rounded bg-slate-900 text-[10px] font-semibold text-slate-400 border border-slate-850">{evT}</span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Requirement Compliance Status</label>
            {(currentTest.status === 'PASS_CANDIDATE' || currentTest.status === 'FAIL_CANDIDATE') && (
              <div className="mb-2.5 px-2.5 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-400 flex items-center gap-1.5">
                <span>⚠</span>
                <span><strong>Candidate Finding</strong> — This status was set by an automated importer. Assessor review and confirmation is required before sign-off.</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {['EFFECTIVE', 'ALTERNATE_CONTROL', 'INEFFECTIVE', 'NO_VISIBILITY', 'NOT_IMPLEMENTED', 'NOT_APPLICABLE', 'NOT_ASSESSED'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleUpdateControlTest(currentTest.id, st, currentTest.notes)}
                  disabled={isCompleted}
                  className={`py-2 px-3 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    isCompleted ? 'cursor-not-allowed opacity-65 ' : ''
                  }${
                    currentTest.status === st 
                      ? st === 'EFFECTIVE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50' :
                        st === 'ALTERNATE_CONTROL' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/50' :
                        st === 'INEFFECTIVE' ? 'bg-rose-500/15 text-rose-400 border-rose-500/50' :
                        st === 'NOT_IMPLEMENTED' ? 'bg-amber-500/15 text-amber-400 border-amber-500/50' :
                        st === 'NO_VISIBILITY' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/50' :
                        st === 'NOT_APPLICABLE' ? 'bg-blue-500/15 text-blue-400 border-blue-500/50' :
                        'bg-slate-850 text-slate-400 border-slate-750'
                      : 'bg-slate-900/60 border-slate-850 hover:bg-slate-900 text-slate-500'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Assessor Notes / Findings</label>
            <textarea
              value={currentTest.notes || ''}
              onChange={(e) => handleUpdateControlTest(currentTest.id, currentTest.status, e.target.value)}
              disabled={isCompleted}
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 h-24 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="Describe current findings, scan references, or verification checks..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
