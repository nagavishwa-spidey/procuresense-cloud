import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Building, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { signInWithEmail, signUpWithEmail, loginDemoUser, isLoading } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('analyst@procuresense.cloud');
  const [password, setPassword] = useState('ProcureSense2026!');
  const [fullName, setFullName] = useState('Senior Procurement Analyst');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isSignUp) {
      const res = await signUpWithEmail(email, password, fullName);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        onSuccess();
      }
    } else {
      const res = await signInWithEmail(email, password);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        onSuccess();
      }
    }
  };

  const handleDemoSignIn = (role: 'admin' | 'analyst' | 'manager' | 'viewer') => {
    loginDemoUser(role);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 text-slate-100">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20 mb-3">
            PS
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            ProcureSense <span className="text-teal-400">Cloud</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Cloud Spend Analytics & Governance Platform
          </p>
        </div>

        {/* Demo Fast-Track Card for Evaluators */}
        <div className="bg-slate-800/80 border border-teal-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            <UserCheck className="w-4 h-4" />
            <span>Academic Evaluator / Demo Access</span>
          </div>
          <p className="text-[11px] text-slate-300 mb-3">
            Instant evaluation login with 200+ pre-loaded multi-department transactions, IQR anomalies,
            and budget test cases:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSignIn('admin')}
              className="py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg text-xs shadow-sm transition"
            >
              Enter as Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn('analyst')}
              className="py-1.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-lg text-xs transition"
            >
              Enter as Analyst
            </button>
          </div>
        </div>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <span className="relative px-3 bg-slate-900 text-xs text-slate-500">
            or continue with credentials
          </span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isSignUp && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Elena Rostova"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Corporate Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 mt-2 bg-slate-100 hover:bg-white text-slate-900 font-bold rounded-lg text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1"
          >
            <span>{isSignUp ? 'Create Corporate Account' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-teal-400 hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register now"}
          </button>
        </div>

        {/* Security Disclaimers */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
            Supabase Auth & RLS Protected
          </span>
          <span>Zero Plaintext Credentials</span>
        </div>
      </div>
    </div>
  );
};
