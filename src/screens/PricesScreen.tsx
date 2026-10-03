import React, { useState, useEffect } from 'react';
import {
  Tag,
  Search,
  Check,
  X,
  Sliders,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { formatINR } from '../lib/formatters.ts';
import { TourPackage, Agency, Destination } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const PricesScreen: React.FC = () => {
  const { isOwner, currentUser } = useAuth();
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [search, setSearch] = useState('');

  // Inline editing state
  const [inlinePriceMap, setInlinePriceMap] = useState<Record<string, number>>({});
  const [savingPackageId, setSavingPackageId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  // Bulk Price Update Tool state
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [targetType, setTargetType] = useState<'all' | 'agency' | 'destination'>('all');
  const [targetId, setTargetId] = useState<string>('');
  const [adjustmentDirection, setAdjustmentDirection] = useState<'increase' | 'decrease'>('increase');
  const [adjustmentType, setAdjustmentType] = useState<'percent' | 'fixed'>('percent');
  const [adjustmentValue, setAdjustmentValue] = useState<number>(10);
  const [previewChanges, setPreviewChanges] = useState<any[] | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubPkgs = onSnapshot(
      collection(db, 'packages'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TourPackage));
        setPackages(list);
      },
      (err) => console.warn('Prices packages listener:', err.message)
    );
    const unsubAgencies = onSnapshot(
      collection(db, 'agencies'),
      (snap) => {
        setAgencies(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agency)));
      },
      (err) => console.warn('Prices agencies listener:', err.message)
    );
    const unsubDests = onSnapshot(
      collection(db, 'destinations'),
      (snap) => {
        setDestinations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Destination)));
      },
      (err) => console.warn('Prices destinations listener:', err.message)
    );

    return () => {
      unsubPkgs();
      unsubAgencies();
      unsubDests();
    };
  }, []);

  const filteredPackages = packages.filter((pkg) => {
    return (
      pkg.title.toLowerCase().includes(search.toLowerCase()) ||
      pkg.id.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Handle inline price update
  const handleSaveInlinePrice = async (pkgId: string) => {
    if (!isOwner) return;
    const newPrice = inlinePriceMap[pkgId];
    if (newPrice === undefined || isNaN(newPrice) || newPrice <= 0) return;

    setSavingPackageId(pkgId);
    try {
      await updateDoc(doc(db, 'packages', pkgId), {
        pricePerPerson: newPrice,
      });
      setSavedSuccessId(pkgId);
      setTimeout(() => setSavedSuccessId(null), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `packages/${pkgId}`);
    } finally {
      setSavingPackageId(null);
    }
  };

  // Bulk update preview
  const handlePreviewBulk = async () => {
    setBulkError(null);
    setBulkLoading(true);
    try {
      const token = await currentUser?.getIdToken();
      const signedValue = adjustmentDirection === 'increase' ? Math.abs(adjustmentValue) : -Math.abs(adjustmentValue);

      const res = await fetch('/api/packages/bulk-price-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetType,
          targetId: targetType === 'all' ? undefined : targetId,
          adjustmentType,
          value: signedValue,
          action: 'preview',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to preview bulk pricing');
      setPreviewChanges(data.changes);
    } catch (err: any) {
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk update apply
  const handleApplyBulk = async () => {
    setBulkError(null);
    setBulkLoading(true);
    try {
      const token = await currentUser?.getIdToken();
      const signedValue = adjustmentDirection === 'increase' ? Math.abs(adjustmentValue) : -Math.abs(adjustmentValue);

      const res = await fetch('/api/packages/bulk-price-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetType,
          targetId: targetType === 'all' ? undefined : targetId,
          adjustmentType,
          value: signedValue,
          action: 'apply',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply bulk pricing');
      setBulkSuccessMsg(`Successfully updated prices across ${data.appliedCount} tour packages!`);
      setTimeout(() => {
        setIsBulkOpen(false);
        setPreviewChanges(null);
        setBulkSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Prices Management</h1>
          <p className="text-sm text-slate-500">
            Edit price per person inline or execute bulk percentage/fixed price adjustments.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => {
              setIsBulkOpen(true);
              setPreviewChanges(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Sliders className="w-4 h-4" />
            Bulk Price Update Tool
          </button>
        )}
      </div>

      {/* Info notice about price locks */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200/70 rounded-2xl flex items-start gap-3 text-xs text-indigo-900">
        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Real-time Pricing Guarantee:</span> All price adjustments here reflect immediately in the customer Android application for all future bookings. Existing bookings strictly retain the locked price at the time they were booked.
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search packages by title or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">
          {filteredPackages.length} Packages Listed
        </div>
      </div>

      {/* Inline Pricing Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Package Title</th>
                <th className="py-3 px-5">Agency & Destination</th>
                <th className="py-3 px-5 text-center">Duration</th>
                <th className="py-3 px-5 text-right w-64">Price per Person (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPackages.map((pkg) => {
                const dest = destinations.find((d) => d.id === pkg.destinationId);
                const agency = agencies.find((a) => a.id === pkg.agencyId);
                const currentVal = inlinePriceMap[pkg.id] ?? pkg.pricePerPerson;
                const isModified = currentVal !== pkg.pricePerPerson;

                return (
                  <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900 max-w-sm">
                      <div className="line-clamp-1">{pkg.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{pkg.id}</div>
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="line-clamp-1">{agency?.name || pkg.agencyId}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{dest?.name || pkg.destinationId}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-center">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                        {pkg.days}D / {pkg.nights}N
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      {isOwner ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="relative w-36">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="500"
                              step="100"
                              value={currentVal}
                              onChange={(e) =>
                                setInlinePriceMap({
                                  ...inlinePriceMap,
                                  [pkg.id]: parseInt(e.target.value) || 0,
                                })
                              }
                              className={`w-full bg-slate-50 border rounded-xl pl-7 pr-3 py-1.5 text-right font-extrabold text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                                isModified ? 'border-amber-400 bg-amber-50/50 text-amber-900' : 'border-slate-200 text-slate-900'
                              }`}
                            />
                          </div>

                          {isModified && (
                            <button
                              onClick={() => handleSaveInlinePrice(pkg.id)}
                              disabled={savingPackageId === pkg.id}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs"
                              title="Save new price"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {savedSuccessId === pkg.id && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 animate-in zoom-in" />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-slate-900">{formatINR(pkg.pricePerPerson)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Price Update Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Bulk Price Update Tool</h2>
                  <p className="text-xs text-slate-500">Apply percentage or fixed price shift across inventory.</p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {bulkError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {bulkSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{bulkSuccessMsg}</span>
                </div>
              )}

              {/* Target Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'All Packages' },
                    { id: 'agency', label: 'One Agency' },
                    { id: 'destination', label: 'One Destination' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setTargetType(s.id as any);
                        setPreviewChanges(null);
                        if (s.id === 'agency') setTargetId(agencies[0]?.id || '');
                        if (s.id === 'destination') setTargetId(destinations[0]?.id || '');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                        targetType === s.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Sub-select for agency or destination */}
                {targetType === 'agency' && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Choose Partner Agency:</label>
                    <select
                      value={targetId}
                      onChange={(e) => {
                        setTargetId(e.target.value);
                        setPreviewChanges(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      {agencies.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType === 'destination' && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Choose Destination:</label>
                    <select
                      value={targetId}
                      onChange={(e) => {
                        setTargetId(e.target.value);
                        setPreviewChanges(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.region})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Adjustment Rule */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Price Adjustment Rule
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustmentDirection('increase');
                        setPreviewChanges(null);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                        adjustmentDirection === 'increase'
                          ? 'bg-white text-emerald-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> Increase (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustmentDirection('decrease');
                        setPreviewChanges(null);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                        adjustmentDirection === 'decrease'
                          ? 'bg-white text-rose-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <TrendingDown className="w-3.5 h-3.5" /> Decrease (-)
                    </button>
                  </div>

                  <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustmentType('percent');
                        setPreviewChanges(null);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        adjustmentType === 'percent'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustmentType('fixed');
                        setPreviewChanges(null);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        adjustmentType === 'fixed'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Fixed Amount (₹)
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Value to {adjustmentDirection} by {adjustmentType === 'percent' ? '(%)' : '(₹)'}:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adjustmentValue}
                    onChange={(e) => {
                      setAdjustmentValue(Math.max(1, parseInt(e.target.value) || 0));
                      setPreviewChanges(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Preview Button */}
              <div>
                <button
                  type="button"
                  onClick={handlePreviewBulk}
                  disabled={bulkLoading}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {bulkLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Preview Price Calculations
                </button>
              </div>

              {/* Preview Table */}
              {previewChanges && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
                    <span>Impact Preview ({previewChanges.length} Packages)</span>
                    <span className="text-[11px] text-slate-500">Review before committing</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {previewChanges.map((item, idx) => (
                      <div key={idx} className="p-3 text-xs flex items-center justify-between">
                        <div className="font-semibold text-slate-800 line-clamp-1 max-w-xs">{item.title}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 line-through">{formatINR(item.oldPrice)}</span>
                          <span className="font-bold text-slate-900">{formatINR(item.newPrice)}</span>
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              item.difference >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.difference >= 0 ? `+${formatINR(item.difference)}` : formatINR(item.difference)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulk}
                disabled={!previewChanges || previewChanges.length === 0 || bulkLoading}
                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {bulkLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Apply Price Changes Instantly
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
