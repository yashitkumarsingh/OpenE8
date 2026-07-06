import React from 'react';
import { Upload } from 'lucide-react';
import EvidenceCard from '../../evidence/EvidenceCard';
import ImporterPanel from '../../evidence/ImporterPanel';

export default function Stage3Evidence({
  evidenceTab,
  setEvidenceTab,
  activeAssessment,
  setShowEvidenceModal,
  currentTest,
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
  csvHeaders,
  importerMapping,
  setImporterMapping
}) {
  const isCompleted = activeAssessment?.status === 'COMPLETED';

  return (
    <div className="space-y-4 pt-2 text-xs text-slate-200">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
        <div className="flex gap-4">
          <button
            type="button"
            data-testid="evidence-tab-list"
            onClick={() => setEvidenceTab('list')}
            className={`text-xs font-bold uppercase tracking-wider pb-1 transition-all ${
              evidenceTab === 'list' 
                ? 'text-blue-400 border-b-2 border-blue-500' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Evidence Vault
          </button>
          <button
            type="button"
            data-testid="evidence-tab-import"
            onClick={() => setEvidenceTab('import')}
            className={`text-xs font-bold uppercase tracking-wider pb-1 transition-all ${
              evidenceTab === 'import' 
                ? 'text-blue-400 border-b-2 border-blue-500' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Technical Importers
          </button>
        </div>
        
        {evidenceTab === 'list' && (
          <button 
            onClick={() => setShowEvidenceModal(true)}
            data-testid="add-evidence-button"
            disabled={isCompleted}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded text-white transition-colors ${
              isCompleted
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            <Upload size={12}/> Upload Evidence
          </button>
        )}
      </div>

      {evidenceTab === 'list' ? (
        <div className="space-y-2">
          {currentTest?.evidenceList && currentTest.evidenceList.length > 0 ? (
            currentTest.evidenceList.map(ev => (
              <EvidenceCard 
                key={ev.id}
                evidence={ev}
                verifyState={verifyStates[ev.id]}
                onVerify={handleVerifyEvidence}
                onDelete={onDeleteEvidence}
                isCompleted={isCompleted}
              />
            ))
          ) : (
            <p className="text-xs text-slate-500 italic py-2">No evidence uploaded for this requirement yet.</p>
          )}
        </div>
      ) : (
        <ImporterPanel 
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
    </div>
  );
}
