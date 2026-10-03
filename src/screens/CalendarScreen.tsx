import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Repeat,
  X,
  MapPin,
  Building2,
  Package,
  Users,
  Tag,
  Power,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { formatINR, formatIST } from '../lib/formatters.ts';
import { Departure, TourPackage, Agency, Destination, DepartureStatus } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const CalendarScreen: React.FC = () => {
  const { isOwner } = useAuth();
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);

  // Month navigation: Start at Oct 2026
  const [currentDate, setCurrentDate] = useState(new Date('2026-10-01'));

  // Filters
  const [selectedDestination, setSelectedDestination] = useState<string>('All');
  const [selectedAgency, setSelectedAgency] = useState<string>('All');
  const [selectedPackage, setSelectedPackage] = useState<string>('All');

  // Modals
  const [selectedDeparture, setSelectedDeparture] = useState<Departure | null>(null);
  const [isSingleAddOpen, setIsSingleAddOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);

  // Forms
  const [singleForm, setSingleForm] = useState({
    packageId: '',
    date: '2026-10-15',
    seatsTotal: 20,
    priceOverride: '',
  });

  const [bulkForm, setBulkForm] = useState({
    packageId: '',
    startDate: '2026-10-10',
    frequencyDays: 7, // Every 7 days
    totalOccurrences: 8,
    seatsTotal: 20,
    priceOverride: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubDeps = onSnapshot(
      collection(db, 'departures'),
      (snap) => {
        setDepartures(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Departure)));
      },
      (err) => console.warn('Calendar departures listener:', err.message)
    );
    const unsubPkgs = onSnapshot(
      collection(db, 'packages'),
      (snap) => {
        setPackages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TourPackage)));
      },
      (err) => console.warn('Calendar packages listener:', err.message)
    );
    const unsubAgencies = onSnapshot(
      collection(db, 'agencies'),
      (snap) => {
        setAgencies(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agency)));
      },
      (err) => console.warn('Calendar agencies listener:', err.message)
    );
    const unsubDests = onSnapshot(
      collection(db, 'destinations'),
      (snap) => {
        setDestinations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Destination)));
      },
      (err) => console.warn('Calendar destinations listener:', err.message)
    );

    return () => {
      unsubDeps();
      unsubPkgs();
      unsubAgencies();
      unsubDests();
    };
  }, []);

  // Filtered departures
  const filteredDepartures = departures.filter((d) => {
    const matchesDest = selectedDestination === 'All' || d.destinationId === selectedDestination;
    const matchesAgency = selectedAgency === 'All' || d.agencyId === selectedAgency;
    const matchesPkg = selectedPackage === 'All' || d.packageId === selectedPackage;
    return matchesDest && matchesAgency && matchesPkg;
  });

  // Calendar matrix calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Group departures by date string (YYYY-MM-DD)
  const departuresByDate: Record<string, Departure[]> = {};
  filteredDepartures.forEach((dep) => {
    if (!departuresByDate[dep.date]) departuresByDate[dep.date] = [];
    departuresByDate[dep.date].push(dep);
  });

  // Edit single departure save
  const handleSaveEditDeparture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeparture || !isOwner) return;
    setError(null);
    setSaving(true);

    try {
      await updateDoc(doc(db, 'departures', selectedDeparture.id), {
        seatsTotal: Number(selectedDeparture.seatsTotal),
        priceOverride: selectedDeparture.priceOverride ? Number(selectedDeparture.priceOverride) : null,
        status: selectedDeparture.status,
      });
      setSelectedDeparture(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add single departure
  const handleAddSingleDeparture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    const pkg = packages.find((p) => p.id === singleForm.packageId) || packages[0];
    if (!pkg) return;

    setError(null);
    setSaving(true);
    try {
      const depId = `dep-${pkg.id}-${Date.now().toString().slice(-6)}`;
      await setDoc(doc(db, 'departures', depId), {
        id: depId,
        packageId: pkg.id,
        agencyId: pkg.agencyId,
        destinationId: pkg.destinationId,
        date: singleForm.date,
        seatsTotal: Number(singleForm.seatsTotal),
        seatsBooked: 0,
        seatsHeld: 0,
        priceOverride: singleForm.priceOverride ? Number(singleForm.priceOverride) : undefined,
        status: 'open',
      });
      setIsSingleAddOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add bulk recurring departures
  const handleAddBulkDepartures = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    const pkg = packages.find((p) => p.id === bulkForm.packageId) || packages[0];
    if (!pkg) return;

    setError(null);
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const start = new Date(bulkForm.startDate);

      for (let i = 0; i < bulkForm.totalOccurrences; i++) {
        const nextDate = new Date(start);
        nextDate.setDate(start.getDate() + i * bulkForm.frequencyDays);
        const dateStr = nextDate.toISOString().split('T')[0];

        const depId = `dep-${pkg.id}-${Date.now().toString().slice(-4)}-${i}`;
        const ref = doc(db, 'departures', depId);

        batch.set(ref, {
          id: depId,
          packageId: pkg.id,
          agencyId: pkg.agencyId,
          destinationId: pkg.destinationId,
          date: dateStr,
          seatsTotal: Number(bulkForm.seatsTotal),
          seatsBooked: 0,
          seatsHeld: 0,
          priceOverride: bulkForm.priceOverride ? Number(bulkForm.priceOverride) : undefined,
          status: 'open',
        });
      }

      await batch.commit();
      setIsBulkAddOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Availability Calendar</h1>
          <p className="text-sm text-slate-500">
            Fixed departure dates, seat occupancy, and per-departure holiday surcharges.
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSingleForm({
                  packageId: packages[0]?.id || '',
                  date: '2026-10-15',
                  seatsTotal: 20,
                  priceOverride: '',
                });
                setIsSingleAddOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              Add One Departure
            </button>
            <button
              onClick={() => {
                setBulkForm({
                  packageId: packages[0]?.id || '',
                  startDate: '2026-10-10',
                  frequencyDays: 7,
                  totalOccurrences: 8,
                  seatsTotal: 20,
                  priceOverride: '',
                });
                setIsBulkAddOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Repeat className="w-4 h-4" />
              Bulk Recurring Departures
            </button>
          </div>
        )}
      </div>

      {/* Filter and Month Navigation Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Month Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-base font-extrabold text-slate-900 w-44 text-center">
            {monthNames[month]} {year}
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="All">All Destinations</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedAgency}
            onChange={(e) => setSelectedAgency(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="All">All Agencies</option>
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 max-w-xs"
          >
            <option value="All">All Packages</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 py-2.5">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[500px]">
          {/* Empty days before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={`empty-${idx}`} className="bg-slate-50/50 p-2 min-h-[90px]" />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayDepartures = departuresByDate[dateStr] || [];
            const isToday = dateStr === '2026-10-03';

            return (
              <div
                key={dateStr}
                className={`p-2 min-h-[90px] flex flex-col justify-between transition-colors ${
                  isToday ? 'bg-indigo-50/40 ring-1 ring-inset ring-indigo-500/20' : 'bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayDepartures.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">
                      {dayDepartures.length} dep
                    </span>
                  )}
                </div>

                {/* Departure Chips on this date */}
                <div className="space-y-1 overflow-y-auto max-h-24">
                  {dayDepartures.map((dep) => {
                    const pkg = packages.find((p) => p.id === dep.packageId);
                    const seatsLeft = dep.seatsTotal - (dep.seatsBooked || 0) - (dep.seatsHeld || 0);

                    let statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    if (dep.status === 'limited') statusClass = 'bg-amber-100 text-amber-900 border-amber-200';
                    if (dep.status === 'full') statusClass = 'bg-rose-100 text-rose-900 border-rose-200';
                    if (dep.status === 'closed') statusClass = 'bg-slate-100 text-slate-600 border-slate-200';

                    return (
                      <div
                        key={dep.id}
                        onClick={() => setSelectedDeparture(dep)}
                        className={`px-1.5 py-1 rounded-md text-[10px] font-bold border truncate cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${statusClass}`}
                        title={`${pkg?.title || dep.packageId} • ${seatsLeft} seats left`}
                      >
                        <div className="truncate">{pkg?.title || dep.packageId}</div>
                        <div className="flex items-center justify-between text-[9px] opacity-80 mt-0.5">
                          <span>{seatsLeft} left</span>
                          <span>{formatINR(dep.priceOverride || pkg?.pricePerPerson || 0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Departure Modal */}
      {selectedDeparture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manage Departure</h3>
                <p className="text-xs text-slate-500">Departure on {formatIST(selectedDeparture.date, false)}</p>
              </div>
              <button
                onClick={() => setSelectedDeparture(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDeparture} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Package
                </label>
                <div className="text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {packages.find((p) => p.id === selectedDeparture.packageId)?.title || selectedDeparture.packageId}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Total Seats *
                  </label>
                  <input
                    type="number"
                    min={selectedDeparture.seatsBooked || 1}
                    required
                    disabled={!isOwner}
                    value={selectedDeparture.seatsTotal}
                    onChange={(e) =>
                      setSelectedDeparture({
                        ...selectedDeparture,
                        seatsTotal: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Booked: {selectedDeparture.seatsBooked || 0} • Held: {selectedDeparture.seatsHeld || 0}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price Override (₹)
                  </label>
                  <input
                    type="number"
                    min="500"
                    disabled={!isOwner}
                    placeholder="Leave empty for base"
                    value={selectedDeparture.priceOverride || ''}
                    onChange={(e) =>
                      setSelectedDeparture({
                        ...selectedDeparture,
                        priceOverride: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Departure Status
                </label>
                <select
                  disabled={!isOwner}
                  value={selectedDeparture.status}
                  onChange={(e) =>
                    setSelectedDeparture({
                      ...selectedDeparture,
                      status: e.target.value as DepartureStatus,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                >
                  <option value="open">Open for Bookings</option>
                  <option value="limited">Limited Seats Remaining</option>
                  <option value="full">Full (Sold Out)</option>
                  <option value="closed">Closed / Suspended</option>
                </select>
              </div>

              {isOwner && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDeparture(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                  >
                    {saving ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Add Single Departure Modal */}
      {isSingleAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Schedule Single Departure</h3>
              <button
                onClick={() => setIsSingleAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSingleDeparture} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tour Package *
                </label>
                <select
                  required
                  value={singleForm.packageId}
                  onChange={(e) => setSingleForm({ ...singleForm, packageId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Departure Date *
                </label>
                <input
                  type="date"
                  required
                  value={singleForm.date}
                  onChange={(e) => setSingleForm({ ...singleForm, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Total Seats *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={singleForm.seatsTotal}
                    onChange={(e) => setSingleForm({ ...singleForm, seatsTotal: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price Override (₹)
                  </label>
                  <input
                    type="number"
                    min="500"
                    placeholder="Optional"
                    value={singleForm.priceOverride}
                    onChange={(e) => setSingleForm({ ...singleForm, priceOverride: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSingleAddOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {saving ? 'Creating...' : 'Create Departure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bulk Recurring Departures Modal */}
      {isBulkAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Bulk Recurring Departures</h3>
              </div>
              <button
                onClick={() => setIsBulkAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBulkDepartures} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tour Package *
                </label>
                <select
                  required
                  value={bulkForm.packageId}
                  onChange={(e) => setBulkForm({ ...bulkForm, packageId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  First Departure Date *
                </label>
                <input
                  type="date"
                  required
                  value={bulkForm.startDate}
                  onChange={(e) => setBulkForm({ ...bulkForm, startDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Repeat Every *
                  </label>
                  <select
                    value={bulkForm.frequencyDays}
                    onChange={(e) => setBulkForm({ ...bulkForm, frequencyDays: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
                  >
                    <option value={7}>7 Days (Weekly)</option>
                    <option value={3}>3 Days</option>
                    <option value={14}>14 Days (Bi-weekly)</option>
                    <option value={30}>30 Days (Monthly)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Total Departures *
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    required
                    value={bulkForm.totalOccurrences}
                    onChange={(e) => setBulkForm({ ...bulkForm, totalOccurrences: parseInt(e.target.value) || 2 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Seats per Departure *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={bulkForm.seatsTotal}
                    onChange={(e) => setBulkForm({ ...bulkForm, seatsTotal: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price Override (₹)
                  </label>
                  <input
                    type="number"
                    min="500"
                    placeholder="Optional"
                    value={bulkForm.priceOverride}
                    onChange={(e) => setBulkForm({ ...bulkForm, priceOverride: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkAddOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {saving ? 'Scheduling...' : `Create ${bulkForm.totalOccurrences} Departures`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
