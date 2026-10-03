import {
  writeBatch,
  doc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase.ts';
import {
  DEMO_DESTINATIONS,
  DEMO_AGENCIES,
  generatePackagesAndDepartures,
  DEMO_CUSTOMERS,
  generateDemoBookings,
  DEMO_CHATS,
  DEMO_CALLBACK_REQUESTS,
  DEMO_COMPANY_SETTINGS,
  DEMO_SUPPORT_USER,
} from './demoData.ts';

export async function seedDemoDataClient() {
  console.log('Seeding demo data from client...');

  // 1. Destinations
  const destBatch = writeBatch(db);
  for (const dest of DEMO_DESTINATIONS) {
    const ref = doc(db, 'destinations', dest.id);
    destBatch.set(ref, { ...dest, isDemo: true }, { merge: true });
  }
  await destBatch.commit();

  // 2. Agencies
  const agencyBatch = writeBatch(db);
  for (const agency of DEMO_AGENCIES) {
    const ref = doc(db, 'agencies', agency.id);
    agencyBatch.set(ref, { ...agency, isDemo: true }, { merge: true });
  }
  await agencyBatch.commit();

  // 3. Packages and Departures
  const { packages, departures } = generatePackagesAndDepartures();

  for (let i = 0; i < packages.length; i += 300) {
    const batch = writeBatch(db);
    const slice = packages.slice(i, i + 300);
    for (const pkg of slice) {
      batch.set(doc(db, 'packages', pkg.id), pkg, { merge: true });
    }
    await batch.commit();
  }

  for (let i = 0; i < departures.length; i += 300) {
    const batch = writeBatch(db);
    const slice = departures.slice(i, i + 300);
    for (const dep of slice) {
      batch.set(doc(db, 'departures', dep.id), dep, { merge: true });
    }
    await batch.commit();
  }

  // 4. Customers
  const custBatch = writeBatch(db);
  for (const cust of DEMO_CUSTOMERS) {
    custBatch.set(doc(db, 'customers', cust.uid), cust, { merge: true });
  }
  await custBatch.commit();

  // 5. Bookings
  const demoBookings = generateDemoBookings(packages, departures);
  const bookBatch = writeBatch(db);
  for (const book of demoBookings) {
    bookBatch.set(doc(db, 'bookings', book.id), book, { merge: true });
  }
  await bookBatch.commit();

  // 6. Chats and messages
  for (const chat of DEMO_CHATS) {
    const { messages, ...chatData } = chat;
    await setDoc(doc(db, 'chats', chat.id), chatData, { merge: true });
    const msgBatch = writeBatch(db);
    for (const m of messages) {
      const mRef = doc(db, 'chats', chat.id, 'messages', m.id);
      msgBatch.set(mRef, { ...m, isDemo: true }, { merge: true });
    }
    await msgBatch.commit();
  }

  // 7. Callback Requests
  const cbBatch = writeBatch(db);
  for (const cb of DEMO_CALLBACK_REQUESTS) {
    cbBatch.set(doc(db, 'callbackRequests', cb.id), cb, { merge: true });
  }
  await cbBatch.commit();

  // 8. Settings
  await setDoc(doc(db, 'settings', 'company'), DEMO_COMPANY_SETTINGS, { merge: true });

  // 9. Staff doc for demo support
  await setDoc(doc(db, 'staff', 'demo-support-uid'), {
    name: DEMO_SUPPORT_USER.name,
    email: DEMO_SUPPORT_USER.email,
    role: 'support',
    active: true,
    isDemo: true,
  }, { merge: true });

  return {
    success: true,
    destinationsCount: DEMO_DESTINATIONS.length,
    agenciesCount: DEMO_AGENCIES.length,
    packagesCount: packages.length,
    departuresCount: departures.length,
    bookingsCount: demoBookings.length,
    supportLogin: {
      email: DEMO_SUPPORT_USER.email,
      password: DEMO_SUPPORT_USER.password,
      role: DEMO_SUPPORT_USER.role,
    },
  };
}

export async function deleteDemoDataClient() {
  console.log('Deleting demo data from client...');
  const collections = [
    'destinations',
    'agencies',
    'packages',
    'departures',
    'customers',
    'bookings',
    'chats',
    'callbackRequests',
    'staff',
  ];

  let deletedTotal = 0;

  for (const col of collections) {
    const snap = await getDocs(query(collection(db, col), where('isDemo', '==', true)));
    if (snap.empty) continue;

    for (const d of snap.docs) {
      if (col === 'chats') {
        const msgSnap = await getDocs(collection(db, 'chats', d.id, 'messages'));
        const msgBatch = writeBatch(db);
        for (const m of msgSnap.docs) {
          msgBatch.delete(m.ref);
        }
        await msgBatch.commit();
      }
      await deleteDoc(d.ref);
      deletedTotal++;
    }
  }

  // Settings
  const settingsRef = doc(db, 'settings', 'company');
  const sSnap = await getDoc(settingsRef);
  if (sSnap.exists() && sSnap.data()?.isDemo) {
    await deleteDoc(settingsRef);
    deletedTotal++;
  }

  return { success: true, deletedTotal };
}

import { setDoc, deleteDoc, getDoc } from 'firebase/firestore';
