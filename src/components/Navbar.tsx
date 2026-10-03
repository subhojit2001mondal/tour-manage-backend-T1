import React from 'react';
import { Compass, LogOut, Shield, ShieldAlert, Sparkles, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  hasDemoData?: boolean;
  onOpenAndroidTester?: () => void;
  waitingChatsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasDemoData = false,
  onOpenAndroidTester,
  waitingChatsCount = 0,
}) => {
  const { currentUser, staffProfile, role, isOwner, signOut } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-6 shadow-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Tour Manage <span className="text-indigo-600 font-bold">Admin</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                India Ops
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Single Source of Truth for Tour Manage.com</p>
          </div>
        </div>

        {hasDemoData && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Demo Data Active</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onOpenAndroidTester && (
          <button
            type="button"
            onClick={onOpenAndroidTester}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
          >
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Android App Tester</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* User profile & role */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {staffProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0]}
            </p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              {isOwner ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 uppercase">
                  <ShieldAlert className="w-2.5 h-2.5" /> Owner
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">
                  <Shield className="w-2.5 h-2.5" /> Support
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => signOut()}
            title="Sign Out"
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
