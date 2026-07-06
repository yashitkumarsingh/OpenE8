import React from 'react';
import { Shield, CheckCircle2, XCircle, RefreshCw, ExternalLink, Trash2 } from 'lucide-react';

export default function EvidenceCard({ 
  evidence, 
  verifyState, 
  onVerify, 
  onDelete, 
  isCompleted 
}) {
  return (
    <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800/80 flex justify-between items-start text-xs">
      <div className="space-y-1">
        <span className="font-bold text-slate-200 block">{evidence.name}</span>
        <div className="flex gap-2 text-[10px] text-slate-500">
          <span>Source: {evidence.sourceSystem}</span>
          <span>•</span>
          <span>Confidence: {evidence.confidenceLevel}</span>
        </div>
        {evidence.notes && <p className="text-[11px] text-slate-400 mt-1 italic">"{evidence.notes}"</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onVerify(evidence.id)}
          className={`px-2 py-1 rounded-md border text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1 transition-all ${
            verifyState?.loading ? 'bg-slate-950 border-slate-850 text-slate-400 animate-pulse' :
            verifyState?.verified ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400' :
            verifyState?.error ? 'bg-rose-500/10 border-rose-500/35 text-rose-455' :
            'bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title={verifyState?.message || verifyState?.error || 'Verify file cryptographic checksum'}
        >
          {verifyState?.loading ? (
            <RefreshCw size={10} className="animate-spin text-blue-500" />
          ) : verifyState?.verified ? (
            <CheckCircle2 size={10} />
          ) : verifyState?.error ? (
            <XCircle size={10} />
          ) : (
            <Shield size={10} />
          )}
          {verifyState?.verified ? 'VERIFIED' :
           verifyState?.error ? 'TAMPERED' :
           'VERIFY'}
        </button>

        {evidence.urlOrPath && (
          <a 
            href={`http://localhost:5001${evidence.urlOrPath}`} 
            target="_blank" 
            rel="noreferrer" 
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
            title="Download/View file"
          >
            <ExternalLink size={14}/>
          </a>
        )}

        {!isCompleted && onDelete && (
          <button 
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete evidence "${evidence.name}"?`)) {
                onDelete(evidence.id);
              }
            }}
            className="p-1.5 hover:bg-rose-500/10 hover:text-rose-450 text-slate-500 rounded transition-colors"
            title="Delete evidence"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
