import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { FirstOwnerSetupScreen } from './screens/FirstOwnerSetupScreen.tsx';
import { LoginScreen } from './screens/LoginScreen.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar, ScreenId } from './components/Sidebar.tsx';
import { DashboardScreen } from './screens/DashboardScreen.tsx';
import { DestinationsScreen } from './screens/DestinationsScreen.tsx';
import { AgenciesScreen } from './screens/AgenciesScreen.tsx';
import { PackagesScreen } from './screens/PackagesScreen.tsx';
import { PricesScreen } from './screens/PricesScreen.tsx';
import { CalendarScreen } from './screens/CalendarScreen.tsx';
import { BookingsScreen } from './screens/BookingsScreen.tsx';
import { SupportInboxScreen } from './screens/SupportInboxScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import { AndroidTesterScreen } from './screens/AndroidTesterScreen.tsx';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, testFirestoreConnection } from './lib/firebase.ts';
import { Compass, Sparkles, CheckCircle2 } from 'lucide-react';

function AdminShell() {
  const { currentUser, loading, needsFirstOwnerSetup } = useAuth();
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');

  // Real-time badge indicators
  const [hasDemoData, setHasDemoData] = useState<boolean>(false);
  const [waitingChatsCount, setWaitingChatsCount] = useState<number>(0);
  const [newCallbacksCount, setNewCallbacksCount] = useState<number>(0);

  // Demo action loaders
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [seedSuccessNotice, setSeedSuccessNotice] = useState<any | null>(null);

  // Connection test on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Listen for demo data presence
  useEffect(() => {
    const q = query(collection(db, 'destinations'), where('isDemo', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      setHasDemoData(!snap.empty);
    }, (err) => {
      console.warn('Demo data check:', err.message);
    });
    return () => unsub();
  }, []);

  // Listen for waiting chats
  useEffect(() => {
    const q = query(collection(db, 'chats'), where('status', '==', 'waiting_for_staff'));
    const unsub = onSnapshot(q, (snap) => {
      setWaitingChatsCount(snap.size);
    }, (err) => {
      console.warn('Waiting chats count:', err.message);
    });
    return () => unsub();
  }, []);

  // Listen for new callback requests
  useEffect(() => {
    const q = query(collection(db, 'callbackRequests'), where('status', '==', 'new'));
    const unsub = onSnapshot(q, (snap) => {
      setNewCallbacksCount(snap.size);
    }, (err) => {
      console.warn('New callbacks count:', err.message);
    });
    return () => unsub();
  }, []);

  // Demo seeder handler
  const handleSeedDemoData = async () => {
    setLoadingSeed(true);
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch('/api/demo/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to seed sample data');
      setSeedSuccessNotice(data);
    } catch (err: any) {
      alert(`Error loading sample data: ${err.message}`);
    } finally {
      setLoadingSeed(false);
    }
  };

  // Demo deletion handler
  const handleDeleteDemoData = async () => {
    setLoadingDelete(true);
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch('/api/demo/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete demo data');
      alert(`Demo data successfully purged (${data.deletedTotal} documents removed).`);
    } catch (err: any) {
      alert(`Error deleting demo data: ${err.message}`);
    } finally {
      setLoadingDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center animate-pulse mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">Loading Tour Manage Operations...</p>
      </div>
    );
  }

  if (needsFirstOwnerSetup) {
    return <FirstOwnerSetupScreen />;
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        hasDemoData={hasDemoData}
        waitingChatsCount={waitingChatsCount}
        onOpenAndroidTester={() => setActiveScreen('tester')}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeScreen={activeScreen}
          onSelectScreen={setActiveScreen}
          waitingChatsCount={waitingChatsCount}
          newCallbacksCount={newCallbacksCount}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Success Banner when Seed Finishes */}
          {seedSuccessNotice && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-extrabold text-sm block text-emerald-950">
                    Sample Data Seeded Successfully!
                  </span>
                  <span>
                    Loaded {seedSuccessNotice.destinationsCount} destinations, {seedSuccessNotice.agenciesCount} agencies, {seedSuccessNotice.packagesCount} packages, and {seedSuccessNotice.departuresCount} departures.
                  </span>
                  <div className="mt-1 font-mono text-[11px] bg-emerald-100/60 p-1.5 rounded inline-block">
                    Demo Support Login: <strong>demo-support@tourmanage.test</strong> / <strong>Demo@12345</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSeedSuccessNotice(null)}
                className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeScreen === 'dashboard' && (
            <DashboardScreen
              onNavigate={setActiveScreen}
              hasDemoData={hasDemoData}
              onDeleteDemoData={handleDeleteDemoData}
              loadingDemoDelete={loadingDelete}
            />
          )}

          {activeScreen === 'destinations' && <DestinationsScreen />}

          {activeScreen === 'agencies' && <AgenciesScreen />}

          {activeScreen === 'packages' && <PackagesScreen />}

          {activeScreen === 'prices' && <PricesScreen />}

          {activeScreen === 'calendar' && <CalendarScreen />}

          {activeScreen === 'bookings' && <BookingsScreen />}

          {activeScreen === 'support' && <SupportInboxScreen />}

          {activeScreen === 'settings' && (
            <SettingsScreen
              hasDemoData={hasDemoData}
              onSeedDemoData={handleSeedDemoData}
              onDeleteDemoData={handleDeleteDemoData}
              loadingSeed={loadingSeed}
              loadingDelete={loadingDelete}
            />
          )}

          {activeScreen === 'tester' && <AndroidTesterScreen />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AdminShell />
    </AuthProvider>
  );
}
