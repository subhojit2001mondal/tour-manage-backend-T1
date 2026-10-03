import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  Users,
  MessageSquare,
  PhoneCall,
  Calendar,
  Sparkles,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
} from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { formatINR, formatIST } from '../lib/formatters.ts';
import { Booking, Departure, Chat, CallbackRequest, TourPackage, Destination } from '../types/index.ts';
import { ConfirmModal } from '../components/ConfirmModal.tsx';
import { ScreenId } from '../components/Sidebar.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
  hasDemoData: boolean;
  onDeleteDemoData: () => Promise<void>;
  loadingDemoDelete: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  hasDemoData,
  onDeleteDemoData,
  loadingDemoDelete,
}) => {
  const { isOwner } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [callbacks, setCallbacks] = useState<CallbackRequest[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Subscribe to collections
  useEffect(() => {
    const unsubBookings = onSnapshot(
      collection(db, 'bookings'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
        setBookings(list);
      },
      (err) => console.warn('Bookings listener notice:', err.message)
    );

    const unsubDeps = onSnapshot(
      collection(db, 'departures'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Departure));
        setDepartures(list);
      },
      (err) => console.warn('Departures listener notice:', err.message)
    );

    const unsubPkgs = onSnapshot(
      collection(db, 'packages'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TourPackage));
        setPackages(list);
      },
      (err) => console.warn('Packages listener notice:', err.message)
    );

    const unsubDests = onSnapshot(
      collection(db, 'destinations'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Destination));
        setDestinations(list);
      },
      (err) => console.warn('Destinations listener notice:', err.message)
    );

    const unsubChats = onSnapshot(
      collection(db, 'chats'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chat));
        setChats(list);
      },
      (err) => console.warn('Chats listener notice:', err.message)
    );

    const unsubCallbacks = onSnapshot(
      collection(db, 'callbackRequests'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CallbackRequest));
        setCallbacks(list);
      },
      (err) => console.warn('Callbacks listener notice:', err.message)
    );

    return () => {
      unsubBookings();
      unsubDeps();
      unsubPkgs();
      unsubDests();
      unsubChats();
      unsubCallbacks();
    };
  }, []);

  // Compute metrics
  const todayStr = '2026-10-03';
  const todayBookings = bookings.filter((b) => b.createdAt?.startsWith(todayStr));
  const todayRevenue = todayBookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((acc, b) => acc + (b.totalAmount || 0), 0);

  const totalSeatsSoldThisMonth = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((acc, b) => acc + (b.travelers?.length || 0), 0);

  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((acc, b) => acc + (b.totalAmount || 0), 0);

  const totalCommissionEarned = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((acc, b) => acc + (b.commissionAmount || 0), 0);

  const waitingChats = chats.filter((c) => c.status === 'waiting_for_staff');
  const newCallbacks = callbacks.filter((c) => c.status === 'new');

  // Upcoming departures (next 14 days, sorted)
  const upcomingDepartures = departures
    .filter((d) => d.date >= todayStr && d.status !== 'closed')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  // Simple distribution by region
  const regionBreakdown: Record<string, number> = {};
  destinations.forEach((d) => {
    regionBreakdown[d.region] = (regionBreakdown[d.region] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Demo data banner */}
      {hasDemoData && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/5 border border-amber-300/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                Demo Dataset Loaded
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  48 Destinations • 12 Agencies • 70+ Packages
                </span>
              </h2>
              <p className="text-xs text-amber-800/80 mt-0.5">
                All records marked with <code className="font-mono bg-amber-100 px-1 rounded">isDemo: true</code>. Ready for immediate end-to-end evaluation.
              </p>
            </div>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Delete Demo Data
            </button>
          )}
        </div>
      )}

      {/* Main KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{formatINR(todayRevenue)}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>{todayBookings.length} booking(s) recorded today</span>
            </p>
          </div>
        </div>

        {/* Seats Sold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Seats Sold</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{totalSeatsSoldThisMonth} Seats</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>{bookings.filter((b) => b.status === 'confirmed').length} active confirmed tours</span>
            </p>
          </div>
        </div>

        {/* Waiting Chats */}
        <div
          onClick={() => onNavigate('support')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chats Waiting Staff</span>
            <div className={`p-2.5 rounded-xl ${waitingChats.length > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-900">{waitingChats.length}</div>
            <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              View Inbox <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Requires immediate agent takeover</p>
        </div>

        {/* Callback Requests */}
        <div
          onClick={() => onNavigate('support')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">New Callback Requests</span>
            <div className={`p-2.5 rounded-xl ${newCallbacks.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
              <PhoneCall className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-900">{newCallbacks.length}</div>
            <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Call List <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Customers waiting for phone call</p>
        </div>
      </div>

      {/* Secondary Metrics / Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Total Marketplace Gross</span>
          <div className="text-3xl font-extrabold mt-2 tracking-tight">{formatINR(totalRevenue)}</div>
          <div className="mt-4 pt-4 border-t border-indigo-900/60 flex items-center justify-between text-xs text-indigo-200">
            <span>Our Commission Earned:</span>
            <span className="font-bold text-emerald-400 text-sm">{formatINR(totalCommissionEarned)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory Status</span>
            <div className="grid grid-cols-3 gap-3 mt-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-lg font-bold text-slate-900">{destinations.length}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Destinations</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-lg font-bold text-slate-900">{packages.length}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Packages</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-lg font-bold text-slate-900">{departures.length}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Departures</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('packages')}
            className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-end gap-1"
          >
            Manage Packages <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Destinations by Region</span>
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            {Object.entries(regionBreakdown).map(([reg, count]) => (
              <div key={reg} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">{reg}</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-2xs">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Departures Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Upcoming Departures</h3>
            <p className="text-xs text-slate-500">Fixed departures scheduled across India over the coming 14 days</p>
          </div>
          <button
            onClick={() => onNavigate('calendar')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            Open Full Calendar <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Package & Destination</th>
                <th className="py-3 px-5">Capacity & Status</th>
                <th className="py-3 px-5 text-right">Price per Person</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {upcomingDepartures.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No upcoming departures scheduled. Go to Availability Calendar to add departures.
                  </td>
                </tr>
              ) : (
                upcomingDepartures.map((dep) => {
                  const pkg = packages.find((p) => p.id === dep.packageId);
                  const dest = destinations.find((d) => d.id === dep.destinationId);
                  const seatsAvailable = dep.seatsTotal - (dep.seatsBooked || 0) - (dep.seatsHeld || 0);

                  let statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      Open ({seatsAvailable} left)
                    </span>
                  );
                  if (dep.status === 'limited') {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        Limited ({seatsAvailable} left)
                      </span>
                    );
                  } else if (dep.status === 'full') {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        Sold Out (Full)
                      </span>
                    );
                  }

                  return (
                    <tr key={dep.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{formatIST(dep.date, false)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900 line-clamp-1">{pkg?.title || dep.packageId}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-indigo-500" />
                          <span>{dest?.name || dep.destinationId}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {statusBadge}
                          <div className="text-xs text-slate-500 hidden sm:block">
                            {dep.seatsBooked || 0}/{dep.seatsTotal} Booked
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-slate-900">
                        {formatINR(dep.priceOverride || pkg?.pricePerPerson || 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Deleting Demo Data */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Demo Data?"
        message="This action will delete all demo destinations, agencies, packages, departures, sample bookings, chats, and the demo support staff account (where isDemo is true). Real records will remain untouched."
        confirmText="Yes, Delete Demo Data"
        cancelText="Cancel"
        isDangerous={true}
        loading={loadingDemoDelete}
        onConfirm={async () => {
          await onDeleteDemoData();
          setShowDeleteModal(false);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
