import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  switch (status) {
    case 'PASSED':
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
          <CheckCircle2 size={12}/> PASS
        </span>
      );
    case 'PARTIAL':
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-max">
          <Clock size={12}/> PARTIAL
        </span>
      );
    case 'FAILED':
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-max">
          <XCircle size={12}/> FAIL
        </span>
      );
    case 'MET_VIA_COMPENSATING_CONTROL':
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1 w-max">
          <CheckCircle2 size={12}/> COMPENSATED
        </span>
      );
    case 'PASS_CANDIDATE':
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-md bg-lime-500/20 text-lime-400 border border-lime-500/30 flex items-center gap-1 w-max">
          <AlertCircle size={12}/> CANDIDATE PASS
        </span>
      );
    case 'FAIL_CANDIDATE':
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1 w-max">
          <AlertCircle size={12}/> CANDIDATE FAIL
        </span>
      );
    case 'NEEDS_REVIEW':
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1 w-max">
          <Clock size={12}/> NEEDS REVIEW
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-500/20 text-slate-400 border border-slate-500/30 flex items-center gap-1 w-max">
          N/A
        </span>
      );
  }
}
