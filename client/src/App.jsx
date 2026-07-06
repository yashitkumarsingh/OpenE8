import React, { useState, useEffect } from 'react';
import { 
  Shield, LayoutDashboard, Globe, FileCheck, AlertTriangle, 
  CheckCircle2, XCircle, Clock, BookOpen, FileText, Settings, 
  Plus, Users, Terminal, Check, Edit3, Trash2, ArrowRight, 
  ExternalLink, Upload, AlertCircle, RefreshCw, BarChart2, PlusCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, RadialBarChart, RadialBar } from 'recharts';

import { useApi } from './hooks/useApi';
import StatusBadge from './components/shared/StatusBadge';
import RiskBadge from './components/shared/RiskBadge';
import Modal from './components/shared/Modal';
import LoginPage from './components/auth/LoginPage';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import DashboardTab from './components/dashboard/DashboardTab';
import ReportsTab from './components/reports/ReportsTab';
import ExceptionsTab from './components/exceptions/ExceptionsTab';
import RemediationsTab from './components/remediation/RemediationsTab';
import AuditTab from './components/audit/AuditTab';
import KanbanBoard from './components/remediation/KanbanBoard';
import AssessmentWorkspace from './components/assessment/AssessmentWorkspace';
import ExceptionModal from './components/exceptions/ExceptionModal';
import ExceptionCard from './components/exceptions/ExceptionCard';
import RemediationModal from './components/remediation/RemediationModal';
import EvidenceModal from './components/evidence/EvidenceModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [catalog, setCatalog] = useState([]);
  const [systems, setSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [remediations, setRemediations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemForm, setSystemForm] = useState({
    name: '', businessOwner: '', technicalOwner: '', environment: 'Prod',
    platform: 'M365', dataSensitivity: 'Official', targetMaturity: 'ML2',
    outOfScopeItems: '', scopeJustification: ''
  });
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [activeStage, setActiveStage] = useState(1); // Stage 1-6 for Assessment
  const [selectedReqId, setSelectedReqId] = useState(null); // For Evidence Graph & Detail

  // Modals / Creators
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [showRemediationModal, setShowRemediationModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  // Form states
  const [evidenceForm, setEvidenceForm] = useState({
    name: '', type: 'FILE', owner: '', sourceSystem: '', confidenceLevel: 'HIGH', notes: '', filename: '', base64: ''
  });
  const [exceptionForm, setExceptionForm] = useState({
    requirementId: '', riskStatement: '', compensatingControl: '', residualRisk: 'MEDIUM', approvedBy: '', reviewDate: '', expiryDate: ''
  });
  const [remediationForm, setRemediationForm] = useState({
    requirementId: '', title: '', description: '', assignedTo: '', dueDate: '', ticketLink: ''
  });

  // Report State
  const [reportData, setReportData] = useState(null);

  // Importer state
  const [evidenceTab, setEvidenceTab] = useState('list'); // 'list' | 'import'
  const [importerType, setImporterType] = useState('ENTRA_MFA'); // 'ENTRA_MFA' | 'NESSUS_PATCH'
  const [importerLoading, setImporterLoading] = useState(false);
  const [importerSummary, setImporterSummary] = useState(null);
  const [importerFile, setImporterFile] = useState({ filename: '', base64: '' });
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [importerMapping, setImporterMapping] = useState({
    severity: '', host: '', cve: '', description: '', solution: ''
  });

  // Review view state: 'graph' | 'table'
  const [reviewView, setReviewView] = useState('graph');

  const [token, setToken] = useState(localStorage.getItem('opene8_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('opene8_user') || 'null'));

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Evidence Verification State
  const [verifyStates, setVerifyStates] = useState({});

  // Fetch initial data
  useEffect(() => {
    if (token) {
      fetchCatalog();
      fetchSystems();
    }
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      handleEntraCallback(code);
    } else if (!token) {
      setLoading(false);
    }
  }, []);

  const handleEntraCallback = async (code) => {
    setLoading(true);
    setLoginError('');
    try {
      const redirectUri = import.meta.env.VITE_ENTRA_REDIRECT_URI || `${window.location.origin}/auth/callback`;
      const res = await fetch('/api/auth/entra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('opene8_token', data.token);
        localStorage.setItem('opene8_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      } else {
        setLoginError(data.error || 'Failed to exchange authorization code with Entra ID.');
      }
    } catch (err) {
      setLoginError('Error connecting to authentication endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const apiFetch = async (url, options = {}) => {
    const headers = options.headers ? { ...options.headers } : {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!(options.body instanceof FormData) && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem('opene8_token');
      localStorage.removeItem('opene8_user');
      setToken('');
      setUser(null);
      throw new Error('Session expired. Please log in.');
    }
    return res;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('opene8_token', data.token);
        localStorage.setItem('opene8_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      } else {
        setLoginError(data.error || 'Invalid email or password credentials');
      }
    } catch (err) {
      setLoginError('Error connecting to authentication endpoint.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('opene8_token');
    localStorage.removeItem('opene8_user');
    setToken('');
    setUser(null);
    setCatalog([]);
    setSystems([]);
    setSelectedSystem(null);
  };

  const handleVerifyEvidence = async (evId) => {
    setVerifyStates(prev => ({ ...prev, [evId]: { loading: true } }));
    try {
      const res = await apiFetch(`/api/evidence/${evId}/verify`, { method: 'POST' });
      const data = await res.json();
      setVerifyStates(prev => ({ 
        ...prev, 
        [evId]: { 
          loading: false, 
          verified: data.verified, 
          error: data.error || null,
          message: data.message || null
        } 
      }));
    } catch (err) {
      setVerifyStates(prev => ({ 
        ...prev, 
        [evId]: { loading: false, verified: false, error: err.message } 
      }));
    }
  };

  const onDeleteEvidence = async (evidenceId) => {
    try {
      await apiFetch(`/api/evidence/${evidenceId}`, {
        method: 'DELETE'
      });
      selectSystem(selectedSystem.id);
    } catch (err) {
      console.error('Error deleting evidence:', err);
    }
  };

  const onDeleteException = async (exceptionId) => {
    try {
      await apiFetch(`/api/exceptions/${exceptionId}`, {
        method: 'DELETE'
      });
      selectSystem(selectedSystem.id);
    } catch (err) {
      console.error('Error deleting exception:', err);
    }
  };

  const handleDownloadAuditLog = async () => {
    if (!selectedSystem) return;
    try {
      const res = await apiFetch(`/api/systems/${selectedSystem.id}/audit/export`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedSystem.name.replace(/[^a-zA-Z0-9]/g, '_')}_audit_log.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading audit logs: ' + err.message);
    }
  };

  const handleSignOff = async (role, signature) => {
    if (!activeAssessment) return;
    try {
      const res = await apiFetch(`/api/assessments/${activeAssessment.id}/sign-off`, {
        method: 'POST',
        body: { role, signature }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign off');
      }
      
      // Update assessment local state or re-fetch system
      if (selectedSystem) {
        await selectSystem(selectedSystem.id);
      }
      alert(`Successfully signed off as ${role}!`);
    } catch (err) {
      alert('Error signing off assessment: ' + err.message);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await apiFetch('/api/catalog');
      const data = await res.json();
      setCatalog(data);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    }
  };

  const fetchSystems = async (defaultSelectId) => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/systems');
      const data = await res.json();
      setSystems(data);
      if (defaultSelectId) {
        selectSystem(defaultSelectId);
      } else if (data.length > 0) {
        selectSystem(data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching systems:', err);
      setLoading(false);
    }
  };

  const selectSystem = async (id) => {
    try {
      const res = await apiFetch(`/api/systems/${id}`);
      const data = await res.json();
      setSelectedSystem(data);
      setExceptions(data.exceptions || []);
      setRemediations(data.remediations || []);
      
      const latest = data.assessments?.[0];
      if (latest) {
        setActiveAssessment(latest);
        // Find first requirement to show in Evidence Graph
        if (catalog.length > 0 && catalog[0].requirements.length > 0) {
          setSelectedReqId(catalog[0].requirements[0].id);
        }
      } else {
        setActiveAssessment(null);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching system detail:', err);
      setLoading(false);
    }
  };

  const handleCreateSystem = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/systems', {
        method: 'POST',
        body: systemForm
      });
      const data = await res.json();
      setShowSystemModal(false);
      setSystemForm({
        name: '', businessOwner: '', technicalOwner: '', environment: 'Prod',
        platform: 'M365', dataSensitivity: 'Official', targetMaturity: 'ML2',
        outOfScopeItems: '', scopeJustification: ''
      });
      fetchSystems(data.id);
    } catch (err) {
      console.error('Error creating system:', err);
    }
  };

  const handleUpdateScope = async (e) => {
    e.preventDefault();
    if (!selectedSystem) return;
    try {
      const res = await apiFetch(`/api/systems/${selectedSystem.id}`, {
        method: 'PUT',
        body: {
          businessOwner: selectedSystem.businessOwner,
          technicalOwner: selectedSystem.technicalOwner,
          environment: selectedSystem.environment,
          platform: selectedSystem.platform,
          dataSensitivity: selectedSystem.dataSensitivity,
          targetMaturity: selectedSystem.targetMaturity,
          outOfScopeItems: selectedSystem.outOfScopeItems,
          scopeJustification: selectedSystem.scopeJustification
        }
      });
      alert('Scope successfully updated and saved.');
      selectSystem(selectedSystem.id);
    } catch (err) {
      console.error('Error updating scope:', err);
    }
  };

  const handleUpdateControlTest = async (testId, status, notes) => {
    try {
      await apiFetch(`/api/control-tests/${testId}`, {
        method: 'PUT',
        body: { status, notes, reviewedBy: user?.name || 'Assessor' }
      });
      selectSystem(selectedSystem.id);
    } catch (err) {
      console.error('Error updating control test:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEvidenceForm({
        ...evidenceForm,
        filename: file.name,
        base64: reader.result.split(',')[1]
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddEvidence = async (e) => {
    e.preventDefault();
    const activeTest = activeAssessment.testResults.find(r => r.requirementId === selectedReqId);
    if (!activeTest) return;

    try {
      const payload = {
        name: evidenceForm.name,
        type: evidenceForm.type,
        owner: evidenceForm.owner || user?.name || 'System Owner',
        sourceSystem: evidenceForm.sourceSystem,
        confidenceLevel: evidenceForm.confidenceLevel,
        notes: evidenceForm.notes
      };

      if (evidenceForm.base64) {
        payload.fileData = {
          base64: evidenceForm.base64,
          filename: evidenceForm.filename
        };
      }

      await apiFetch(`/api/control-tests/${activeTest.id}/evidence`, {
        method: 'POST',
        body: payload
      });

      setShowEvidenceModal(false);
      setEvidenceForm({
        name: '', type: 'FILE', owner: '', sourceSystem: '', confidenceLevel: 'HIGH', notes: '', filename: '', base64: ''
      });
      selectSystem(selectedSystem.id);
    } catch (err) {
      console.error('Error adding evidence:', err);
    }
  };

  const handleCreateException = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/systems/${selectedSystem.id}/exceptions`, {
        method: 'POST',
        body: { ...exceptionForm, approvedBy: exceptionForm.approvedBy || user?.name || 'CISO Office', requirementId: selectedReqId }
      });
      setShowExceptionModal(false);
      setExceptionForm({
        requirementId: '', riskStatement: '', compensatingControl: '', residualRisk: 'MEDIUM', approvedBy: '', reviewDate: '', expiryDate: ''
      });
      selectSystem(selectedSystem.id);
    } catch (err) {
      console.error('Error creating exception:', err);
    }
  };

  const handleCreateRemediation = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/systems/${selectedSystem.id}/remediations`, {
        method: 'POST',
        body: { ...remediationForm, requirementId: selectedReqId }
      });
      setShowRemediationModal(false);
      setRemediationForm({
        requirementId: '', title: '', description: '', assignedTo: '', dueDate: '', ticketLink: ''
      });
      selectSystem(selectedSystem.id);
    } catch (err) {
      console.error('Error creating remediation task:', err);
    }
  };

  const handleImporterFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImporterFile({
        filename: file.name,
        base64: reader.result.split(',')[1]
      });

      if (importerType === 'CUSTOM_CSV') {
        const textReader = new FileReader();
        textReader.onload = () => {
          const firstLine = textReader.result.split(/\r?\n/)[0];
          const headers = firstLine.split(',').map(h => h.replace(/^"|"$/g, '').trim());
          setCsvHeaders(headers);
        };
        textReader.readAsText(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunImport = async (e) => {
    e.preventDefault();
    if (!importerFile.base64 || !activeAssessment) return;
    try {
      setImporterLoading(true);
      setImporterSummary(null);
      
      const payload = {
        fileType: importerType,
        fileData: importerFile.base64,
        filename: importerFile.filename
      };

      if (importerType === 'CUSTOM_CSV') {
        payload.mapping = importerMapping;
      }

      const res = await apiFetch(`/api/assessments/${activeAssessment.id}/import`, {
        method: 'POST',
        body: payload
      });
      const data = await res.json();
      if (res.ok) {
        setImporterSummary(data.summary);
        setImporterFile({ filename: '', base64: '' });
        setCsvHeaders([]);
        setImporterMapping({ severity: '', host: '', cve: '', description: '', solution: '' });
        // Refresh system details
        selectSystem(selectedSystem.id);
      } else {
        alert(data.error || 'Import failed');
      }
      setImporterLoading(false);
    } catch (err) {
      console.error('Error running importer:', err);
      setImporterLoading(false);
      alert('Error connecting to importer engine.');
    }
  };

  const generateReport = async () => {
    try {
      const res = await apiFetch(`/api/systems/${selectedSystem.id}/report`);
      const data = await res.json();
      setReportData(data);
      setActiveTab('reports');
    } catch (err) {
      console.error('Error generating report:', err);
    }
  };

  // Helpers for formatting
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PASSED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max"><CheckCircle2 size={12}/> PASS</span>;
      case 'PARTIAL':
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-max"><Clock size={12}/> PARTIAL</span>;
      case 'FAILED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-max"><XCircle size={12}/> FAIL</span>;
      case 'MET_VIA_COMPENSATING_CONTROL':
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1 w-max"><CheckCircle2 size={12}/> COMPENSATED</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-500/20 text-slate-400 border border-slate-500/30 flex items-center gap-1 w-max">N/A</span>;
    }
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'EXTREME':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-600/35 text-red-200 border border-red-500">EXTREME</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40">MEDIUM</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/25 text-blue-300 border border-blue-500/40">LOW</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100 flex-col gap-3">
        <RefreshCw className="animate-spin text-blue-500" size={32} />
        <span className="font-medium text-slate-400">Loading OpenE8 workspace...</span>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <LoginPage
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        onSubmit={handleLogin}
      />
    );
  }

  // Get current requirement detail object
  const currentReq = catalog.flatMap(s => s.requirements).find(r => r.id === selectedReqId);
  const currentTest = activeAssessment?.testResults?.find(tr => tr.requirementId === selectedReqId);
  const currentExceptions = exceptions.filter(ex => ex.requirementId === selectedReqId);
  const currentRemediations = remediations.filter(rem => rem.requirementId === selectedReqId);

  // Calculations for Charts
  const chartData = selectedSystem?.maturity ? Object.entries(selectedSystem.maturity.strategyScores).map(([name, val]) => {
    const valMap = { 'ML0': 0, 'ML1': 1, 'ML2': 2, 'ML3': 3 };
    const targetMap = { 'ML1': 1, 'ML2': 2, 'ML3': 3 };
    return {
      name: name.substring(0, 16) + '...',
      fullName: name,
      Current: valMap[val] || 0,
      Target: targetMap[selectedSystem.targetMaturity] || 2
    };
  }) : [];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar 
        systems={systems}
        selectedSystem={selectedSystem}
        onSelectSystem={selectSystem}
        activeTab={activeTab}
        onTabChange={(id) => {
          if (id === 'reports') {
            generateReport();
          } else {
            setActiveTab(id);
          }
        }}
        user={user}
        onLogout={handleLogout}
        onAddSystemClick={() => setShowSystemModal(true)}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        
        {/* TOP STATUS BAR */}
        <TopBar selectedSystem={selectedSystem} />

        {/* CONTENT DESK */}
        <div className="flex-1 overflow-y-auto p-8">

          {/* VIEW: DASHBOARD */}
          {activeTab === 'dashboard' && selectedSystem && (
            <DashboardTab 
              selectedSystem={selectedSystem}
              exceptions={exceptions}
              remediations={remediations}
              activeAssessment={activeAssessment}
              chartData={chartData}
            />
          )}

          {/* VIEW: SYSTEMS & SCOPE */}
          {activeTab === 'systems' && selectedSystem && (
            <div className="glass-panel p-8 rounded-xl border border-slate-800 max-w-3xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">Scope Builder</h2>
                <p className="text-xs text-slate-400 mt-1">Define the assessment boundary, platforms, environment scopes, and out-of-scope exceptions per the ASD Guidelines.</p>
              </div>

              <form onSubmit={handleUpdateScope} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">System Name</label>
                    <input 
                      type="text" 
                      value={selectedSystem.name} 
                      disabled
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-400 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Target Maturity Level</label>
                    <select
                      value={selectedSystem.targetMaturity}
                      disabled={user?.role === 'AUDITOR'}
                      onChange={(e) => setSelectedSystem({ ...selectedSystem, targetMaturity: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="ML1">Maturity Level 1 (ML1)</option>
                      <option value="ML2">Maturity Level 2 (ML2)</option>
                      <option value="ML3">Maturity Level 3 (ML3)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Business Owner</label>
                    <input 
                      type="text" 
                      value={selectedSystem.businessOwner} 
                      disabled={user?.role === 'AUDITOR'}
                      onChange={(e) => setSelectedSystem({ ...selectedSystem, businessOwner: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Technical Owner</label>
                    <input 
                      type="text" 
                      value={selectedSystem.technicalOwner} 
                      disabled={user?.role === 'AUDITOR'}
                      onChange={(e) => setSelectedSystem({ ...selectedSystem, technicalOwner: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Environment</label>
                    <input 
                      type="text" 
                      value={selectedSystem.environment} 
                      disabled={user?.role === 'AUDITOR'}
                      onChange={(e) => setSelectedSystem({ ...selectedSystem, environment: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g. Prod, Non-Prod, AWS Multi-tenant"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Data Sensitivity</label>
                    <select
                      value={selectedSystem.dataSensitivity}
                      disabled={user?.role === 'AUDITOR'}
                      onChange={(e) => setSelectedSystem({ ...selectedSystem, dataSensitivity: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="Official">OFFICIAL</option>
                      <option value="Sensitive">OFFICIAL: Sensitive</option>
                      <option value="Protected">PROTECTED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Scope Boundary & Platform Stack</label>
                  <input 
                    type="text" 
                    value={selectedSystem.platform} 
                    disabled={user?.role === 'AUDITOR'}
                    onChange={(e) => setSelectedSystem({ ...selectedSystem, platform: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g. Windows Workstations, Entra ID, Linux servers, Azure blob storage"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Out of Scope Assets</label>
                  <textarea 
                    value={selectedSystem.outOfScopeItems || ''} 
                    data-testid="scope-input-outOfScopeItems"
                    disabled={user?.role === 'AUDITOR'}
                    onChange={(e) => setSelectedSystem({ ...selectedSystem, outOfScopeItems: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 h-20 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g. legacy reporting database servers"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Out of Scope Justification</label>
                  <textarea 
                    value={selectedSystem.scopeJustification || ''} 
                    data-testid="scope-input-scopeJustification"
                    disabled={user?.role === 'AUDITOR'}
                    onChange={(e) => setSelectedSystem({ ...selectedSystem, scopeJustification: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 h-20 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Provide operational risk justifications..."
                  />
                </div>

                {user?.role !== 'AUDITOR' && (
                  <button
                    type="submit"
                    data-testid="save-scope-button"
                    className="bg-blue-600 hover:bg-blue-500 text-xs font-semibold py-2 px-4 rounded-md tracking-wider transition-colors"
                  >
                    Save Scope Details
                  </button>
                )}
              </form>
            </div>
          )}

          {/* VIEW: ASSESSMENT WORKSPACE */}
          {activeTab === 'assessment' && selectedSystem && activeAssessment && (
            <AssessmentWorkspace
              activeStage={activeStage}
              setActiveStage={setActiveStage}
              catalog={catalog}
              selectedReqId={selectedReqId}
              setSelectedReqId={setSelectedReqId}
              activeAssessment={activeAssessment}
              selectedSystem={selectedSystem}
              setActiveTab={setActiveTab}
              user={user}
              currentReq={currentReq}
              currentTest={currentTest}
              currentExceptions={currentExceptions}
              currentRemediations={currentRemediations}
              evidenceForm={evidenceForm}
              setEvidenceForm={setEvidenceForm}
              handleFileChange={handleFileChange}
              handleAddEvidence={handleAddEvidence}
              setShowEvidenceModal={setShowEvidenceModal}
              evidenceTab={evidenceTab}
              setEvidenceTab={setEvidenceTab}
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
              reviewView={reviewView}
              setReviewView={setReviewView}
              handleUpdateControlTest={handleUpdateControlTest}
              exceptionForm={exceptionForm}
              setExceptionForm={setExceptionForm}
              setShowExceptionModal={setShowExceptionModal}
              onDeleteException={onDeleteException}
              remediationForm={remediationForm}
              setRemediationForm={setRemediationForm}
              setShowRemediationModal={setShowRemediationModal}
              handleSignOff={handleSignOff}
              generateReport={generateReport}
              csvHeaders={csvHeaders}
              importerMapping={importerMapping}
              setImporterMapping={setImporterMapping}
            />
          )}

          {/* VIEW: EXCEPTIONS REGISTER */}
          {activeTab === 'exceptions' && selectedSystem && (
            <ExceptionsTab 
              exceptions={exceptions} 
              selectedSystem={selectedSystem} 
            />
          )}

          {/* VIEW: REMEDIATION BOARD */}
          {activeTab === 'remediations' && selectedSystem && (
            <RemediationsTab 
              remediations={remediations} 
              onUpdateStatus={handleUpdateRemediationStatus} 
              user={user} 
            />
          )}

          {/* VIEW: EXECUTIVE REPORTS */}
          {activeTab === 'reports' && reportData && (
            <ReportsTab 
              reportData={reportData} 
              selectedSystem={selectedSystem}
              exceptions={exceptions}
              remediations={remediations}
              activeAssessment={activeAssessment}
              onCopyMarkdown={() => {
                navigator.clipboard.writeText(reportData.markdown);
                alert('Markdown report copied to clipboard!');
              }}
            />
          )}

          {/* VIEW: AUDIT LOGS */}
          {activeTab === 'audit' && selectedSystem && (
            <AuditTab 
              selectedSystem={selectedSystem}
              handleDownloadAuditLog={handleDownloadAuditLog}
            />
          )}

        </div>
      </main>

      {/* --- MODALS --- */}

      {/* MODAL: ADD SYSTEM */}
      {showSystemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Create System Scope</h3>
              <button onClick={() => setShowSystemModal(false)} className="text-slate-500 hover:text-slate-200">X</button>
            </div>
            <form onSubmit={handleCreateSystem} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">System Name</label>
                <input 
                  type="text" 
                  value={systemForm.name} 
                  data-testid="add-system-name"
                  onChange={(e) => setSystemForm({ ...systemForm, name: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="Records Management System"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Business Owner</label>
                  <input 
                    type="text" 
                    value={systemForm.businessOwner} 
                    data-testid="add-system-businessOwner"
                    onChange={(e) => setSystemForm({ ...systemForm, businessOwner: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                    placeholder="Corporate Services"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Technical Owner</label>
                  <input 
                    type="text" 
                    value={systemForm.technicalOwner} 
                    data-testid="add-system-technicalOwner"
                    onChange={(e) => setSystemForm({ ...systemForm, technicalOwner: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                    placeholder="ICT Operations"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Environment</label>
                  <input 
                    type="text" 
                    value={systemForm.environment} 
                    data-testid="add-system-environment"
                    onChange={(e) => setSystemForm({ ...systemForm, environment: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                    placeholder="Prod"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Target Maturity</label>
                  <select 
                    value={systemForm.targetMaturity} 
                    data-testid="add-system-targetMaturity"
                    onChange={(e) => setSystemForm({ ...systemForm, targetMaturity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="ML1">ML1</option>
                    <option value="ML2">ML2</option>
                    <option value="ML3">ML3</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                data-testid="add-system-submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded transition-colors uppercase tracking-wider"
              >
                Create System Scope
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EVIDENCE */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Upload Evidence File</h3>
              <button onClick={() => setShowEvidenceModal(false)} className="text-slate-500 hover:text-slate-200">X</button>
            </div>
            <form onSubmit={handleAddEvidence} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Evidence Name</label>
                <input 
                  type="text" 
                  value={evidenceForm.name} 
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, name: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  placeholder="e.g. Entra CA Policy Screenshot"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Type</label>
                  <select 
                    value={evidenceForm.type} 
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="FILE">File / Document</option>
                    <option value="API_EXPORT">API Export JSON/CSV</option>
                    <option value="SCRIPT_OUTPUT">Script Console Output</option>
                    <option value="ATTESTATION">Manual Attestation</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Confidence</label>
                  <select 
                    value={evidenceForm.confidenceLevel} 
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, confidenceLevel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="HIGH">High Confidence</option>
                    <option value="MEDIUM">Medium Confidence</option>
                    <option value="LOW">Low Confidence</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Owner</label>
                  <input 
                    type="text" 
                    value={evidenceForm.owner} 
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, owner: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                    placeholder="e.g. SecOps Lead"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Source System</label>
                  <input 
                    type="text" 
                    value={evidenceForm.sourceSystem} 
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, sourceSystem: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                    placeholder="e.g. Entra ID / Sentinel"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Select File</label>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-350 hover:file:bg-slate-700"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Notes / Expiry details</label>
                <textarea 
                  value={evidenceForm.notes} 
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 h-16 focus:outline-none"
                  placeholder="Additional descriptions..."
                />
              </div>
              <button 
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded transition-colors uppercase tracking-wider"
              >
                Upload Evidence
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXCEPTION */}
      {showExceptionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Log Exception Request ({selectedReqId})</h3>
              <button onClick={() => setShowExceptionModal(false)} className="text-slate-500 hover:text-slate-200">X</button>
            </div>
            <form onSubmit={handleCreateException} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Risk Statement</label>
                <textarea 
                  value={exceptionForm.riskStatement} 
                  data-testid="exception-input-riskStatement"
                  onChange={(e) => setExceptionForm({ ...exceptionForm, riskStatement: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 h-16 focus:outline-none"
                  placeholder="Identify risks caused by not meeting control requirement..."
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Compensating Control</label>
                <textarea 
                  value={exceptionForm.compensatingControl} 
                  data-testid="exception-input-compensatingControl"
                  onChange={(e) => setExceptionForm({ ...exceptionForm, compensatingControl: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 h-16 focus:outline-none"
                  placeholder="Detail alternate mitigations currently deployed..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Residual Risk</label>
                  <select 
                    value={exceptionForm.residualRisk} 
                    data-testid="exception-input-residualRisk"
                    onChange={(e) => setExceptionForm({ ...exceptionForm, residualRisk: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="LOW">Low Residual Risk</option>
                    <option value="MEDIUM">Medium Residual Risk</option>
                    <option value="HIGH">High Residual Risk</option>
                    <option value="EXTREME">Extreme Residual Risk</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Approved By</label>
                  <input 
                    type="text" 
                    value={exceptionForm.approvedBy} 
                    data-testid="exception-input-approvedBy"
                    onChange={(e) => setExceptionForm({ ...exceptionForm, approvedBy: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                    placeholder="CISO / Risk Committee"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Review Date</label>
                  <input 
                    type="date" 
                    value={exceptionForm.reviewDate} 
                    data-testid="exception-input-reviewDate"
                    onChange={(e) => setExceptionForm({ ...exceptionForm, reviewDate: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    value={exceptionForm.expiryDate} 
                    data-testid="exception-input-expiryDate"
                    onChange={(e) => setExceptionForm({ ...exceptionForm, expiryDate: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
              <button 
                type="submit"
                data-testid="exception-submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white rounded transition-colors uppercase tracking-wider"
              >
                Log Exception Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD REMEDIATION */}
      {showRemediationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Create Remediation Task ({selectedReqId})</h3>
              <button onClick={() => setShowRemediationModal(false)} className="text-slate-500 hover:text-slate-200">X</button>
            </div>
            <form onSubmit={handleCreateRemediation} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Task Title</label>
                <input 
                  type="text" 
                  value={remediationForm.title} 
                  onChange={(e) => setRemediationForm({ ...remediationForm, title: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  placeholder="e.g. Set up Entra JIT for Global Admins"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Description</label>
                <textarea 
                  value={remediationForm.description} 
                  onChange={(e) => setRemediationForm({ ...remediationForm, description: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 h-16 focus:outline-none"
                  placeholder="Detail work scope required to meet compliance target..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Assigned To</label>
                  <input 
                    type="text" 
                    value={remediationForm.assignedTo} 
                    onChange={(e) => setRemediationForm({ ...remediationForm, assignedTo: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                    placeholder="DevOps Team / Eng Name"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Due Date</label>
                  <input 
                    type="date" 
                    value={remediationForm.dueDate} 
                    onChange={(e) => setRemediationForm({ ...remediationForm, dueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Ticket Reference Link</label>
                <input 
                  type="text" 
                  value={remediationForm.ticketLink} 
                  onChange={(e) => setRemediationForm({ ...remediationForm, ticketLink: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  placeholder="e.g. https://jira.internal/browse/SEC-102"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white rounded transition-colors uppercase tracking-wider"
              >
                Log Remediation Action
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
