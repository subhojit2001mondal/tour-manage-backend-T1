import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Power,
  Building2,
  MapPin,
  Car,
  Utensils,
  Hotel,
  Calendar,
  X,
  PlusCircle,
  Trash,
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Sparkles,
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
import { formatINR } from '../lib/formatters.ts';
import {
  TourPackage,
  Agency,
  Destination,
  VehicleType,
  MealPlan,
  CuisineType,
  HotelCategory,
  HotelOccupancy,
  ItineraryDay,
} from '../types/index.ts';
import { ConfirmModal } from '../components/ConfirmModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

const VEHICLE_TYPES: VehicleType[] = [
  'Sedan',
  'SUV',
  'Tempo Traveller',
  'Mini Bus',
  'Luxury Coach',
  '4x4 Jeep',
  'Train + Cab',
  'Flight + Cab',
  'Boat/Houseboat',
  'Other',
];

const MEAL_PLANS: MealPlan[] = ['No meals', 'Breakfast only', 'Breakfast + Dinner', 'All meals'];
const CUISINE_TYPES: CuisineType[] = ['Veg', 'Non-veg', 'Veg & Non-veg'];
const HOTEL_CATEGORIES: HotelCategory[] = [
  'Budget',
  '3-star',
  '4-star',
  '5-star',
  'Heritage',
  'Resort',
  'Homestay',
  'Houseboat',
  'Camp',
];
const OCCUPANCIES: HotelOccupancy[] = ['Single', 'Double sharing', 'Triple sharing'];

