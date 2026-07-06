import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';

export default function LoginPage({ 
  loginEmail, 
  setLoginEmail, 
  loginPassword, 
  setLoginPassword, 
  loginError, 
  onSubmit 
}) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100 flex-col px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 max-w-md w-full space-y-6 shadow-2xl relative z-10 bg-slate-900/10">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <div className="p-3 bg-blue-600/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Shield size={36} className="animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-wide">OpenE8 Governance OS</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] mx-auto">
            Statutory ASD Essential Eight evidence collection, risk acceptances, and audit registers.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {loginError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-455 flex items-center gap-2">
              <AlertCircle size={14} className="text-rose-400" />
              <span className="text-rose-350">{loginError}</span>
            </div>
          )}

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Email Address</label>
            <input 
              id="login-email"
              data-testid="login-email"
              type="email" 
              value={loginEmail} 
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="assessor@opene8.gov.au"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Password</label>
            <input 
              id="login-password"
              data-testid="login-password"
              type="password" 
              value={loginPassword} 
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            data-testid="login-submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/15"
          >
            Sign In to Environment
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <span className="absolute bg-slate-950 px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">or</span>
            <div className="w-full border-t border-slate-800/80"></div>
          </div>

          <button
            type="button"
            onClick={() => {
              const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID || 'common';
              const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID || 'dummy-client-id';
              const redirectUri = import.meta.env.VITE_ENTRA_REDIRECT_URI || `${window.location.origin}/auth/callback`;
              const scope = encodeURIComponent('openid profile email');
              const state = 'opene8-state-auth';
              const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${scope}&state=${state}`;
              window.location.href = authUrl;
            }}
            data-testid="login-entra"
            className="w-full py-2.5 bg-slate-900/60 border border-slate-850 hover:bg-slate-900 hover:border-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2.5 shadow-md"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
              <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
              <path d="M0 12H11V23H0V12Z" fill="#00A4EF"/>
              <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
            </svg>
            Sign in with Microsoft Entra ID
          </button>
        </form>

        <div className="border-t border-slate-800/80 pt-4 text-center">
          <p className="text-[10px] text-slate-500 leading-normal">
            <strong>Demo credentials:</strong><br />
            Assessor: <code>assessor@opene8.gov.au</code> / <code>Password123</code><br />
            Owner: <code>owner@opene8.gov.au</code> / <code>Password123</code><br />
            Auditor: <code>auditor@opene8.gov.au</code> / <code>Password123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
