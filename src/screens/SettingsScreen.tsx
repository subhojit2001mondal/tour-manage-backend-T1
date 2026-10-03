import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  FileText,
  Shield,
  ShieldAlert,
  UserPlus,
  Users,
  Power,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { CompanySettings, Staff, StaffRole } from '../types/index.ts';
import { ConfirmModal } from '../components/ConfirmModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface SettingsScreenProps {
  onSeedDemoData: () => Promise<void>;
  onDeleteDemoData: () => Promise<void>;
  loadingSeed: boolean;
  loadingDelete: boolean;
  hasDemoData: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onSeedDemoData,
  onDeleteDemoData,
  loadingSeed,
  loadingDelete,
  hasDemoData,
}) => {
  const { isOwner, currentUser } = useAuth();

  // Company Settings State
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: 'Tour Manage India Pvt. Ltd.',
    supportPhones: ['+91 1800 200 4567'],
    supportEmail: 'support@tourmanage.com',
    supportHours: 'Monday - Saturday: 9:00 AM - 8:00 PM IST',
    whatsappNumber: '+91 98200 98200',
    aboutText: 'Tour Manage is India’s premier marketplace gathering boutique tour agencies under one trusted banner.',
    termsUrl: 'https://tourmanage.com/terms-and-cancellation',
  });
  const [phoneInput, setPhoneInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Staff State
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'support' as StaffRole,
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);

  // Load company settings
  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'company'),
      (snap) => {
        if (snap.exists()) {
          setSettings(snap.data() as CompanySettings);
        }
      },
      (err) => console.warn('Company settings listener notice:', err.message)
    );

    const unsubStaff = onSnapshot(
      collection(db, 'staff'),
      (snap) => {
        setStaffList(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as Staff)));
      },
      (err) => console.warn('Staff listener notice:', err.message)
    );

    return () => {
      unsubSettings();
      unsubStaff();
    };
  }, []);

  // Save company settings
  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'company'), settings, { merge: true });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/company');
    } finally {
      setSavingSettings(false);
    }
  };

  // Add staff member via server endpoint
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setStaffError(null);
    setStaffLoading(true);
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch('/api/staff/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newStaffForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create staff member');

      setIsAddStaffOpen(false);
      setNewStaffForm({ name: '', email: '', password: '', role: 'support' });
    } catch (err: any) {
      setStaffError(err.message);
    } finally {
      setStaffLoading(false);
    }
  };

  // Change staff role
  const handleChangeRole = async (uid: string, newRole: StaffRole) => {
    if (!isOwner) return;
    try {
      const token = await currentUser?.getIdToken();
      await fetch('/api/staff/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, role: newRole }),
      });
    } catch (err) {
      console.error('Failed to change role:', err);
    }
  };

  // Toggle active state of staff
  const handleToggleStaffActive = async (uid: string, currentActive: boolean) => {
    if (!isOwner) return;
    try {
      const token = await currentUser?.getIdToken();
      await fetch('/api/staff/toggle-active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, active: !currentActive }),
      });
    } catch (err) {
      console.error('Failed to toggle staff active state:', err);
    }
  };

  // Support phone helper
  const addPhone = () => {
    if (!phoneInput.trim()) return;
    const current = settings.supportPhones || [];
    if (!current.includes(phoneInput.trim())) {
      setSettings({ ...settings, supportPhones: [...current, phoneInput.trim()] });
    }
    setPhoneInput('');
  };

  const removePhone = (pToRemove: string) => {
    setSettings({
      ...settings,
      supportPhones: (settings.supportPhones || []).filter((p) => p !== pToRemove),
    });
  };

  if (!isOwner) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Owner Access Required</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Settings, staff user permissions, and database seeding are restricted exclusively to the Owner role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500">
          Global company metadata, support contact channels, staff privileges, and sample demo seeder.
        </p>
      </div>

      {/* SECTION 1: DEMO SEEDER MANAGEMENT */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Demo Seeder Engine
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Full-Stack Demo Dataset</h2>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-xl leading-relaxed">
              Populate Firestore with 48 official Indian destinations across all zones, 12 partner agencies, 70+ detailed packages (with region-specific vehicles, local cuisine and hotels), departures, sample bookings, chats, and a demo support staff account.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowSeedModal(true)}
              disabled={loadingSeed}
              className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loadingSeed ? 'Seeding Data...' : 'Load Sample Data'}
            </button>

            {hasDemoData && (
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={loadingDelete}
                className="px-4 py-2.5 bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 font-bold text-xs rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {loadingDelete ? 'Deleting...' : 'Delete Demo Data'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: COMPANY INFORMATION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Company & Support Channels</h2>
              <p className="text-xs text-slate-500">Contact information provided to customers and AI support bot.</p>
            </div>
          </div>

          {settingsSaved && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved Successfully
            </span>
          )}
        </div>

        <form onSubmit={handleSaveCompanySettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                required
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Support Email
              </label>
              <input
                type="email"
                required
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official WhatsApp Number
              </label>
              <input
                type="text"
                value={settings.whatsappNumber || ''}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="+91 98200 98200"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Support Operating Hours
              </label>
              <input
                type="text"
                value={settings.supportHours}
                onChange={(e) => setSettings({ ...settings, supportHours: e.target.value })}
                placeholder="Mon - Sat: 9:00 AM - 8:00 PM IST"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Support Phones List */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Customer Support Phone Numbers
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPhone();
                  }
                }}
                placeholder="Add support phone (e.g. +91 1800 200 4567)..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
              />
              <button
                type="button"
                onClick={addPhone}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Add Phone
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(settings.supportPhones || []).map((phone, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3 py-1 rounded-xl text-xs font-semibold"
                >
                  <Phone className="w-3 h-3 text-slate-500" />
                  {phone}
                  <button
                    type="button"
                    onClick={() => removePhone(phone)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              About Tour Manage (App Text)
            </label>
            <textarea
              rows={3}
              value={settings.aboutText}
              onChange={(e) => setSettings({ ...settings, aboutText: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {savingSettings ? 'Saving Settings...' : 'Save Company Details'}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: STAFF MANAGEMENT */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Staff & Role Permissions</h2>
              <p className="text-xs text-slate-500">
                Manage backend team members. Role claims are enforced at the Firestore rule level.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddStaffOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((member) => (
                <tr key={member.uid} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{member.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{member.email}</div>
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.uid, e.target.value as StaffRole)}
                      className={`text-xs font-bold rounded-lg px-2.5 py-1 border ${
                        member.role === 'owner'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <option value="owner">Owner (Full Access)</option>
                      <option value="support">Support (Limited Access)</option>
                    </select>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {member.active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                        Deactivated
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleStaffActive(member.uid, member.active)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                        member.active
                          ? 'bg-white hover:bg-amber-50 text-amber-700 border-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {member.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add New Staff Member</h3>
              <button
                onClick={() => setIsAddStaffOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              {staffError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  placeholder="ramesh@tourmanage.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newStaffForm.password}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Staff Role *
                </label>
                <select
                  value={newStaffForm.role}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value as StaffRole })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
                >
                  <option value="support">Support (Chats, Callbacks, Notes only)</option>
                  <option value="owner">Owner (Full administrative control)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {staffLoading ? 'Creating User...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Seed */}
      <ConfirmModal
        isOpen={showSeedModal}
        title="Load Sample Demo Data?"
        message="This will seed 48 Indian destinations, 12 partner agencies, 70+ tour packages, 500+ departures, 15 bookings, chats, and a demo support staff login (demo-support@tourmanage.test / Demo@12345). It is safe to run multiple times without duplicating."
        confirmText="Yes, Load Demo Data"
        cancelText="Cancel"
        loading={loadingSeed}
        onConfirm={async () => {
          await onSeedDemoData();
          setShowSeedModal(false);
        }}
        onCancel={() => setShowSeedModal(false)}
      />

      {/* Confirmation Modal for Delete Demo Data */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete All Demo Data?"
        message="This will permanently delete every document where isDemo is true across all collections (including subcollections and demo support staff auth account). Any real documents you created will not be affected."
        confirmText="Delete Demo Data"
        cancelText="Cancel"
        isDangerous={true}
        loading={loadingDelete}
        onConfirm={async () => {
          await onDeleteDemoData();
          setShowDeleteModal(false);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
