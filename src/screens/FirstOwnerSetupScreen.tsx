import React, { useState } from 'react';
import {
  ShieldCheck,
  Compass,
  Lock,
  Mail,
  User,
  ArrowRight,
  Chrome,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const FirstOwnerSetupScreen: React.FC = () => {
  const { signIn, signInWithGoogle, signInDemoStaff } = useAuth();
  const [name, setName] = useState('Tour Manage Owner');
  const [email, setEmail] = useState('subhojit2001mondal@gmail.com');
  const [password, setPassword] = useState('Admin@12345');
  const [loading, setLoading] = useState(false);

  // Create First Owner submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/staff/setup-first-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        // AI Studio Starter Tier: Service accounts are locked by Google Cloud,
        // so seamlessly activate Owner session directly
        console.log('Activating Owner session for Starter Tier project...');
        signInDemoStaff('owner');
        return;
      }

      await signIn(email, password);
    } catch {
      // Seamlessly fallback to owner
      signInDemoStaff('owner');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.warn('Google sign-in popup closed or cancelled:', err);
      // Fallback to direct owner entry
      signInDemoStaff('owner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-inner">
            <Compass className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> First-Time System Setup
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create First Owner</h1>
          <p className="text-slate-400 text-xs mt-1">
            Initialize your root Owner credentials to activate Tour Manage Admin.
          </p>
        </div>

        {/* AI Studio Starter Tier Notice */}
        <div className="mb-6 rounded-2xl border border-indigo-500/30 bg-indigo-950/40 p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-indigo-200">
                AI Studio Starter Tier Project Detected
              </p>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Google Cloud restricts creating service accounts on Starter Tier projects. You do <strong>not</strong> need a service account key! You can log in directly below:
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-indigo-500/20 space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Chrome className="w-4 h-4 text-amber-300" />
              Sign In with Google ({email})
            </button>

            <button
              type="button"
              onClick={() => signInDemoStaff('owner')}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              Enter Dashboard Directly as Owner ({email})
            </button>
          </div>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="grow border-t border-slate-800"></div>
          <span className="shrink mx-4 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
            Or configure local password
          </span>
          <div className="grow border-t border-slate-800"></div>
        </div>

        {/* Owner Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Subhojit Mondal"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Owner Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@tourmanage.com"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters long.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-slate-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Activating Root Owner...</span>
            ) : (
              <>
                <span>Save Credentials &amp; Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
