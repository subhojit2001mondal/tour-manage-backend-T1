import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Package,
  Tag,
  Calendar,
  BookmarkCheck,
  MessageSquare,
  Settings,
  Lock,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export type ScreenId =
  | 'dashboard'
  | 'destinations'
  | 'agencies'
  | 'packages'
  | 'prices'
  | 'calendar'
  | 'bookings'
  | 'support'
  | 'settings'
  | 'tester';

interface SidebarProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  waitingChatsCount?: number;
  newCallbacksCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  waitingChatsCount = 0,
  newCallbacksCount = 0,
}) => {
  const { isOwner } = useAuth();

  const totalSupportAlerts = waitingChatsCount + newCallbacksCount;

  const navigationItems = [
    { id: 'dashboard' as ScreenId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'destinations' as ScreenId, label: 'Destinations', icon: MapPin },
    { id: 'agencies' as ScreenId, label: 'Agencies', icon: Building2 },
    { id: 'packages' as ScreenId, label: 'Packages', icon: Package },
    { id: 'prices' as ScreenId, label: 'Prices & Bulk Tool', icon: Tag },
    { id: 'calendar' as ScreenId, label: 'Availability Calendar', icon: Calendar },
    { id: 'bookings' as ScreenId, label: 'Bookings & Payouts', icon: BookmarkCheck },
    {
      id: 'support' as ScreenId,
      label: 'Support Inbox',
      icon: MessageSquare,
      badge: totalSupportAlerts > 0 ? totalSupportAlerts : undefined,
    },
    {
      id: 'settings' as ScreenId,
      label: 'Settings',
      icon: Settings,
      ownerOnly: true,
    },
    {
      id: 'tester' as ScreenId,
      label: 'Android API Tester',
      icon: Smartphone,
      isSub: true,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Management
        </div>

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          const isLocked = item.ownerOnly && !isOwner;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (!isLocked) onSelectScreen(item.id);
              }}
              disabled={isLocked}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : isLocked
                  ? 'text-slate-500 cursor-not-allowed opacity-60'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 animate-pulse">
                  {item.badge}
                </span>
              )}

              {isLocked && (
                <span title="Owner only" className="text-slate-500">
                  <Lock className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>System Status</span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Firestore Real-time Active</p>
          <p className="text-[10px] text-slate-500 mt-1">All mutations sync to customer Android app instantly.</p>
        </div>
      </div>
    </aside>
  );
};
