import React from 'react';
import { 
  Shield, LayoutDashboard, Globe, FileCheck, AlertTriangle, 
  Terminal, FileText, BookOpen, Plus 
} from 'lucide-react';

export default function Sidebar({ 
  systems, 
  selectedSystem, 
  onSelectSystem, 
  activeTab, 
  onTabChange, 
  user, 
  onLogout, 
  onAddSystemClick 
}) {
  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/35">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">OpenE8</h1>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Governance OS</p>
        </div>
      </div>

      <div className="p-4 border-b border-slate-800/50">
        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Scope Boundary</label>
        <select 
          id="sidebar-system-select"
          data-testid="system-selector"
          value={selectedSystem?.id || ''} 
          onChange={(e) => onSelectSystem(e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-md py-1.5 px-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
        >
          {systems.map(sys => (
            <option key={sys.id} value={sys.id}>{sys.name}</option>
          ))}
        </select>
        {user?.role === 'ASSESSOR' && (
          <button 
            onClick={onAddSystemClick}
            data-testid="add-system-button"
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md border border-dashed border-slate-800 hover:border-slate-700 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Plus size={12}/> Add New System
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'systems', label: 'Systems & Scope', icon: Globe },
          { id: 'assessment', label: 'Assessment Desk', icon: FileCheck },
          { id: 'exceptions', label: 'Exceptions Register', icon: AlertTriangle },
          { id: 'remediations', label: 'Remediation Board', icon: Terminal },
          { id: 'reports', label: 'Executive Reports', icon: FileText },
          { id: 'audit', label: 'Assessor Audit Logs', icon: BookOpen }
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              data-testid={`nav-tab-${item.id}`}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400 border-l-[3px] border-blue-500 pl-2 rounded-l-none' 
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-800/60 bg-slate-900/40 p-4 space-y-3 shrink-0">
        <div className="flex items-center gap-3 text-slate-500">
          <BookOpen size={16} />
          <span className="text-[10px] font-bold uppercase tracking-wider">ASD ISM Oct 2024</span>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-800/60 pt-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-black uppercase shrink-0">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-200 truncate">{user?.name || 'Anonymous User'}</p>
            <span className={`inline-block text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded leading-none mt-1 ${
              user?.role === 'ASSESSOR' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
              user?.role === 'SYSTEM_OWNER' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
              'bg-slate-800 text-slate-400 border border-slate-750'
            }`}>
              {user?.role || 'AUDITOR'}
            </span>
          </div>
        </div>
        <button 
          onClick={onLogout}
          data-testid="logout-button"
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/20 text-[10px] font-bold text-slate-400 hover:text-rose-400 transition-all uppercase tracking-wide"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
