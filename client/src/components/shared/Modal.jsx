import React from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`glass-panel p-6 rounded-xl border border-slate-800 w-full ${maxWidth} space-y-4 bg-slate-900/90 shadow-2xl`}>
        <div className="flex justify-between items-center border-b border-slate-850 pb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-200 transition-colors text-xs font-semibold px-2 py-1 rounded hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
        <div className="mt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
