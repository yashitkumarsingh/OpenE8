import React from 'react';
import ExceptionCard from '../../exceptions/ExceptionCard';

export default function Stage5Exceptions({
  selectedReqId,
  setExceptionForm,
  setShowExceptionModal,
  currentExceptions,
  exceptionForm,
  onDeleteException,
  activeAssessment
}) {
  const isCompleted = activeAssessment?.status === 'COMPLETED';

  return (
    <div className="space-y-4 pt-2 text-xs text-slate-200">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stage 5: Exceptions & Compensations</h4>
        <button
          onClick={() => {
            setExceptionForm({ 
              ...exceptionForm, 
              requirementId: selectedReqId,
              compensatingControlEfficacy: 'MEDIUM',
              temporaryOrPermanent: 'TEMPORARY',
              affectedUserCount: '',
              nextReviewOwner: '',
              riskAcceptedBy: '',
              approvalReason: ''
            });
            setShowExceptionModal(true);
          }}
          disabled={isCompleted}
          className={`px-3 py-1.5 border text-xs font-semibold rounded transition-all ${
            isCompleted
              ? 'bg-slate-800 border-slate-750 text-slate-500 cursor-not-allowed'
              : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/35 text-amber-400'
          }`}
        >
          Log Exception Request
        </button>
      </div>

      <div className="space-y-2">
        {currentExceptions.length > 0 ? (
          currentExceptions.map(ex => (
            <ExceptionCard 
              key={ex.id}
              exception={ex}
              onDelete={onDeleteException}
              isCompleted={isCompleted}
            />
          ))
        ) : (
          <p className="text-xs text-slate-500 italic py-2">No exception active or pending approval for this requirement.</p>
        )}
      </div>
    </div>
  );
}
