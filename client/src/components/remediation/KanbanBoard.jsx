import React from 'react';
import { ExternalLink, ArrowRight, ArrowLeft } from 'lucide-react';

export default function KanbanBoard({ 
  remediations, 
  onUpdateStatus, 
  user 
}) {
  const isReadOnly = user?.role === 'AUDITOR';

  const moveTask = async (taskId, currentStatus, direction) => {
    let nextStatus = currentStatus;
    if (currentStatus === 'BACKLOG' && direction === 'right') nextStatus = 'IN_PROGRESS';
    else if (currentStatus === 'IN_PROGRESS' && direction === 'left') nextStatus = 'BACKLOG';
    else if (currentStatus === 'IN_PROGRESS' && direction === 'right') nextStatus = 'DONE';
    else if (currentStatus === 'DONE' && direction === 'left') nextStatus = 'IN_PROGRESS';
    
    if (nextStatus !== currentStatus && onUpdateStatus) {
      await onUpdateStatus(taskId, nextStatus);
    }
  };

  const renderCard = (task, isDoneCol) => {
    return (
      <div 
        key={task.id} 
        className={`p-4 rounded-lg bg-slate-900 border border-slate-850 space-y-2 text-xs transition-opacity ${
          isDoneCol ? 'opacity-70 hover:opacity-90' : ''
        }`}
      >
        <div className="flex justify-between items-start">
          <span className={`font-bold text-[10px] ${isDoneCol ? 'text-slate-500' : 'text-blue-400'}`}>
            {task.requirementId}
          </span>
          <span className="text-[10px] text-slate-550 font-medium">
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
          </span>
        </div>
        
        <h4 className={`font-bold ${isDoneCol ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
          {task.title}
        </h4>
        <p className={`text-[11px] leading-relaxed ${isDoneCol ? 'text-slate-550' : 'text-slate-400'}`}>
          {task.description}
        </p>
        
        <div className="flex justify-between items-center pt-2 border-t border-slate-850 mt-2 text-[10px] text-slate-500">
          <span>Assignee: {task.assignedTo || 'Unassigned'}</span>
          {task.ticketLink && (
            <a 
              href={task.ticketLink} 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-500 hover:underline flex items-center gap-0.5"
            >
              Link <ExternalLink size={8}/>
            </a>
          )}
        </div>

        {!isReadOnly && (
          <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-850/50 mt-1">
            {task.status !== 'BACKLOG' && (
              <button 
                onClick={() => moveTask(task.id, task.status, 'left')}
                className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-350 rounded"
                title="Move Left"
              >
                <ArrowLeft size={10} />
              </button>
            )}
            {task.status !== 'DONE' && (
              <button 
                onClick={() => moveTask(task.id, task.status, 'right')}
                className="p-1 hover:bg-slate-850 text-slate-500 hover:text-slate-300 rounded"
                title="Move Right"
              >
                <ArrowRight size={10} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* COLUMN 1: BACKLOG */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Backlog</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
            {remediations.filter(r => r.status === 'BACKLOG').length}
          </span>
        </div>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {remediations.filter(r => r.status === 'BACKLOG').length > 0 ? (
            remediations.filter(r => r.status === 'BACKLOG').map(task => renderCard(task, false))
          ) : (
            <p className="text-[11px] text-slate-650 italic text-center py-4">No tasks in backlog</p>
          )}
        </div>
      </div>

      {/* COLUMN 2: IN PROGRESS */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">In Progress</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-400 text-[10px]">
            {remediations.filter(r => r.status === 'IN_PROGRESS').length}
          </span>
        </div>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {remediations.filter(r => r.status === 'IN_PROGRESS').length > 0 ? (
            remediations.filter(r => r.status === 'IN_PROGRESS').map(task => renderCard(task, false))
          ) : (
            <p className="text-[11px] text-slate-650 italic text-center py-4">No tasks in progress</p>
          )}
        </div>
      </div>

      {/* COLUMN 3: DONE */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Done</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">
            {remediations.filter(r => r.status === 'DONE').length}
          </span>
        </div>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {remediations.filter(r => r.status === 'DONE').length > 0 ? (
            remediations.filter(r => r.status === 'DONE').map(task => renderCard(task, true))
          ) : (
            <p className="text-[11px] text-slate-650 italic text-center py-4">No completed tasks yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