export const PackagesScreen: React.FC = () => {
  const { isOwner } = useAuth();
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('All');
  const [selectedAgency, setSelectedAgency] = useState('All');

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basics' | 'vehicle' | 'food' | 'hotel'>('basics');
  const [editingPkg, setEditingPkg] = useState<Partial<TourPackage> | null>(null);
  const [deletingPkg, setDeletingPkg] = useState<TourPackage | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inclusions/Exclusions inputs
  const [inclusionInput, setInclusionInput] = useState('');
  const [exclusionInput, setExclusionInput] = useState('');
  const [amenityInput, setAmenityInput] = useState('');

  // Quick inline creation states for agencies & destinations
  const [showQuickAgency, setShowQuickAgency] = useState(false);
  const [quickAgencyName, setQuickAgencyName] = useState('');
  const [quickAgencyCity, setQuickAgencyCity] = useState('Srinagar');
  const [showQuickDest, setShowQuickDest] = useState(false);
  const [quickDestName, setQuickDestName] = useState('');
  const [quickDestState, setQuickDestState] = useState('Jammu & Kashmir');
  const [quickCreating, setQuickCreating] = useState(false);

  const handleCreateDefaultStarterData = async () => {
    setQuickCreating(true);
    try {
      const sampleAgency: Agency = {
        id: 'agency-himalayan-horizons',
        name: 'Himalayan Horizons Travel Co.',
        logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&q=80',
        description: 'Premier tour and transport operator specializing in scenic northern and mountain circuits.',
        tier: 'premium',
        rating: 4.9,
        verified: true,
        phone: '+91 98765 43210',
        email: 'ops@himalayanhorizons.test',
        city: 'Srinagar',
        commissionPercent: 12,
        active: true,
      };

      const sampleDest: Destination = {
        id: 'kashmir',
        name: 'Kashmir',
        state: 'Jammu & Kashmir',
        region: 'North',
        description: 'Paradise on Earth with serene Dal Lake, houseboats, and snow-clad peaks.',
        coverImageUrl: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800&q=80',
        galleryUrls: [
          'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800&q=80',
          'https://images.unsplash.com/photo-1620619767323-b95a89183081?w=800&q=80',
        ],
        bestSeason: 'Mar - Oct',
        tags: ['Mountains', 'Houseboat', 'Lakes', 'Snow'],
        featured: true,
        active: true,
      };

      await setDoc(doc(db, 'agencies', sampleAgency.id), sampleAgency);
      await setDoc(doc(db, 'destinations', sampleDest.id), sampleDest);

      setEditingPkg((prev) =>
        prev
          ? {
              ...prev,
              agencyId: sampleAgency.id,
              destinationId: sampleDest.id,
            }
          : null
      );
    } catch (err: any) {
      setError(err.message || 'Failed to create starter records');
    } finally {
      setQuickCreating(false);
    }
  };

  const handleSaveQuickAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAgencyName.trim()) return;
    setQuickCreating(true);
    try {
      const id = 'agency-' + quickAgencyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const newAgency: Agency = {
        id,
        name: quickAgencyName.trim(),
        logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&q=80',
        description: `Local operations partner for tour packages.`,
        tier: 'standard',
        rating: 4.8,
        verified: true,
        phone: '+91 98765 00000',
        email: `contact@${id}.test`,
        city: quickAgencyCity.trim() || 'Srinagar',
        commissionPercent: 10,
        active: true,
      };
      await setDoc(doc(db, 'agencies', id), newAgency);
      setEditingPkg((prev) => (prev ? { ...prev, agencyId: id } : null));
      setQuickAgencyName('');
      setShowQuickAgency(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create agency');
    } finally {
      setQuickCreating(false);
    }
  };

  const handleSaveQuickDest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDestName.trim()) return;
    setQuickCreating(true);
    try {
      const id = quickDestName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const newDest: Destination = {
        id,
        name: quickDestName.trim(),
        state: quickDestState.trim() || 'Jammu & Kashmir',
        region: 'North',
        description: `Scenic destinations and cultural tours.`,
        coverImageUrl: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800&q=80',
        galleryUrls: ['https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800&q=80'],
        bestSeason: 'Year-round',
        tags: ['Explore', 'Sightseeing'],
        featured: true,
        active: true,
      };
      await setDoc(doc(db, 'destinations', id), newDest);
      setEditingPkg((prev) => (prev ? { ...prev, destinationId: id } : null));
      setQuickDestName('');
      setShowQuickDest(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create destination');
    } finally {
      setQuickCreating(false);
    }
  };

  useEffect(() => {
    const unsubPkgs = onSnapshot(
      collection(db, 'packages'),
      (snap) => {
        setPackages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TourPackage)));
      },
      (err) => console.warn('Packages listener notice:', err.message)
    );
    const unsubAgencies = onSnapshot(
      collection(db, 'agencies'),
      (snap) => {
        setAgencies(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agency)));
      },
      (err) => console.warn('Agencies listener notice:', err.message)
    );
    const unsubDests = onSnapshot(
      collection(db, 'destinations'),
      (snap) => {
        setDestinations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Destination)));
      },
      (err) => console.warn('Destinations listener notice:', err.message)
    );

    return () => {
      unsubPkgs();
      unsubAgencies();
      unsubDests();
    };
  }, []);

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.title.toLowerCase().includes(search.toLowerCase()) ||
      pkg.id.toLowerCase().includes(search.toLowerCase());
    const matchesDest = selectedDestination === 'All' || pkg.destinationId === selectedDestination;
    const matchesAgency = selectedAgency === 'All' || pkg.agencyId === selectedAgency;
    return matchesSearch && matchesDest && matchesAgency;
  });

  const handleOpenAdd = () => {
    const defaultDest = destinations[0]?.id || 'kashmir';
    const defaultAgency = agencies[0]?.id || 'agency-himalayan-horizons';

    setEditingPkg({
      id: '',
      agencyId: defaultAgency,
      destinationId: defaultDest,
      title: '',
      days: 5,
      nights: 4,
      pricePerPerson: 18500,
      inclusions: [
        'Accommodation on double sharing basis',
        'Daily breakfast and dinner',
        'Private AC vehicle for all transfers and sightseeing',
        'Toll tax, parking, and driver allowance',
      ],
      exclusions: [
        'Airfare / train fare',
        'Entry tickets and monument fees',
        'Personal expenses and 5% GST',
      ],
      itinerary: [
        { day: 1, title: 'Arrival & Welcome', details: 'Airport pickup and transfer to hotel. Rest and local bazaar visit.' },
        { day: 2, title: 'Full Day Highlights Tour', details: 'Guided visits to major monuments, viewpoints, and cultural centers.' },
        { day: 3, title: 'Nature Excursion', details: 'Scenic valley exploration and photography.' },
        { day: 4, title: 'Leisure & Shopping', details: 'Free day for souvenir shopping and authentic dinner.' },
        { day: 5, title: 'Departure Transfer', details: 'Morning breakfast and drop to airport or railway station.' },
      ],
      cancellationPolicy: '100% refund 15+ days prior; 50% refund 7-14 days; non-refundable within 7 days of departure date.',
      maxGroupSize: 16,
      imageUrls: ['https://picsum.photos/seed/pkg-new/800/600'],
      rating: 4.6,
      active: true,
      vehicle: {
        type: 'Sedan',
        vehicleName: 'Maruti Suzuki Dzire AC',
        ac: true,
        seatingCapacity: 4,
        stationOrAirportPickup: true,
        details: 'Private air-conditioned sedan with courteous commercial driver.',
        imageUrl: 'https://picsum.photos/seed/veh-sample/800/600',
      },
      food: {
        mealPlan: 'Breakfast + Dinner',
        cuisine: 'Veg & Non-veg',
        jainOnRequest: true,
        details: 'Daily buffet meals featuring fresh local ingredients.',
      },
      hotel: {
        hotelName: 'Heritage View Resort',
        category: '4-star',
        roomType: 'Deluxe Valley View Room',
        occupancy: 'Double sharing',
        amenities: ['Free Wi-Fi', 'Swimming Pool', 'Room Service', 'Power Backup'],
        details: 'Centrally located property with panoramic balconies.',
        imageUrls: ['https://picsum.photos/seed/hotel-sample/800/600'],
      },
    });
    setActiveTab('basics');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: TourPackage) => {
    setEditingPkg(JSON.parse(JSON.stringify(pkg)));
    setActiveTab('basics');
    setIsModalOpen(true);
  };

  const handleDuplicate = async (pkg: TourPackage) => {
    if (!isOwner) return;
    try {
      const newId = `pkg-copy-${Date.now().toString().slice(-6)}`;
      const duplicated: TourPackage = {
        ...pkg,
        id: newId,
        title: `Copy of ${pkg.title}`,
        active: false, // inactive initially
      };
      await setDoc(doc(db, 'packages', newId), duplicated);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'packages');
    }
  };

  const handleToggleActive = async (pkg: TourPackage) => {
    if (!isOwner) return;
    try {
      await updateDoc(doc(db, 'packages', pkg.id), {
        active: !pkg.active,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `packages/${pkg.id}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPkg || !isOwner) return;
    setError(null);
    setSaving(true);

    try {
      const id = editingPkg.id || `pkg-${Date.now()}`;
      const payload = {
        ...editingPkg,
        days: Number(editingPkg.days) || 1,
        nights: Number(editingPkg.nights) || 0,
        pricePerPerson: Number(editingPkg.pricePerPerson) || 0,
        maxGroupSize: Number(editingPkg.maxGroupSize) || 10,
        rating: Number(editingPkg.rating) || 4.5,
      };

      await setDoc(doc(db, 'packages', id), payload, { merge: true });
      setIsModalOpen(false);
      setEditingPkg(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPkg || !isOwner) return;
    try {
      await deleteDoc(doc(db, 'packages', deletingPkg.id));
      setDeletingPkg(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `packages/${deletingPkg.id}`);
    }
  };

  // Itinerary helper
  const addItineraryDay = () => {
    if (!editingPkg) return;
    const current = editingPkg.itinerary || [];
    const nextDayNum = current.length + 1;
    setEditingPkg({
      ...editingPkg,
      itinerary: [
        ...current,
        {
          day: nextDayNum,
          title: `Day ${nextDayNum} Excursion`,
          details: 'Sightseeing and travel details for this day.',
        },
      ],
    });
  };

  const removeItineraryDay = (index: number) => {
    if (!editingPkg) return;
    const updated = (editingPkg.itinerary || []).filter((_, i) => i !== index);
    // Re-index days
    const reindexed = updated.map((item, idx) => ({ ...item, day: idx + 1 }));
    setEditingPkg({ ...editingPkg, itinerary: reindexed });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tour Packages</h1>
          <p className="text-sm text-slate-500">
            Agency-supplied itineraries, vehicles, food menus, and hotels curated under Tour Manage.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Tour Package
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Destination Dropdown */}
          <select
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Destinations ({destinations.length})</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Agency Dropdown */}
          <select
            value={selectedAgency}
            onChange={(e) => setSelectedAgency(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Agencies ({agencies.length})</option>
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Packages Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Package & Itinerary</th>
                <th className="py-3 px-5">Agency & Destination</th>
                <th className="py-3 px-5">Vehicle & Stay</th>
                <th className="py-3 px-5 text-right">Price per Person</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No packages match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => {
                  const dest = destinations.find((d) => d.id === pkg.destinationId);
                  const agency = agencies.find((a) => a.id === pkg.agencyId);

                  return (
                    <tr
                      key={pkg.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !pkg.active ? 'opacity-60 bg-slate-50/40' : ''
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={pkg.imageUrls?.[0] || 'https://picsum.photos/seed/pkg/200/200'}
                            alt={pkg.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/200/200';
                            }}
                          />
                          <div>
                            <span className="font-bold text-slate-900 block line-clamp-1">{pkg.title}</span>
                            <span className="text-xs text-indigo-600 font-semibold">
                              {pkg.days} Days / {pkg.nights} Nights • Max {pkg.maxGroupSize} guests
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="line-clamp-1">{agency?.name || pkg.agencyId}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{dest?.name || pkg.destinationId}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="text-xs text-slate-700 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          <span>{pkg.vehicle?.type} ({pkg.vehicle?.vehicleName})</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <Hotel className="w-3.5 h-3.5 text-slate-400" />
                          <span>{pkg.hotel?.category} ({pkg.hotel?.hotelName})</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <span className="text-base font-extrabold text-slate-900">
                          {formatINR(pkg.pricePerPerson)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">per person</span>
                      </td>

                      <td className="py-4 px-5 text-center">
                        {pkg.active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isOwner && (
                            <>
                              <button
                                onClick={() => handleToggleActive(pkg)}
                                title={pkg.active ? 'Deactivate package' : 'Activate package'}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  pkg.active
                                    ? 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {pkg.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>

                              <button
                                onClick={() => handleDuplicate(pkg)}
                                title="Duplicate package"
                                className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenEdit(pkg)}
                                title="Edit package"
                                className="p-1.5 bg-white hover:bg-slate-100 text-indigo-600 rounded-lg border border-slate-200 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setDeletingPkg(pkg)}
                                title="Delete package"
                                className="p-1.5 bg-white hover:bg-red-50 text-red-600 rounded-lg border border-slate-200 hover:border-red-200 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Section Form Modal for Tour Package */}
      {isModalOpen && editingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingPkg.id ? 'Edit Tour Package' : 'Create New Tour Package'}
                </h2>
                <p className="text-xs text-slate-500">
                  Enter details provided by partner agency on vehicle, dining, and hotel standards.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 shrink-0">
              {[
                { id: 'basics', label: '1. Basics & Itinerary', icon: Package },
                { id: 'vehicle', label: '2. Vehicle & Transit', icon: Car },
                { id: 'food', label: '3. Food & Dining', icon: Utensils },
                { id: 'hotel', label: '4. Hotel & Stay', icon: Hotel },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors ${
                      isActive
                        ? 'border-indigo-600 text-indigo-600 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* SECTION 1: BASICS */}
              {activeTab === 'basics' && (
                <div className="space-y-4">
                  {/* Empty warning banner & 1-click sample data */}
                  {(agencies.length === 0 || destinations.length === 0) && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2.5">
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Why are Partner Agency and Destination empty?</span>
                      </div>
                      <p className="text-amber-800 leading-relaxed text-[11px]">
                        A Tour Package must be connected to an <strong>operating Agency</strong> (from the Agencies tab) and a <strong>Destination</strong> (from the Destinations tab). Because this is a fresh setup with no records added yet, the dropdowns are currently empty.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCreateDefaultStarterData}
                          disabled={quickCreating}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {quickCreating ? 'Creating...' : 'Create Starter Agency & Destination (1-Click)'}
                        </button>
                        <span className="text-[11px] text-amber-700">or use the "+ Add" buttons below to type your own!</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Partner Agency */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Partner Agency *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowQuickAgency(!showQuickAgency)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                        >
                          {showQuickAgency ? 'Close' : '+ Add New Agency'}
                        </button>
                      </div>

                      {showQuickAgency ? (
                        <div className="p-3 bg-slate-50 border border-indigo-200 rounded-xl space-y-2">
                          <input
                            type="text"
                            placeholder="Agency Name (e.g. Himalayan Horizons)"
                            value={quickAgencyName}
                            onChange={(e) => setQuickAgencyName(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="City (e.g. Srinagar)"
                              value={quickAgencyCity}
                              onChange={(e) => setQuickAgencyCity(e.target.value)}
                              className="w-1/2 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={handleSaveQuickAgency}
                              disabled={quickCreating || !quickAgencyName.trim()}
                              className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold py-1.5 disabled:opacity-50"
                            >
                              {quickCreating ? 'Saving...' : 'Save & Select'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <select
                          required
                          value={editingPkg.agencyId || ''}
                          onChange={(e) => setEditingPkg({ ...editingPkg, agencyId: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        >
                          {agencies.length === 0 && (
                            <option value="" disabled>
                              -- No agencies created yet (click + Add New Agency) --
                            </option>
                          )}
                          {agencies.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.city} • {a.tier})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Destination */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Destination *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowQuickDest(!showQuickDest)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                        >
                          {showQuickDest ? 'Close' : '+ Add New Destination'}
                        </button>
                      </div>

                      {showQuickDest ? (
                        <div className="p-3 bg-slate-50 border border-indigo-200 rounded-xl space-y-2">
                          <input
                            type="text"
                            placeholder="Destination (e.g. Kashmir or Goa)"
                            value={quickDestName}
                            onChange={(e) => setQuickDestName(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="State (e.g. Jammu & Kashmir)"
                              value={quickDestState}
                              onChange={(e) => setQuickDestState(e.target.value)}
                              className="w-1/2 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={handleSaveQuickDest}
                              disabled={quickCreating || !quickDestName.trim()}
                              className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold py-1.5 disabled:opacity-50"
                            >
                              {quickCreating ? 'Saving...' : 'Save & Select'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <select
                          required
                          value={editingPkg.destinationId || ''}
                          onChange={(e) => setEditingPkg({ ...editingPkg, destinationId: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        >
                          {destinations.length === 0 && (
                            <option value="" disabled>
                              -- No destinations created yet (click + Add New Destination) --
                            </option>
                          )}
                          {destinations.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.region})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Package Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingPkg.title || ''}
                      onChange={(e) => setEditingPkg({ ...editingPkg, title: e.target.value })}
                      placeholder="e.g. Kashmir Paradise: Houseboat, Gulmarg & Pahalgam Valley"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Days *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={editingPkg.days || 1}
                        onChange={(e) => {
                          const days = parseInt(e.target.value) || 1;
                          setEditingPkg({ ...editingPkg, days, nights: Math.max(0, days - 1) });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Nights *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editingPkg.nights || 0}
                        onChange={(e) => setEditingPkg({ ...editingPkg, nights: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Price Per Person (₹) *
                      </label>
                      <input
                        type="number"
                        min="500"
                        required
                        value={editingPkg.pricePerPerson || 0}
                        onChange={(e) => setEditingPkg({ ...editingPkg, pricePerPerson: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Max Group Size *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={editingPkg.maxGroupSize || 10}
                        onChange={(e) => setEditingPkg({ ...editingPkg, maxGroupSize: parseInt(e.target.value) || 10 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Cancellation Policy *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={editingPkg.cancellationPolicy || ''}
                      onChange={(e) => setEditingPkg({ ...editingPkg, cancellationPolicy: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Day-wise Itinerary Builder */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Day-Wise Itinerary ({editingPkg.itinerary?.length || 0} Days)
                      </label>
                      <button
                        type="button"
                        onClick={addItineraryDay}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <PlusCircle className="w-4 h-4" /> Add Day
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(editingPkg.itinerary || []).map((item, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                              Day {item.day}
                            </span>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const copy = [...(editingPkg.itinerary || [])];
                                copy[idx].title = e.target.value;
                                setEditingPkg({ ...editingPkg, itinerary: copy });
                              }}
                              placeholder="Day Title (e.g. Arrival in Srinagar & Shikara Sunset)"
                              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeItineraryDay(idx)}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={item.details}
                            onChange={(e) => {
                              const copy = [...(editingPkg.itinerary || [])];
                              copy[idx].details = e.target.value;
                              setEditingPkg({ ...editingPkg, itinerary: copy });
                            }}
                            placeholder="Detailed sightseeing, transfers, activity notes..."
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: VEHICLE DETAILS */}
              {activeTab === 'vehicle' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                    Vehicle details are provided by the partner agency. Enter the vehicle model, seating, and pickup arrangements.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Vehicle Type *
                      </label>
                      <select
                        value={editingPkg.vehicle?.type || 'Sedan'}
                        onChange={(e) =>
                          setEditingPkg({
                            ...editingPkg,
                            vehicle: { ...editingPkg.vehicle!, type: e.target.value as VehicleType },
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      >
                        {VEHICLE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Vehicle Name / Model *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingPkg.vehicle?.vehicleName || ''}
                        onChange={(e) =>
                          setEditingPkg({
                            ...editingPkg,
                            vehicle: { ...editingPkg.vehicle!, vehicleName: e.target.value },
                          })
                        }
                        placeholder="e.g. Toyota Innova Crysta / Force Urbania"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Seating Capacity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={editingPkg.vehicle?.seatingCapacity || 4}
                        onChange={(e) =>
                          setEditingPkg({
                            ...editingPkg,
                            vehicle: {
                              ...editingPkg.vehicle!,
                              seatingCapacity: parseInt(e.target.value) || 4,
                            },
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-800">
                        <input
                          type="checkbox"
                          checked={editingPkg.vehicle?.ac !== false}
                          onChange={(e) =>
                            setEditingPkg({
                              ...editingPkg,
                              vehicle: { ...editingPkg.vehicle!, ac: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        Air Conditioned (AC)
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-800">
                        <input
                          type="checkbox"
                          checked={editingPkg.vehicle?.stationOrAirportPickup !== false}
                          onChange={(e) =>
                            setEditingPkg({
                              ...editingPkg,
                              vehicle: {
                                ...editingPkg.vehicle!,
                                stationOrAirportPickup: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        Airport / Station Pickup
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Vehicle Transit & Sightseeing Details *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={editingPkg.vehicle?.details || ''}
                      onChange={(e) =>
                        setEditingPkg({
                          ...editingPkg,
                          vehicle: { ...editingPkg.vehicle!, details: e.target.value },
                        })
                      }
                      placeholder="e.g. Dedicated chauffeur, bottled water, sanitization, luggage space, mountain driving permits..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 3: FOOD & DINING */}
              {activeTab === 'food' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Meal Plan *
                      </label>
                      <select
                        value={editingPkg.food?.mealPlan || 'Breakfast only'}
                        onChange={(e) =>
                          setEditingPkg({
                            ...editingPkg,
                            food: { ...editingPkg.food!, mealPlan: e.target.value as MealPlan },
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      >
                        {MEAL_PLANS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Cuisine Variety *
                      </label>
                      <select
                        value={editingPkg.food?.cuisine || 'Veg & Non-veg'}
                        onChange={(e) =>
                          setEditingPkg({
                            ...editingPkg,
                            food: { ...editingPkg.food!, cuisine: e.target.value as CuisineType },
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      >
                        {CUISINE_TYPES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={editingPkg.food?.jainOnRequest !== false}
                        onChange={(e) =>
                          setEditingPkg({
                            ...editingPkg,
                            food: { ...editingPkg.food!, jainOnRequest: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      Jain Food Available on Request (No onion/garlic/roots)
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Sample Menu & Regional Dining Notes *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={editingPkg.food?.details || ''}
                      onChange={(e) =>
                        setEditingPkg({
                          ...editingPkg,
                          food: { ...editingPkg.food!, details: e.target.value },
                        })
                      }
                      placeholder="e.g. Traditional Wazwan feast, Rajasthani Thali, authentic Kerala Sadhya on banana leaf..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 4: HOTEL & STAY */}
              {activeTab === 'hotel' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Hotel / Property Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingPkg.hotel?.hotelName || ''}
                        onChange={(e) =>
                          setEditingPkg({
                            ...editingPkg,
                            hotel: { ...editingPkg.hotel!, hotelName: e.target.value },
                          })
                        }
                        placeholder="e.g. Chhotu Singh Haveli / Punnamada Kettuvallam"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Property Category *
                      </label>
                      <select
                        value={editingPkg.hotel?.category || '4-star'}
                        onChange={(e) =>
                          setEditingPkg({
                            ...editingPkg,
                            hotel: { ...editingPkg.hotel!, category: e.target.value as HotelCategory },
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      >
                        {HOTEL_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Room Type *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingPkg.hotel?.roomType || ''}
                        onChange={(e) =>
                          setEditingPkg({
                            ...editingPkg,
                            hotel: { ...editingPkg.hotel!, roomType: e.target.value },
                          })
                        }
                        placeholder="e.g. Deluxe Balcony Suite / Swiss Tent"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Occupancy *
                      </label>
                      <select
                        value={editingPkg.hotel?.occupancy || 'Double sharing'}
                        onChange={(e) =>
                          setEditingPkg({
                            ...editingPkg,
                            hotel: { ...editingPkg.hotel!, occupancy: e.target.value as HotelOccupancy },
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      >
                        {OCCUPANCIES.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Hotel Details & Facilities *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={editingPkg.hotel?.details || ''}
                      onChange={(e) =>
                        setEditingPkg({
                          ...editingPkg,
                          hotel: { ...editingPkg.hotel!, details: e.target.value },
                        })
                      }
                      placeholder="e.g. Swimming pool, panoramic mountain views, power backup, central heating in winter..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Step {activeTab === 'basics' ? '1' : activeTab === 'vehicle' ? '2' : activeTab === 'food' ? '3' : '4'} of 4
                </div>

                <div className="flex items-center gap-2">
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
                    Save Tour Package
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingPkg}
        title="Delete Tour Package?"
        message={`Are you sure you want to permanently delete "${deletingPkg?.title}"? All scheduled departures for this package will be removed.`}
        confirmText="Delete Package"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleDelete}
        onCancel={() => setDeletingPkg(null)}
      />
    </div>
  );
};
