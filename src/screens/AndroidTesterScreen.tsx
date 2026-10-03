import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Bot,
  Send,
  CreditCard,
  PhoneCall,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  User,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Building2,
  Car,
  Utensils,
  Hotel,
  Calendar,
  X,
  Eye,
  Check,
  Headphones,
  UserCheck,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { formatINR, formatIST, formatRelativeTime } from '../lib/formatters.ts';
import { TourPackage, Departure, Destination, Agency, ChatMessage, Chat, CallbackRequest } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const AndroidTesterScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalog' | 'booking' | 'chat' | 'callback' | 'profile'>('catalog');

  // Firestore Data
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);

  // Catalog State
  const [selectedDestinationFilter, setSelectedDestinationFilter] = useState<string>('All');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [inspectingPackage, setInspectingPackage] = useState<TourPackage | null>(null);
  const [inspectTab, setInspectTab] = useState<'itinerary' | 'vehicle' | 'food' | 'hotel'>('itinerary');

  // Booking Flow State
  const [selectedPkgId, setSelectedPkgId] = useState<string>('');
  const [selectedDepId, setSelectedDepId] = useState<string>('');
  const [travelerName, setTravelerName] = useState('Aakash Patel');
  const [travelerAge, setTravelerAge] = useState(29);
  const [holdResult, setHoldResult] = useState<any | null>(null);
  const [holdLoading, setHoldLoading] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number>(900); // 15 min

  // Payment Verification State
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);

  // Chat State
  const [chatId, setChatId] = useState<string>('');
  const [chatData, setChatData] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('Tell me about your Kashmir tour package and hotel amenities.');
  const [chatLoading, setChatLoading] = useState(false);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Callback State
  const [cbName, setCbName] = useState('Sunita Roy');
  const [cbPhone, setCbPhone] = useState('+91 98111 22334');
  const [cbTopic, setCbTopic] = useState('Looking for luxury Goa beach villa package in December');
  const [cbLoading, setCbLoading] = useState(false);
  const [cbSuccess, setCbSuccess] = useState(false);
  const [recentCallbacks, setRecentCallbacks] = useState<CallbackRequest[]>([]);

  // Customer Profile State
  const [profileName, setProfileName] = useState('Vikram Malhotra');
  const [profilePhone, setProfilePhone] = useState('+91 98765 43210');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // 1. Subscribe to Destinations, Agencies, Packages, Departures
  useEffect(() => {
    const unsubDests = onSnapshot(
      collection(db, 'destinations'),
      (snap) => {
        setDestinations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Destination)));
      },
      (err) => console.warn('Android simulator dests notice:', err.message)
    );
    const unsubAgencies = onSnapshot(
      collection(db, 'agencies'),
      (snap) => {
        setAgencies(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agency)));
      },
      (err) => console.warn('Android simulator agencies notice:', err.message)
    );
    const unsubPkgs = onSnapshot(
      collection(db, 'packages'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TourPackage));
        setPackages(list);
        if (list.length > 0 && !selectedPkgId) {
          setSelectedPkgId(list[0].id);
        }
      },
      (err) => console.warn('Android simulator pkgs notice:', err.message)
    );
    const unsubDeps = onSnapshot(
      collection(db, 'departures'),
      (snap) => {
        setDepartures(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Departure)));
      },
      (err) => console.warn('Android simulator departures notice:', err.message)
    );
    const unsubCallbacks = onSnapshot(
      collection(db, 'callbackRequests'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CallbackRequest));
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setRecentCallbacks(list.slice(0, 5));
      },
      (err) => console.warn('Android simulator callbacks notice:', err.message)
    );

    return () => {
      unsubDests();
      unsubAgencies();
      unsubPkgs();
      unsubDeps();
      unsubCallbacks();
    };
  }, [selectedPkgId]);

  // 2. Real-time Chat Subscription
  useEffect(() => {
    if (!chatId) return;

    // Chat Doc
    const unsubChat = onSnapshot(
      collection(db, 'chats'),
      (snap) => {
        const docData = snap.docs.find((d) => d.id === chatId);
        if (docData) {
          setChatData({ id: docData.id, ...docData.data() } as Chat);
        }
      },
      (err) => console.warn('Android simulator chat notice:', err.message)
    );

    // Subcollection Messages
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubMsgs = onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
        setChatMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (err) => console.warn('Android simulator msgs notice:', err.message)
    );

    return () => {
      unsubChat();
      unsubMsgs();
    };
  }, [chatId]);

  // Hold countdown timer
  useEffect(() => {
    if (!holdResult) return;
    const interval = setInterval(() => {
      setHoldSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [holdResult]);

  // Filtered packages
  const filteredCatalog = packages.filter((pkg) => {
    const matchesDest =
      selectedDestinationFilter === 'All' || pkg.destinationId === selectedDestinationFilter;
    const matchesSearch =
      pkg.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      pkg.hotel?.hotelName?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      pkg.vehicle?.vehicleName?.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesDest && matchesSearch;
  });

  // Selected package and departure objects
  const currentPackage = packages.find((p) => p.id === selectedPkgId);
  const currentDeparture = departures.find((d) => d.id === selectedDepId);
  const availableDepartures = departures.filter(
    (d) => d.packageId === selectedPkgId && d.status !== 'closed' && d.status !== 'full'
  );

  // Quick Action from Catalog to Booking
  const handleSelectPackageForBooking = (pkg: TourPackage) => {
    setSelectedPkgId(pkg.id);
    setSelectedDepId('');
    setHoldResult(null);
    setVerifyResult(null);
    setInspectingPackage(null);
    setActiveTab('booking');
  };

  // Step 1: Hold Seats (POST /api/bookings/hold)
  const handleHoldSeats = async () => {
    if (!selectedDepId) return;
    setHoldLoading(true);
    setHoldError(null);
    setHoldResult(null);
    setVerifyResult(null);
    setHoldSecondsLeft(900);

    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          departureId: selectedDepId,
          travelers: [{ name: travelerName, age: Number(travelerAge) }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to hold departure seats');
      setHoldResult(data);
    } catch (err: any) {
      setHoldError(err.message);
    } finally {
      setHoldLoading(false);
    }
  };

  // Step 2: Verify Payment (POST /api/bookings/verify)
  const handleVerifyPayment = async (result: 'success' | 'failure') => {
    if (!holdResult?.bookingId) return;
    setVerifyLoading(true);
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch('/api/bookings/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: holdResult.bookingId,
          demoResult: result,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment verification failed');
      setVerifyResult(data);
    } catch (err: any) {
      setHoldError(err.message);
    } finally {
      setVerifyLoading(false);
    }
  };

  // Chat: Send Message (POST /api/chat/message)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId: chatId || undefined,
          text: userText,
          customerId: currentUser?.uid || 'customer-android-demo',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get bot reply');

      if (data.chatId && data.chatId !== chatId) {
        setChatId(data.chatId);
      }
    } catch (err: any) {
      alert(`Chat error: ${err.message}`);
    } finally {
      setChatLoading(false);
    }
  };

  // Chat: Human Handoff (POST /api/chat/handoff)
  const handleHandoffToHuman = async () => {
    if (!chatId) {
      alert('Please send at least one message first to start a chat session.');
      return;
    }
    setHandoffLoading(true);
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch('/api/chat/handoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Handoff failed');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setHandoffLoading(false);
    }
  };

  // Callback: Submit Request (POST /api/callback-requests)
  const handleRequestCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    setCbLoading(true);
    setCbSuccess(false);
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch('/api/callback-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: cbName,
          phone: cbPhone,
          topic: cbTopic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request callback');
      setCbSuccess(true);
      setTimeout(() => setCbSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCbLoading(false);
    }
  };

  // Customer Profile: Submit (POST /api/customers/profile)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch('/api/customers/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Android App Simulator</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                Customer Mobile API
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive sandbox validating every endpoint called by the separate customer Android app (Read-only DB access).
            </p>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>API Server: <strong>Connected</strong></span>
          <span className="text-slate-300">|</span>
          <span className="text-amber-700 font-bold">Demo Payment Active</span>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'catalog', label: '1. Browse Packages & Details', icon: Building2 },
          { id: 'booking', label: '2. Seat Hold & Payment Verify', icon: CreditCard },
          { id: 'chat', label: '3. Customer AI Chat (Gemini Flash)', icon: Bot },
          { id: 'callback', label: '4. Request Phone Callback', icon: PhoneCall },
          { id: 'profile', label: '5. Customer Profile API', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-indigo-200'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BROWSE CATALOG & INSPECT DETAILS */}
      {activeTab === 'catalog' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 shrink-0">Destination:</span>
              <select
                value={selectedDestinationFilter}
                onChange={(e) => setSelectedDestinationFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
              >
                <option value="All">All Destinations ({destinations.length})</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.region})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="Search packages, vehicle, hotel..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCatalog.map((pkg) => {
              const dest = destinations.find((d) => d.id === pkg.destinationId);
              const agency = agencies.find((a) => a.id === pkg.agencyId);
              const pkgDeps = departures.filter((d) => d.packageId === pkg.id && d.status !== 'closed');

              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-indigo-300 transition-all group"
                >
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={pkg.imageUrls?.[0] || 'https://picsum.photos/seed/tour/600/400'}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {pkg.days}D / {pkg.nights}N
                    </div>
                    {dest && (
                      <div className="absolute bottom-3 left-3 bg-indigo-600/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {dest.name}
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {agency && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{agency.name}</span>
                          <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">
                            {agency.tier}
                          </span>
                        </div>
                      )}

                      <h3 className="text-base font-bold text-slate-900 leading-snug mb-3">
                        {pkg.title}
                      </h3>

                      {/* Feature Badges */}
                      <div className="grid grid-cols-2 gap-2 mb-4 text-[11px] text-slate-600">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{pkg.vehicle?.type || 'AC Sedan'}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{pkg.food?.mealPlan || 'Daily Meals'}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5 col-span-2">
                          <Hotel className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{pkg.hotel?.category} • {pkg.hotel?.hotelName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Starting from</span>
                        <span className="text-lg font-black text-indigo-600">{formatINR(pkg.pricePerPerson)}</span>
                        <span className="text-[11px] text-slate-500 font-medium"> / person</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setInspectingPackage(pkg);
                            setInspectTab('itinerary');
                          }}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSelectPackageForBooking(pkg)}
                          className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAIL MODAL / DRAWER FOR PACKAGE INSPECTION */}
      {inspectingPackage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                  {inspectingPackage.days} Days / {inspectingPackage.nights} Nights
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">{inspectingPackage.title}</h2>
                <p className="text-xs font-semibold text-slate-500">
                  Base Price: <strong className="text-indigo-600 font-bold">{formatINR(inspectingPackage.pricePerPerson)}</strong> per person • Max Group Size: {inspectingPackage.maxGroupSize}
                </p>
              </div>
              <button
                onClick={() => setInspectingPackage(null)}
                className="p-2 hover:bg-slate-200 rounded-xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Nav Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6">
              {[
                { id: 'itinerary', label: 'Day-by-Day Itinerary', icon: Calendar },
                { id: 'vehicle', label: 'Vehicle Details', icon: Car },
                { id: 'food', label: 'Food & Dining', icon: Utensils },
                { id: 'hotel', label: 'Hotel & Stay', icon: Hotel },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setInspectTab(t.id as any)}
                    className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                      inspectTab === t.id
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Tab Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {inspectTab === 'itinerary' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Day-Wise Schedule</h4>
                  <div className="space-y-3">
                    {inspectingPackage.itinerary?.map((item) => (
                      <div key={item.day} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {item.day}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{item.title}</span>
                        </div>
                        <p className="text-xs text-slate-600 pl-8 leading-relaxed">{item.details}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <h5 className="text-xs font-bold text-emerald-800 uppercase mb-2">Inclusions</h5>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {inspectingPackage.inclusions?.map((inc, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-rose-800 uppercase mb-2">Exclusions</h5>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {inspectingPackage.exclusions?.map((exc, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>{exc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                    <strong>Cancellation Policy:</strong> {inspectingPackage.cancellationPolicy}
                  </div>
                </div>
              )}

              {inspectTab === 'vehicle' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Vehicle Type</span>
                      <span className="font-bold text-slate-800 text-sm">{inspectingPackage.vehicle?.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Model / Name</span>
                      <span className="font-bold text-slate-800 text-sm">{inspectingPackage.vehicle?.vehicleName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Air Conditioning</span>
                      <span className="font-bold text-slate-800">{inspectingPackage.vehicle?.ac ? 'AC Equipped' : 'Non-AC'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Seating Capacity</span>
                      <span className="font-bold text-slate-800">{inspectingPackage.vehicle?.seatingCapacity} Passengers</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Station / Airport Pickup</span>
                      <span className="font-bold text-emerald-700">
                        {inspectingPackage.vehicle?.stationOrAirportPickup ? 'Included (Doorstep / Terminal Pickup)' : 'Not Included'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 uppercase mb-1">Vehicle Notes</h5>
                    <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                      {inspectingPackage.vehicle?.details}
                    </p>
                  </div>
                </div>
              )}

              {inspectTab === 'food' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Meal Plan</span>
                      <span className="font-bold text-slate-800 text-sm">{inspectingPackage.food?.mealPlan}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Cuisine Style</span>
                      <span className="font-bold text-slate-800 text-sm">{inspectingPackage.food?.cuisine}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Special Food Request</span>
                      <span className="font-bold text-emerald-700">
                        {inspectingPackage.food?.jainOnRequest ? 'Jain Food Available On Request' : 'Standard Kitchen Menu'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 uppercase mb-1">Sample Menu & Dining Details</h5>
                    <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                      {inspectingPackage.food?.details}
                    </p>
                  </div>
                </div>
              )}

              {inspectTab === 'hotel' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Hotel Property</span>
                      <span className="font-bold text-slate-800 text-sm">{inspectingPackage.hotel?.hotelName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Category</span>
                      <span className="font-bold text-slate-800 text-sm">{inspectingPackage.hotel?.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Room Type</span>
                      <span className="font-bold text-slate-800">{inspectingPackage.hotel?.roomType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Occupancy</span>
                      <span className="font-bold text-slate-800">{inspectingPackage.hotel?.occupancy}</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-700 uppercase mb-2">Amenities Included</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectingPackage.hotel?.amenities?.map((amenity, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                          ✓ {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-700 uppercase mb-1">Stay Description</h5>
                    <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                      {inspectingPackage.hotel?.details}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setInspectingPackage(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
              <button
                onClick={() => handleSelectPackageForBooking(inspectingPackage)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                Proceed to Book This Tour <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SEAT HOLD & PAYMENT VERIFY */}
      {activeTab === 'booking' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Interactive Booking Hold & Payment Lifecycle
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulates the Android app calling <code className="font-mono text-indigo-600 font-bold">/api/bookings/hold</code> (Firestore transaction) followed by <code className="font-mono text-indigo-600 font-bold">/api/bookings/verify</code>.
            </p>
          </div>

          {holdError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{holdError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Tour Package
              </label>
              <select
                value={selectedPkgId}
                onChange={(e) => {
                  setSelectedPkgId(e.target.value);
                  setSelectedDepId('');
                  setHoldResult(null);
                  setVerifyResult(null);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({formatINR(p.pricePerPerson)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Scheduled Departure Date
              </label>
              <select
                value={selectedDepId}
                onChange={(e) => setSelectedDepId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <option value="">-- Choose a Departure Date --</option>
                {availableDepartures.map((d) => {
                  const left = d.seatsTotal - (d.seatsBooked || 0) - (d.seatsHeld || 0);
                  const price = d.priceOverride || currentPackage?.pricePerPerson;
                  return (
                    <option key={d.id} value={d.id}>
                      {formatIST(d.date, false)} • {left} seats left • {formatINR(price)}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Departure Snapshot if selected */}
          {currentDeparture && currentPackage && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Departure Date</span>
                <span className="font-bold text-slate-900">{formatIST(currentDeparture.date, false)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Available Seats</span>
                <span className="font-bold text-emerald-700">
                  {currentDeparture.seatsTotal - (currentDeparture.seatsBooked || 0) - (currentDeparture.seatsHeld || 0)} / {currentDeparture.seatsTotal}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Price Per Person</span>
                <span className="font-bold text-indigo-700">
                  {formatINR(currentDeparture.priceOverride || currentPackage.pricePerPerson)}
                  {currentDeparture.priceOverride ? ' (Overridden)' : ''}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Departure Status</span>
                <span className="font-bold uppercase text-slate-700">{currentDeparture.status}</span>
              </div>
            </div>
          )}

          {/* Traveler Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Traveler Name
              </label>
              <input
                type="text"
                value={travelerName}
                onChange={(e) => setTravelerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Traveler Age
              </label>
              <input
                type="number"
                value={travelerAge}
                onChange={(e) => setTravelerAge(parseInt(e.target.value) || 25)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <button
              onClick={handleHoldSeats}
              disabled={!selectedDepId || holdLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {holdLoading ? 'Holding Seats in Firestore Transaction...' : 'Step 1: POST /api/bookings/hold (15 Min Hold)'}
            </button>
          </div>

          {/* Hold Result Display with 15-min countdown */}
          {holdResult && (
            <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hold Active in Firestore
                </span>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-900 bg-white px-3 py-1 rounded-xl border border-indigo-200">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>
                    Expires in: {Math.floor(holdSecondsLeft / 60)}:{(holdSecondsLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Booking Code</span>
                  <span className="font-mono text-slate-900 font-bold text-sm">{holdResult.bookingCode}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Amount Payable</span>
                  <span className="font-bold text-indigo-700 text-sm">{formatINR(holdResult.amount)}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Mode</span>
                  <span className="font-bold uppercase text-amber-700 text-sm">{holdResult.mode}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Razorpay Order</span>
                  <span className="font-mono text-slate-800 truncate block text-sm">{holdResult.orderId || 'Demo Mock'}</span>
                </div>
              </div>

              {/* Step 2: Verification buttons */}
              <div className="pt-3 border-t border-indigo-200">
                <p className="text-xs font-bold text-slate-800 mb-2">
                  Step 2: Simulate Payment Gateway Return (POST /api/bookings/verify):
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleVerifyPayment('success')}
                    disabled={verifyLoading || verifyResult}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {verifyLoading ? 'Verifying...' : 'Simulate Successful Payment'}
                  </button>
                  <button
                    onClick={() => handleVerifyPayment('failure')}
                    disabled={verifyLoading || verifyResult}
                    className="px-5 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    Simulate Payment Failed / Cancelled
                  </button>
                </div>
              </div>

              {verifyResult && (
                <div className="p-4 bg-emerald-100/70 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-start gap-3 font-semibold animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-sm block text-emerald-950">
                      Booking Confirmed and Paid!
                    </span>
                    <span>
                      Seats have been atomically transferred from <strong>held</strong> to <strong>booked</strong> in the Firestore departure record. Switch to the <strong>Bookings</strong> or <strong>Calendar</strong> screen to verify real-time updates!
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI CHATBOT (GEMINI FLASH & REAL-TIME REPLIES) */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Live Customer Support Desk
                </h2>
                {chatData && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      chatData.mode === 'human'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {chatData.mode === 'human' ? '👤 Human Agent Mode' : '🤖 Gemini Flash Bot Mode'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Grounded strictly in live Firestore data (Packages, Vehicles, Menus, Hotels, Policies). Messages update in real-time.
              </p>
            </div>

            {/* Human Handoff Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleHandoffToHuman}
                disabled={handoffLoading || chatData?.mode === 'human'}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
              >
                <Headphones className="w-3.5 h-3.5" />
                {chatData?.mode === 'human' ? 'Transferred to Staff' : 'Talk to a Human Agent'}
              </button>
            </div>
          </div>

          {/* Real-time Message Stream */}
          <div className="border border-slate-200 rounded-3xl bg-slate-50 p-4 h-96 overflow-y-auto space-y-3">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                <Bot className="w-10 h-10 text-indigo-400 mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  Start a conversation below to test the AI travel assistant!
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                  Gemini Flash will read our live destinations, vehicles, food options, and hotel details to answer questions.
                </p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isCustomer = msg.sender === 'customer';
                const isStaff = msg.sender === 'staff';
                const isBot = msg.sender === 'bot';

                return (
                  <div
                    key={msg.id || idx}
                    className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] font-bold text-slate-400 mb-0.5 px-1 flex items-center gap-1">
                      {isCustomer && <span>You (Android Customer)</span>}
                      {isStaff && <span className="text-emerald-700 font-extrabold">● Staff Representative</span>}
                      {isBot && <span className="text-indigo-600 font-extrabold">● Tour Manage AI</span>}
                      {msg.createdAt && (
                        <span className="text-[9px] text-slate-300">
                          {formatRelativeTime(msg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isCustomer
                          ? 'bg-indigo-600 text-white rounded-tr-xs'
                          : isStaff
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-tl-xs font-medium'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}

            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Gemini Flash is crafting grounded reply...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything (e.g. Do you have Jain food for Jaipur? Or: Connect me to human)..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>

          {/* Quick Query Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-[11px] font-bold text-slate-400">Sample Questions:</span>
            {[
              'What vehicle is used for Leh-Ladakh?',
              'Does the Munnar-Alleppey package include houseboats?',
              'Do you serve Jain food in Rajasthan?',
              'What is your cancellation policy?',
              'Connect me to a human agent please',
            ].map((preset, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setChatInput(preset)}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-medium transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REQUEST PHONE CALLBACK */}
      {activeTab === 'callback' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Request Phone Callback API
            </h2>
            <p className="text-xs text-slate-500">
              Simulates Android customer calling <code className="font-mono text-indigo-600 font-bold">POST /api/callback-requests</code>. Staff can see and handle it in the <strong>Support Inbox</strong>.
            </p>
          </div>

          {cbSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Callback request created! Staff in the Support Inbox will receive and action this request.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <form onSubmit={handleRequestCallback} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={cbName}
                  onChange={(e) => setCbName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={cbPhone}
                  onChange={(e) => setCbPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Topic / Trip Query
                </label>
                <textarea
                  rows={3}
                  required
                  value={cbTopic}
                  onChange={(e) => setCbTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={cbLoading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50 shadow-xs"
              >
                <PhoneCall className="w-4 h-4" />
                {cbLoading ? 'Sending Request...' : 'Submit Callback Request'}
              </button>
            </form>

            {/* Live Callback Status Tracker */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Live Callback Tracker (From DB)</h4>
              <div className="space-y-2.5">
                {recentCallbacks.map((cb) => (
                  <div key={cb.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{cb.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          cb.status === 'new'
                            ? 'bg-amber-100 text-amber-800'
                            : cb.status === 'called'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {cb.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] truncate">{cb.topic}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{cb.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOMER PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 max-w-xl animate-in fade-in">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Customer Profile API
            </h2>
            <p className="text-xs text-slate-500">
              Tests endpoint <code className="font-mono text-indigo-600 font-bold">POST /api/customers/profile</code> creating or updating the customer document in Cloud Firestore.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Customer profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              <UserCheck className="w-4 h-4" />
              {profileLoading ? 'Saving Profile...' : 'Save Customer Profile'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
