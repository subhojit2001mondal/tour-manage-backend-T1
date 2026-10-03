import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  X,
  Filter,
  Image as ImageIcon,
  Check,
  AlertCircle,
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
import { Destination, Region } from '../types/index.ts';
import { ConfirmModal } from '../components/ConfirmModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

const REGIONS: Region[] = ['North', 'South', 'East', 'West', 'Central', 'Northeast', 'Islands'];

export const DestinationsScreen: React.FC = () => {
  const { isOwner } = useAuth();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [editingDest, setEditingDest] = useState<Partial<Destination> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingDest, setDeletingDest] = useState<Destination | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'destinations'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Destination));
      setDestinations(list);
    }, (err) => {
      console.error('Error fetching destinations:', err);
    });
    return () => unsub();
  }, []);

  const filteredDestinations = destinations.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.state.toLowerCase().includes(search.toLowerCase()) ||
      d.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesRegion = regionFilter === 'All' || d.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  const handleOpenAdd = () => {
    setEditingDest({
      id: '',
      name: '',
      state: '',
      region: 'North',
      description: '',
      coverImageUrl: 'https://picsum.photos/seed/new-dest/800/600',
      galleryUrls: [],
      bestSeason: 'Oct - Mar',
      tags: ['Sightseeing', 'Heritage'],
      featured: false,
      active: true,
    });
    setTagInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dest: Destination) => {
    setEditingDest({ ...dest });
    setTagInput('');
    setIsModalOpen(true);
  };

  const handleToggleActive = async (dest: Destination) => {
    if (!isOwner) return;
    try {
      await updateDoc(doc(db, 'destinations', dest.id), {
        active: !dest.active,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `destinations/${dest.id}`);
    }
  };

  const handleToggleFeatured = async (dest: Destination) => {
    if (!isOwner) return;
    try {
      await updateDoc(doc(db, 'destinations', dest.id), {
        featured: !dest.featured,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `destinations/${dest.id}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDest || !isOwner) return;
    setError(null);
    setSaving(true);

    try {
      const id = editingDest.id
        ? editingDest.id
        : editingDest.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `dest-${Date.now()}`;

      const payload = {
        name: editingDest.name || '',
        state: editingDest.state || '',
        region: editingDest.region || 'North',
        description: editingDest.description || '',
        coverImageUrl: editingDest.coverImageUrl || 'https://picsum.photos/seed/india/800/600',
        galleryUrls: editingDest.galleryUrls || [],
        bestSeason: editingDest.bestSeason || '',
        tags: editingDest.tags || [],
        featured: !!editingDest.featured,
        active: editingDest.active !== false,
      };

      await setDoc(doc(db, 'destinations', id), payload, { merge: true });
      setIsModalOpen(false);
      setEditingDest(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save destination');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDest || !isOwner) return;
    try {
      await deleteDoc(doc(db, 'destinations', deletingDest.id));
      setDeletingDest(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `destinations/${deletingDest.id}`);
    }
  };

  const addTag = () => {
    if (!tagInput.trim() || !editingDest) return;
    const currentTags = editingDest.tags || [];
    if (!currentTags.includes(tagInput.trim())) {
      setEditingDest({ ...editingDest, tags: [...currentTags, tagInput.trim()] });
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    if (!editingDest) return;
    setEditingDest({
      ...editingDest,
      tags: (editingDest.tags || []).filter((t) => t !== tagToRemove),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Destinations</h1>
          <p className="text-sm text-slate-500">
            Manage travel hubs across Indian states and union territories.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Destination
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search destination by name, state or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Region:
          </span>
          <button
            onClick={() => setRegionFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              regionFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({destinations.length})
          </button>
          {REGIONS.map((reg) => {
            const count = destinations.filter((d) => d.region === reg).length;
            return (
              <button
                key={reg}
                onClick={() => setRegionFilter(reg)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  regionFilter === reg ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {reg} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDestinations.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No destinations found</p>
            <p className="text-xs text-slate-400 mt-1">Try changing your search keywords or region filter.</p>
          </div>
        ) : (
          filteredDestinations.map((dest) => (
            <div
              key={dest.id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                dest.active ? 'border-slate-200' : 'border-slate-300 opacity-60 bg-slate-50'
              }`}
            >
              <div>
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={dest.coverImageUrl}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/800/600';
                    }}
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                      {dest.region}
                    </span>
                    {dest.featured && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 flex items-center gap-1 shadow-xs">
                        <Star className="w-3 h-3 fill-slate-950" /> Featured
                      </span>
                    )}
                  </div>

                  {!dest.active && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
                        Hidden from App
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">{dest.name}</h3>
                      <p className="text-xs font-semibold text-indigo-600 mt-0.5">{dest.state}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {dest.description}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Best Season:</span>
                    <span>{dest.bestSeason}</span>
                  </div>

                  {dest.tags && dest.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {dest.tags.map((t, idx) => (
                        <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Toolbar (Owner Only) */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => handleToggleFeatured(dest)}
                        title={dest.featured ? 'Remove from featured' : 'Mark as featured'}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          dest.featured
                            ? 'bg-amber-100 text-amber-700 border-amber-300'
                            : 'bg-white text-slate-400 border-slate-200 hover:text-amber-600'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleActive(dest)}
                        title={dest.active ? 'Hide from Android app' : 'Publish to Android app'}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          dest.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white text-slate-400 border-slate-200 hover:text-emerald-600'
                        }`}
                      >
                        {dest.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </>
                  )}
                </div>

                {isOwner && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(dest)}
                      className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors"
                      title="Edit Destination"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingDest(dest)}
                      className="p-1.5 bg-white hover:bg-red-50 text-red-600 rounded-lg border border-slate-200 hover:border-red-200 transition-colors"
                      title="Delete Destination"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && editingDest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">
                {editingDest.id ? 'Edit Destination' : 'Add New Indian Destination'}
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
                    Destination Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDest.name || ''}
                    onChange={(e) => setEditingDest({ ...editingDest, name: e.target.value })}
                    placeholder="e.g. Kashmir (Srinagar, Gulmarg)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    State / UT *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDest.state || ''}
                    onChange={(e) => setEditingDest({ ...editingDest, state: e.target.value })}
                    placeholder="e.g. Jammu & Kashmir"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Region *
                  </label>
                  <select
                    value={editingDest.region || 'North'}
                    onChange={(e) => setEditingDest({ ...editingDest, region: e.target.value as Region })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Best Season to Visit *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDest.bestSeason || ''}
                    onChange={(e) => setEditingDest({ ...editingDest, bestSeason: e.target.value })}
                    placeholder="e.g. Oct - Mar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cover Image URL *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={editingDest.coverImageUrl || ''}
                    onChange={(e) => setEditingDest({ ...editingDest, coverImageUrl: e.target.value })}
                    placeholder="https://picsum.photos/seed/kashmir/800/600"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const seed = editingDest.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'india-trip';
                      setEditingDest({
                        ...editingDest,
                        coverImageUrl: `https://picsum.photos/seed/${seed}/800/600`,
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
                  Overview & Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingDest.description || ''}
                  onChange={(e) => setEditingDest({ ...editingDest, description: e.target.value })}
                  placeholder="Describe the geography, culture, tourist landmarks..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tags & Highlights
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add tag (e.g. Snow, Houseboat, Heritage)..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(editingDest.tags || []).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-indigo-400 hover:text-indigo-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDest.featured || false}
                    onChange={(e) => setEditingDest({ ...editingDest, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-800">Featured Destination</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDest.active !== false}
                    onChange={(e) => setEditingDest({ ...editingDest, active: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-800">Active (Visible in App)</span>
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
                  Save Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingDest}
        title="Delete Destination?"
        message={`Are you sure you want to permanently delete "${deletingDest?.name}"? Any tour packages linked to this destination may be affected.`}
        confirmText="Delete Destination"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleDelete}
        onCancel={() => setDeletingDest(null)}
      />
    </div>
  );
};
