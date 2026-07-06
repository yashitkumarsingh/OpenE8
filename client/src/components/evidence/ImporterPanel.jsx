import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

export default function ImporterPanel({
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
  const getAcceptedExtensions = () => {
    if (importerType === 'NESSUS_PATCH' || importerType === 'CUSTOM_CSV') return '.csv';
    return '.json';
  };

  return (
    <form onSubmit={handleRunImport} className="space-y-4 pt-1 text-xs text-slate-200">
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3.5">
        <div>
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Select Importer Engine</label>
          <select
            value={importerType}
            onChange={(e) => setImporterType(e.target.value)}
            data-testid="importer-engine-select"
            className="w-full bg-slate-950 border border-slate-850 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ENTRA_MFA">Microsoft Entra ID Conditional Access Rules (JSON)</option>
            <option value="NESSUS_PATCH">Nessus Vulnerability Scan Export (CSV)</option>
            <option value="DEFENDER_VULN">Microsoft Defender for Endpoint Vulnerability Export (JSON)</option>
            <option value="AWS_CONFIG">AWS Config Security Compliance State (JSON)</option>
            <option value="CUSTOM_CSV">Custom Vulnerability Scan Export (CSV)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Upload Technical File</label>
          <input
            type="file"
            accept={getAcceptedExtensions()}
            onChange={handleImporterFileChange}
            data-testid="importer-file-input"
            className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-350 hover:file:bg-slate-700"
            required
          />
        </div>

        {importerType === 'CUSTOM_CSV' && csvHeaders && csvHeaders.length > 0 && (
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Map CSV Columns</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Severity Column (Required)</label>
                <select
                  value={importerMapping.severity}
                  onChange={(e) => setImporterMapping({ ...importerMapping, severity: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded py-1 px-2 text-[10px] text-slate-200 focus:outline-none"
                >
                  <option value="">-- Select --</option>
                  {csvHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Host/Asset Column</label>
                <select
                  value={importerMapping.host}
                  onChange={(e) => setImporterMapping({ ...importerMapping, host: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded py-1 px-2 text-[10px] text-slate-200 focus:outline-none"
                >
                  <option value="">-- None / Default --</option>
                  {csvHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[8px] text-slate-500 font-bold uppercase block mb-1">CVE Column</label>
                <select
                  value={importerMapping.cve}
                  onChange={(e) => setImporterMapping({ ...importerMapping, cve: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded py-1 px-2 text-[9px] text-slate-200 focus:outline-none"
                >
                  <option value="">-- None / Default --</option>
                  {csvHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Description</label>
                <select
                  value={importerMapping.description}
                  onChange={(e) => setImporterMapping({ ...importerMapping, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded py-1 px-2 text-[9px] text-slate-200 focus:outline-none"
                >
                  <option value="">-- None / Default --</option>
                  {csvHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Solution</label>
                <select
                  value={importerMapping.solution}
                  onChange={(e) => setImporterMapping({ ...importerMapping, solution: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded py-1 px-2 text-[9px] text-slate-200 focus:outline-none"
                >
                  <option value="">-- None / Default --</option>
                  {csvHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          data-testid="importer-submit-button"
          disabled={importerLoading || !importerFile.base64 || (importerType === 'CUSTOM_CSV' && !importerMapping.severity)}
          className={`w-full py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
            importerLoading || !importerFile.base64 || (importerType === 'CUSTOM_CSV' && !importerMapping.severity)
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {importerLoading ? (
            <>
              <RefreshCw className="animate-spin" size={14}/>
              Running Engine Analysis...
            </>
          ) : (
            'Execute Compliance Analysis'
          )}
        </button>
      </div>

      {importerSummary && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 space-y-1">
          <p className="font-bold flex items-center gap-1.5"><CheckCircle2 size={14}/> Analysis Complete</p>
          <p className="text-[11px] leading-relaxed text-emerald-400/80">{importerSummary}</p>
        </div>
      )}
    </form>
  );
}
