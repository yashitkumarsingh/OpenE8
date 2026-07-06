import React from 'react';

export default function RiskBadge({ risk }) {
  switch (risk) {
    case 'EXTREME':
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-600/35 text-red-200 border border-red-500">
          EXTREME
        </span>
      );
    case 'HIGH':
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40">
          HIGH
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40">
          MEDIUM
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/25 text-blue-300 border border-blue-500/40">
          LOW
        </span>
      );
  }
}
