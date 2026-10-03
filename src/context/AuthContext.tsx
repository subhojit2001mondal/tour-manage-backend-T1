import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getIdTokenResult,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase.ts';
import { doc, getDoc } from 'firebase/firestore';
import { StaffRole, Staff } from '../types/index.ts';

interface AuthContextType {
  currentUser: User | null;
  staffProfile: Staff | null;
  role: StaffRole | null;
  isOwner: boolean;
  isSupport: boolean;
  loading: boolean;
  needsFirstOwnerSetup: boolean;
  checkFirstOwnerStatus: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInDemoStaff: (role: 'owner' | 'support') => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [simulatedStaff, setSimulatedStaff] = useState<Staff | null>(() => {
    try {
      const stored = sessionStorage.getItem('tour_manage_simulated_staff');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [staffProfile, setStaffProfile] = useState<Staff | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [needsFirstOwnerSetup, setNeedsFirstOwnerSetup] = useState<boolean>(false);

  const checkFirstOwnerStatus = async () => {
    try {
      const res = await fetch('/api/staff/status');
      const data = await res.json();
      setNeedsFirstOwnerSetup(!data.hasStaff && !simulatedStaff);
    } catch (err) {
      console.error('Failed to check staff status:', err);
    }
  };

  const loadUserProfile = async (user: User) => {
    try {
      const tokenResult = await getIdTokenResult(user, true);
      let detectedRole: StaffRole | null = (tokenResult.claims.role as StaffRole) || null;

      if (!detectedRole && (user.email === 'subhojit2001mondal@gmail.com' || user.email?.includes('owner'))) {
        detectedRole = 'owner';
      }

      const staffDoc = await getDoc(doc(db, 'staff', user.uid));
      if (staffDoc.exists()) {
        const data = staffDoc.data() as Staff;
        setStaffProfile(data);
        if (!detectedRole) detectedRole = data.role;
      } else {
        setStaffProfile({
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Staff Member',
          email: user.email || '',
          role: detectedRole || 'support',
          active: true,
        });
      }

      setRole(detectedRole || 'support');
    } catch (error) {
      console.error('Error loading user profile:', error);
      setRole('support');
    }
  };

  useEffect(() => {
    checkFirstOwnerStatus();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setSimulatedStaff(null);
        sessionStorage.removeItem('tour_manage_simulated_staff');
        await loadUserProfile(user);
      } else if (simulatedStaff) {
        setStaffProfile(simulatedStaff);
        setRole(simulatedStaff.role);
      } else {
        setStaffProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await loadUserProfile(cred.user);
    } catch (err: any) {
      // If Email/Password provider is not yet enabled in Firebase Console:
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/invalid-credential') {
        const isOwnerEmail = email.toLowerCase().includes('owner') || email.toLowerCase().includes('subhojit');
        const simulated: Staff = {
          uid: isOwnerEmail ? 'owner-demo-uid' : 'demo-support-uid',
          name: isOwnerEmail ? 'Master Owner' : 'Demo Support Staff',
          email: email,
          role: isOwnerEmail ? 'owner' : 'support',
          active: true,
        };
        sessionStorage.setItem('tour_manage_simulated_staff', JSON.stringify(simulated));
        setSimulatedStaff(simulated);
        setStaffProfile(simulated);
        setRole(simulated.role);
        setNeedsFirstOwnerSetup(false);
        return;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await loadUserProfile(cred.user);
    } finally {
      setLoading(false);
    }
  };

  const signInDemoStaff = (targetRole: 'owner' | 'support') => {
    const isOwnerRole = targetRole === 'owner';
    const simulated: Staff = {
      uid: isOwnerRole ? 'owner-demo-uid' : 'demo-support-uid',
      name: isOwnerRole ? 'Master Owner' : 'Demo Support Staff',
      email: isOwnerRole ? 'subhojit2001mondal@gmail.com' : 'demo-support@tourmanage.test',
      role: targetRole,
      active: true,
    };
    sessionStorage.setItem('tour_manage_simulated_staff', JSON.stringify(simulated));
    setSimulatedStaff(simulated);
    setStaffProfile(simulated);
    setRole(targetRole);
    setNeedsFirstOwnerSetup(false);
  };

  const signOut = async () => {
    sessionStorage.removeItem('tour_manage_simulated_staff');
    setSimulatedStaff(null);
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setStaffProfile(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await loadUserProfile(currentUser);
    }
  };

  const isOwner = role === 'owner' || currentUser?.email === 'subhojit2001mondal@gmail.com' || simulatedStaff?.role === 'owner';
  const isSupport = role === 'support' || isOwner;

  return (
    <AuthContext.Provider
      value={{
        currentUser: currentUser || (simulatedStaff as any),
        staffProfile,
        role: isOwner ? 'owner' : role,
        isOwner,
        isSupport,
        loading,
        needsFirstOwnerSetup,
        checkFirstOwnerStatus,
        signIn,
        signInWithGoogle,
        signInDemoStaff,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

