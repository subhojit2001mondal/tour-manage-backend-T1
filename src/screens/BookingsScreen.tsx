import React, { useState, useEffect } from 'react';
import {
  BookmarkCheck,
  Search,
  Download,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Building2,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  DollarSign,
  FileText,
  X,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { formatINR, formatIST } from '../lib/formatters.ts';
import { Booking, BookingStatus, PaymentStatus, TourPackage, Agency, Destination } from '../types/index.ts';
import { ConfirmModal } from '../components/ConfirmModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const BookingsScreen: React.FC = () => {
  const { isOwner, isSupport, currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [payoutFilter, setPayoutFilter] = useState<string>('All');

  // Detail Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  // Cancellation Modal
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested trip cancellation');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    const unsubBookings = onSnapshot(
      collection(db, 'bookings'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
        // Sort newest first
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setBookings(list);
      },
      (err) => console.warn('Bookings listener notice:', err.message)
    );
    const unsubPkgs = onSnapshot(
      collection(db, 'packages'),
      (snap) => {
        setPackages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TourPackage)));
      },
      (err) => console.warn('Bookings packages listener:', err.message)
    );
    const unsubAgencies = onSnapshot(
      collection(db, 'agencies'),
      (snap) => {
        setAgencies(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agency)));
      },
      (err) => console.warn('Bookings agencies listener:', err.message)
    );
    const unsubDests = onSnapshot(
      collection(db, 'destinations'),
      (snap) => {
        setDestinations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Destination)));
      },
      (err) => console.warn('Bookings destinations listener:', err.message)
    );

    return () => {
      unsubBookings();
      unsubPkgs();
      unsubAgencies();
      unsubDests();
    };
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const pkg = packages.find((p) => p.id === b.packageId);
    const agency = agencies.find((a) => a.id === b.agencyId);
    const matchesSearch =
      b.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      (pkg?.title && pkg.title.toLowerCase().includes(search.toLowerCase())) ||
      (agency?.name && agency.name.toLowerCase().includes(search.toLowerCase())) ||
      b.travelers?.some((t) => t.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchesPayout = payoutFilter === 'All' || b.agencyPayoutStatus === payoutFilter;
    return matchesSearch && matchesStatus && matchesPayout;
  });

  const handleOpenDetail = (b: Booking) => {
    setSelectedBooking(b);
    setEditingNotes(b.notes || '');
  };

  // Support & Owner can update booking notes
  const handleSaveNotes = async () => {
    if (!selectedBooking) return;
    setNotesSaving(true);
    try {
      await updateDoc(doc(db, 'bookings', selectedBooking.id), {
        notes: editingNotes,
      });
      setSelectedBooking({ ...selectedBooking, notes: editingNotes });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${selectedBooking.id}`);
    } finally {
      setNotesSaving(false);
    }
  };

  // Owner only: update booking status
  const handleUpdateStatus = async (bookingId: string, newStatus: BookingStatus) => {
    if (!isOwner) return;
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus,
      });
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
    }
  };

  // Owner only: toggle agency payout settlement
  const handleTogglePayout = async (b: Booking) => {
    if (!isOwner) return;
    const newStatus = b.agencyPayoutStatus === 'settled' ? 'pending' : 'settled';
    try {
      await updateDoc(doc(db, 'bookings', b.id), {
        agencyPayoutStatus: newStatus,
      });
      if (selectedBooking && selectedBooking.id === b.id) {
        setSelectedBooking({ ...selectedBooking, agencyPayoutStatus: newStatus });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${b.id}`);
    }
  };

  // Owner only: cancel booking with refund
  const handleConfirmCancelBooking = async () => {
    if (!cancellingBooking || !isOwner) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: cancellingBooking.id,
          reason: cancelReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');
      setCancellingBooking(null);
      if (selectedBooking?.id === cancellingBooking.id) {
        setSelectedBooking(null);
      }
    } catch (err: any) {
      setCancelError(err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) return;

    const headers = [
      'Booking Code',
      'Created At',
      'Travel Date',
      'Customer ID',
      'Lead Traveler',
      'Travelers Count',
      'Package Title',
      'Agency Name',
      'Total Amount (INR)',
      'Commission Amount (INR)',
      'Agency Payable (INR)',
      'Booking Status',
      'Payment Status',
      'Razorpay Order ID',
      'Razorpay Payment ID',
      'Agency Payout Status',
      'Notes',
    ];

    const rows = filteredBookings.map((b) => {
      const pkg = packages.find((p) => p.id === b.packageId);
      const agency = agencies.find((a) => a.id === b.agencyId);
      const leadTraveler = b.travelers?.[0]?.name || 'N/A';
      const count = b.travelers?.length || 0;
      const agencyPayable = (b.totalAmount || 0) - (b.commissionAmount || 0);

      return [
        b.bookingCode,
        b.createdAt || '',
        b.travelDate || '',
        b.customerId,
        `"${leadTraveler.replace(/"/g, '""')}"`,
        count,
        `"${(pkg?.title || b.packageId).replace(/"/g, '""')}"`,
        `"${(agency?.name || b.agencyId).replace(/"/g, '""')}"`,
        b.totalAmount || 0,
        b.commissionAmount || 0,
        agencyPayable,
        b.status,
        b.paymentStatus,
        b.razorpayOrderId || '',
        b.razorpayPaymentId || '',
        b.agencyPayoutStatus,
        `"${(b.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TourManage_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Bookings & Payouts</h1>
          <p className="text-sm text-slate-500">
            Customer reservations, payment reconciliation, and agency payout tracking.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-colors shadow-2xs shrink-0"
        >
          <Download className="w-4 h-4 text-indigo-600" />
          Export Bookings CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by booking code, traveler name, package, or agency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="All">All Statuses ({bookings.length})</option>
            <option value="held">Held</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Agency Payout filter */}
          <select
            value={payoutFilter}
            onChange={(e) => setPayoutFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="All">All Payout Statuses</option>
            <option value="pending">Payout Pending</option>
            <option value="settled">Payout Settled</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Booking Code</th>
                <th className="py-3 px-5">Traveler & Tour</th>
                <th className="py-3 px-5">Travel Date</th>
                <th className="py-3 px-5 text-right">Total & Commission</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-center">Agency Payout</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No bookings found matching your search.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const pkg = packages.find((p) => p.id === b.packageId);
                  const agency = agencies.find((a) => a.id === b.agencyId);
                  const agencyPayable = (b.totalAmount || 0) - (b.commissionAmount || 0);

                  let statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                      {b.status}
                    </span>
                  );
                  if (b.status === 'confirmed') {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        Confirmed
                      </span>
                    );
                  } else if (b.status === 'held') {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        Seats Held (15m)
                      </span>
                    );
                  } else if (b.status === 'completed') {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        Completed
                      </span>
                    );
                  } else if (b.status === 'refunded') {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                        Refunded
                      </span>
                    );
                  } else if (b.status === 'cancelled') {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        Cancelled
                      </span>
                    );
                  }

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold text-slate-900 block">{b.bookingCode}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{b.id}</span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900">
                          {b.travelers?.[0]?.name || 'Traveler'} {b.travelers?.length > 1 && `+${b.travelers.length - 1} more`}
                        </div>
                        <div className="text-xs text-indigo-600 font-medium line-clamp-1 mt-0.5">
                          {pkg?.title || b.packageId}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{agency?.name || b.agencyId}</div>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatIST(b.travelDate, false)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Booked: {formatIST(b.createdAt, false)}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="font-extrabold text-slate-900">{formatINR(b.totalAmount)}</div>
                        <div className="text-[11px] text-emerald-600 font-semibold">
                          Comm: {formatINR(b.commissionAmount)}
                        </div>
                      </td>

                      <td className="py-4 px-5 text-center whitespace-nowrap">{statusBadge}</td>

                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              b.agencyPayoutStatus === 'settled'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {b.agencyPayoutStatus === 'settled' ? 'Settled' : 'Pending'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Payable: {formatINR(agencyPayable)}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetail(b)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Detail Drawer / Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <BookmarkCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Booking {selectedBooking.bookingCode}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedBooking.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Status and Action bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Current Status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-extrabold text-slate-900 capitalize text-base">
                      {selectedBooking.status}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      (Payment: {selectedBooking.paymentStatus})
                    </span>
                  </div>
                </div>

                {isOwner && (
                  <div className="flex items-center gap-2">
                    {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'refunded' && (
                      <button
                        onClick={() => {
                          setCancellingBooking(selectedBooking);
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Cancel & Refund
                      </button>
                    )}

                    {selectedBooking.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedBooking.id, 'completed')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Financial & Payout Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Total Collected
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 block mt-1">
                    {formatINR(selectedBooking.totalAmount)}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Our Commission
                  </span>
                  <span className="text-lg font-extrabold text-emerald-600 block mt-1">
                    {formatINR(selectedBooking.commissionAmount)}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Payable to Agency
                  </span>
                  <span className="text-lg font-extrabold text-indigo-600 block mt-1">
                    {formatINR((selectedBooking.totalAmount || 0) - (selectedBooking.commissionAmount || 0))}
                  </span>
                </div>
              </div>

              {/* Agency Payout Toggle (Owner Only) */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Agency Payout Settlement
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Status: <span className="font-bold capitalize">{selectedBooking.agencyPayoutStatus}</span>
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleTogglePayout(selectedBooking)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                      selectedBooking.agencyPayoutStatus === 'settled'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {selectedBooking.agencyPayoutStatus === 'settled' ? 'Mark as Pending' : 'Mark as Settled'}
                  </button>
                )}
              </div>

              {/* Travelers list */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Travelers ({selectedBooking.travelers?.length || 0})
                </h4>
                <div className="space-y-1.5">
                  {(selectedBooking.travelers || []).map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="font-semibold text-slate-800">
                        {idx + 1}. {t.name}
                      </div>
                      <div className="text-slate-500 font-medium">Age: {t.age}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Razorpay Transaction Identifiers
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Razorpay Order ID:</span>
                  <span className="font-mono text-slate-900 font-semibold">{selectedBooking.razorpayOrderId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Razorpay Payment ID:</span>
                  <span className="font-mono text-slate-900 font-semibold">{selectedBooking.razorpayPaymentId || 'N/A'}</span>
                </div>
                {selectedBooking.holdExpiresAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hold Expiry Time:</span>
                    <span className="font-semibold text-amber-700">{formatIST(selectedBooking.holdExpiresAt, true)}</span>
                  </div>
                )}
              </div>

              {/* Internal Notes (Editable by Support & Owner) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Internal Staff Notes
                  </label>
                  <span className="text-[10px] text-slate-400">Support & Owner editable</span>
                </div>
                <textarea
                  rows={3}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Record customer preferences, dietary requests, pickup instructions, refund memos..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={notesSaving}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {notesSaving ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel and Refund Confirmation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Cancel Booking & Process Refund</h3>
              </div>
              <button
                onClick={() => setCancellingBooking(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600">
              {cancelError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cancelError}</span>
                </div>
              )}

              <p>
                Are you sure you want to cancel booking <span className="font-bold text-slate-900">{cancellingBooking.bookingCode}</span>?
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Total Refund Amount:</span>
                <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                  {formatINR(cancellingBooking.totalAmount)}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Seats on departure will be restored and payment marked as refunded.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Cancellation
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setCancellingBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancelBooking}
                disabled={cancelLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs disabled:opacity-50"
              >
                {cancelLoading ? 'Processing Refund...' : 'Confirm Cancellation & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
