import React from 'react';
import { BookOpen } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import EvidenceGraph from '../evidence/EvidenceGraph';

// Stage Components
import Stage1Scope from './stages/Stage1Scope';
import Stage2Catalog from './stages/Stage2Catalog';
import Stage3Evidence from './stages/Stage3Evidence';
import Stage4Review from './stages/Stage4Review';
import Stage5Exceptions from './stages/Stage5Exceptions';
import Stage6SignOff from './stages/Stage6SignOff';

export default function AssessmentWorkspace({
  activeStage,
  setActiveStage,
  catalog,
  selectedReqId,
  setSelectedReqId,
  activeAssessment,
  selectedSystem,
  setActiveTab,
  user,
  currentReq,
  currentTest,
  currentExceptions,
  currentRemediations,
  
  // Modals & Stage form callbacks
  evidenceForm,
  setEvidenceForm,
  handleFileChange,
  handleAddEvidence,
  setShowEvidenceModal,
  
  evidenceTab,
  setEvidenceTab,
  verifyStates,
  handleVerifyEvidence,
  onDeleteEvidence,
  
  importerType,
  setImporterType,
  importerLoading,
  importerSummary,
  importerFile,
  handleImporterFileChange,
  handleRunImport,
  
  reviewView,
  setReviewView,
  handleUpdateControlTest,
  
  exceptionForm,
  setExceptionForm,
  setShowExceptionModal,
  onDeleteException,
  
  remediationForm,
  setRemediationForm,
  setShowRemediationModal,
  
  handleSignOff,
  generateReport,
  csvHeaders,
  importerMapping,
  setImporterMapping
}) {
  if (!activeAssessment) return null;

  return (
    <div className="space-y-6 text-xs text-slate-200">
      
      {/* STAGE STEPPER */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex justify-between items-center gap-2 bg-slate-900/40">
        {[
          { step: 1, label: 'Plan' },
          { step: 2, label: 'Scope' },
          { step: 3, label: 'Evidence' },
          { step: 4, label: 'Review Controls' },
          { step: 5, label: 'Exceptions' },
          { step: 6, label: 'Report' }
        ].map((s) => (
          <button
            key={s.step}
            onClick={() => setActiveStage(s.step)}
            data-testid={`stage-step-${s.step}`}
            className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
              activeStage === s.step 
                ? 'bg-blue-600/15 text-blue-400 border-blue-500/40 shadow-lg shadow-blue-500/5'
                : activeStage > s.step 
                  ? 'bg-slate-900/60 text-slate-400 border-slate-800' 
                  : 'text-slate-500 border-transparent hover:bg-slate-900/30'
            }`}
          >
            Stage {s.step}: {s.label}
          </button>
        ))}
      </div>

      {/* STAGE WORKSPACE PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT DIRECTORY: REQUIREMENTS LIST */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 lg:col-span-4 h-[600px] flex flex-col bg-slate-900/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Essential 8 Catalog</h3>
          <p className="text-[9px] text-slate-500 mb-3 leading-tight italic">
            Starter control catalogue inspired by ASD guidance. Not an authoritative reproduction of ASD's official maturity model.
          </p>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {catalog.map(strategy => (
              <div key={strategy.slug} className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide px-1 block">{strategy.strategy}</span>
                <div className="space-y-1">
                  {strategy.requirements.map(req => {
                    const test = activeAssessment.testResults.find(r => r.requirementId === req.id);
                    const isSelected = selectedReqId === req.id;
                    return (
                      <button
                        key={req.id}
                        onClick={() => setSelectedReqId(req.id)}
                        className={`w-full text-left p-2.5 rounded text-xs flex justify-between items-center transition-all ${
                          isSelected 
                            ? 'bg-slate-800 border-l-[3px] border-blue-500 pl-2' 
                            : 'bg-slate-900/45 hover:bg-slate-900 border-l border-transparent'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <span className="font-bold text-slate-300 block">{req.id}</span>
                          <span className="text-[10px] text-slate-400 truncate block mt-0.5">{req.text}</span>
                        </div>
                        <div className="shrink-0">
                          {test ? (
                            <span className={`h-2.5 w-2.5 rounded-full block ${
                              test.status === 'EFFECTIVE' ? 'bg-emerald-500' :
                              test.status === 'NOT_IMPLEMENTED' ? 'bg-amber-500' :
                              test.status === 'INEFFECTIVE' ? 'bg-rose-500' : 
                              test.status === 'PASS_CANDIDATE' ? 'bg-lime-500 animate-pulse' :
                              test.status === 'FAIL_CANDIDATE' ? 'bg-orange-500 animate-pulse' :
                              test.status === 'ALTERNATE_CONTROL' ? 'bg-indigo-500' :
                              test.status === 'NO_VISIBILITY' ? 'bg-yellow-500' :
                              test.status === 'NOT_APPLICABLE' ? 'bg-blue-500' :
                              'bg-slate-600'
                            }`} />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT DESK: WORKSPACE DETAILS & INTERACTIVE GRAPH */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CONTROL DETAILS & WORKSPACE COMPONENT */}
          {currentReq && (
            <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-5 bg-slate-900/20">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 uppercase tracking-wider">{currentReq.level}</span>
                  <h2 className="text-base font-bold text-white mt-1.5">{currentReq.id}: {currentReq.text}</h2>
                </div>
                {currentTest && <StatusBadge status={currentTest.status} />}
              </div>

              <div className="flex flex-wrap gap-4 py-3 border-y border-slate-800/80 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <BookOpen size={14} />
                  <span className="font-semibold text-slate-300">ISM Traceability:</span> 
                  <span className="text-slate-500">[{currentReq.ismMapping.join(', ')}]</span>
                </div>
              </div>

              {/* RENDER ACTIVE STEP MODULE */}
              {activeStage === 1 && (
                <Stage1Scope 
                  selectedSystem={selectedSystem} 
                  setActiveTab={setActiveTab} 
                />
              )}
              {activeStage === 2 && (
                <Stage2Catalog 
                  selectedSystem={selectedSystem} 
                />
              )}
              {activeStage === 3 && (
                <Stage3Evidence 
                  evidenceTab={evidenceTab}
                  setEvidenceTab={setEvidenceTab}
                  activeAssessment={activeAssessment}
                  setShowEvidenceModal={setShowEvidenceModal}
                  currentTest={currentTest}
                  verifyStates={verifyStates}
                  handleVerifyEvidence={handleVerifyEvidence}
                  onDeleteEvidence={onDeleteEvidence}
                  importerType={importerType}
                  setImporterType={setImporterType}
                  importerLoading={importerLoading}
                  importerSummary={importerSummary}
                  importerFile={importerFile}
                  handleImporterFileChange={handleImporterFileChange}
                  handleRunImport={handleRunImport}
                  csvHeaders={csvHeaders}
                  importerMapping={importerMapping}
                  setImporterMapping={setImporterMapping}
                />
              )}
              {activeStage === 4 && (
                <Stage4Review 
                  reviewView={reviewView}
                  setReviewView={setReviewView}
                  activeAssessment={activeAssessment}
                  currentReq={currentReq}
                  currentTest={currentTest}
                  setSelectedReqId={setSelectedReqId}
                  handleUpdateControlTest={handleUpdateControlTest}
                />
              )}
              {activeStage === 5 && (
                <Stage5Exceptions 
                  selectedReqId={selectedReqId}
                  setExceptionForm={setExceptionForm}
                  setShowExceptionModal={setShowExceptionModal}
                  currentExceptions={currentExceptions}
                  exceptionForm={exceptionForm}
                  onDeleteException={onDeleteException}
                  activeAssessment={activeAssessment}
                />
              )}
              {activeStage === 6 && (
                <Stage6SignOff 
                  activeAssessment={activeAssessment}
                  user={user}
                  handleSignOff={handleSignOff}
                  generateReport={generateReport}
                />
              )}
            </div>
          )}

          {/* INTERACTIVE EVIDENCE GRAPH */}
          <EvidenceGraph 
            currentReq={currentReq}
            currentTest={currentTest}
            currentExceptions={currentExceptions}
            currentRemediations={currentRemediations}
            selectedReqId={selectedReqId}
            setActiveStage={setActiveStage}
            setExceptionForm={setExceptionForm}
            setShowExceptionModal={setShowExceptionModal}
            setRemediationForm={setRemediationForm}
            setShowRemediationModal={setShowRemediationModal}
            exceptionForm={exceptionForm}
            reremedyForm={remediationForm}
          />
        </div>

      </div>
    </div>
  );
}
