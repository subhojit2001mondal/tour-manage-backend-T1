import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Phone,
  Mail,
  Percent,
  Star,
  X,
  Power,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { Agency, AgencyTier } from '../types/index.ts';
import { ConfirmModal } from '../components/ConfirmModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

const TIERS: AgencyTier[] = ['budget', 'standard', 'premium'];

export const AgenciesScreen: React.FC = () => {
  const { isOwner } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [editingAgency, setEditingAgency] = useState<Partial<Agency> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingAgency, setDeletingAgency] = useState<Agency | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'agencies'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agency));
      setAgencies(list);
    }, (err) => {
      console.error('Error fetching agencies:', err);
    });
    return () => unsub();
  }, []);

  const filteredAgencies = agencies.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'All' || a.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const handleOpenAdd = () => {
    setEditingAgency({
      id: '',
      name: '',
      logoUrl: 'https://picsum.photos/seed/agency-logo/200/200',
      description: '',
      tier: 'standard',
      rating: 4.5,
      verified: true,
      phone: '+91 90000 00000',
      email: 'contact@agency.example.com',
      city: 'New Delhi',
      commissionPercent: 10,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (agency: Agency) => {
    setEditingAgency({ ...agency });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (agency: Agency) => {
    if (!isOwner) return;
    try {
      await updateDoc(doc(db, 'agencies', agency.id), {
        active: !agency.active,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `agencies/${agency.id}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgency || !isOwner) return;
    setError(null);
    setSaving(true);

    try {
      const id = editingAgency.id
        ? editingAgency.id
        : editingAgency.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `agency-${Date.now()}`;

      const payload = {
        name: editingAgency.name || '',
        logoUrl: editingAgency.logoUrl || 'https://picsum.photos/seed/logo/200/200',
        description: editingAgency.description || '',
        tier: editingAgency.tier || 'standard',
        rating: Number(editingAgency.rating) || 4.5,
        verified: !!editingAgency.verified,
        phone: editingAgency.phone || '',
        email: editingAgency.email || '',
        city: editingAgency.city || '',
        commissionPercent: Number(editingAgency.commissionPercent) || 10,
        active: editingAgency.active !== false,
      };

      await setDoc(doc(db, 'agencies', id), payload, { merge: true });
      setIsModalOpen(false);
      setEditingAgency(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save agency');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAgency || !isOwner) return;
    try {
      await deleteDoc(doc(db, 'agencies', deletingAgency.id));
      setDeletingAgency(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `agencies/${deletingAgency.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tour Agencies</h1>
          <p className="text-sm text-slate-500">
            Local tour operators gathered under Tour Manage umbrella banner.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Partner Agency
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agency by name, city or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Tier:</span>
          <button
            onClick={() => setTierFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tierFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({agencies.length})
          </button>
          {TIERS.map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                tierFilter === tier ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Agencies Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgencies.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No agencies found</p>
            <p className="text-xs text-slate-400 mt-1">Try refining your search terms or tier filter.</p>
          </div>
        ) : (
          filteredAgencies.map((agency) => {
            let tierBadgeColor = 'bg-slate-100 text-slate-700';
            if (agency.tier === 'premium') tierBadgeColor = 'bg-purple-100 text-purple-700 border-purple-200';
            if (agency.tier === 'standard') tierBadgeColor = 'bg-blue-100 text-blue-700 border-blue-200';
            if (agency.tier === 'budget') tierBadgeColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';

            return (
              <div
                key={agency.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  agency.active ? 'border-slate-200' : 'border-slate-300 opacity-60 bg-slate-50'
                }`}
              >
                <div className="p-6">
                  {/* Top row with logo and verification */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={agency.logoUrl}
                        alt={agency.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/agency/200/200';
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-slate-900 leading-tight line-clamp-1">
                            {agency.name}
                          </h3>
                          {agency.verified && (
                            <span title="Verified Partner Agency">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{agency.city}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize border ${tierBadgeColor}`}
                    >
                      {agency.tier}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {agency.description}
                  </p>

                  {/* Rating and Commission */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2 bg-slate-50 rounded-xl flex items-center gap-2">
                      <div className="p-1 rounded-md bg-amber-100 text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Rating</span>
                        <span className="font-bold text-slate-800">{agency.rating} / 5.0</span>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl flex items-center gap-2">
                      <div className="p-1 rounded-md bg-indigo-100 text-indigo-600">
                        <Percent className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Commission</span>
                        <span className="font-bold text-slate-800">{agency.commissionPercent}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{agency.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{agency.email}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Toolbar */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {agency.active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                        Deactivated
                      </span>
                    )}
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(agency)}
                        title={agency.active ? 'Deactivate Agency' : 'Reactivate Agency'}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          agency.active
                            ? 'bg-white hover:bg-amber-50 text-amber-600 border-slate-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(agency)}
                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors"
                        title="Edit Agency"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingAgency(agency)}
                        className="p-1.5 bg-white hover:bg-red-50 text-red-600 rounded-lg border border-slate-200 hover:border-red-200 transition-colors"
                        title="Delete Agency"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit / Add Agency Modal */}
      {isModalOpen && editingAgency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">
                {editingAgency.id ? 'Edit Partner Agency' : 'Register New Partner Agency'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Agency Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAgency.name || ''}
                    onChange={(e) => setEditingAgency({ ...editingAgency, name: e.target.value })}
                    placeholder="e.g. Royal Rajputana Heritage Journeys"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City / Base *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAgency.city || ''}
                    onChange={(e) => setEditingAgency({ ...editingAgency, city: e.target.value })}
                    placeholder="e.g. Jaipur"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tier *
                  </label>
                  <select
                    value={editingAgency.tier || 'standard'}
                    onChange={(e) => setEditingAgency({ ...editingAgency, tier: e.target.value as AgencyTier })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm capitalize focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Rating (0-5) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    required
                    value={editingAgency.rating || 4.5}
                    onChange={(e) => setEditingAgency({ ...editingAgency, rating: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Commission % *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={editingAgency.commissionPercent || 10}
                    onChange={(e) => setEditingAgency({ ...editingAgency, commissionPercent: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAgency.phone || ''}
                    onChange={(e) => setEditingAgency({ ...editingAgency, phone: e.target.value })}
                    placeholder="+91 90000 0000X"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingAgency.email || ''}
                    onChange={(e) => setEditingAgency({ ...editingAgency, email: e.target.value })}
                    placeholder="contact@agency.example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Logo Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editingAgency.logoUrl || ''}
                    onChange={(e) => setEditingAgency({ ...editingAgency, logoUrl: e.target.value })}
                    placeholder="https://picsum.photos/seed/agency/200/200"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const seed = editingAgency.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'agency-logo';
                      setEditingAgency({
                        ...editingAgency,
                        logoUrl: `https://picsum.photos/seed/${seed}/200/200`,
                      });
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Picsum
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description & Specialties *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingAgency.description || ''}
                  onChange={(e) => setEditingAgency({ ...editingAgency, description: e.target.value })}
                  placeholder="Specialty regions, safari credentials, local team highlights..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Verified and Active checks */}
              <div className="pt-2 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAgency.verified !== false}
                    onChange={(e) => setEditingAgency({ ...editingAgency, verified: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-800">Verified Partner Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAgency.active !== false}
                    onChange={(e) => setEditingAgency({ ...editingAgency, active: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-800">Active Status</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Save Agency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingAgency}
        title="Delete Partner Agency?"
        message={`Are you sure you want to delete "${deletingAgency?.name}"? Packages linked to this agency may lose their agency association.`}
        confirmText="Delete Agency"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleDelete}
        onCancel={() => setDeletingAgency(null)}
      />
    </div>
  );
};
