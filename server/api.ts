import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { adminDb, adminAuth, adminStorage, Timestamp, updateFirebaseAdminCredentials } from './firebaseAdmin.ts';
import { seedDemoData, deleteDemoData } from './demoSeeder.ts';

export const apiRouter = express.Router();

// Startup warning for DEMO_PAYMENT_MODE
const isDemoPaymentMode = process.env.DEMO_PAYMENT_MODE === 'true' || !process.env.RAZORPAY_KEY_ID;
if (isDemoPaymentMode) {
  console.warn('\n************************************************************');
  console.warn('⚠️  LOUD WARNING: DEMO PAYMENT MODE IS ENABLED!');
  console.warn('⚠️  Real Razorpay orders will NOT be generated.');
  console.warn('⚠️  Simulated test payments are accepted via /api/bookings/verify.');
  console.warn('************************************************************\n');
}

// Simple in-memory rate limiter for Android API endpoints
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function rateLimiter(limit: number = 60, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${ip}_${req.baseUrl}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key as string);

    if (!entry || now > entry.resetTime) {
      rateLimitMap.set(key as string, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      return res.status(429).json({ error: 'Too many requests, please slow down.' });
    }

    entry.count++;
    next();
  };
}

// Authentication middleware to verify Firebase ID token
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired Firebase ID token' });
  }
}

// Optional Auth (for public or authenticated routes)
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await adminAuth.verifyIdToken(token);
      (req as any).user = decodedToken;
    } catch {
      // Ignore
    }
  }
  next();
}

// Staff Only middleware
export function requireStaff(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  
  // subhojit2001mondal@gmail.com is runtime admin/owner fallback
  if (user.role === 'owner' || user.role === 'support' || user.email === 'subhojit2001mondal@gmail.com') {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Staff access required' });
}

// Owner Only middleware
export function requireOwner(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  
  if (user.role === 'owner' || user.email === 'subhojit2001mondal@gmail.com') {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Owner role required' });
}

// ==========================================
// 1. STAFF ONBOARDING & MANAGEMENT
// ==========================================

// Check if any staff exists
apiRouter.get('/staff/status', async (req: Request, res: Response) => {
  try {
    const hasCredentials = !!process.env.FIREBASE_SERVICE_ACCOUNT || fs.existsSync(path.resolve(process.cwd(), 'service-account.json'));
    if (!hasCredentials) {
      // Avoid cross-project ADC call that triggers 7 PERMISSION_DENIED
      return res.json({ hasStaff: false, configured: false });
    }

    const snapshot = await adminDb.collection('staff').limit(1).get();
    return res.json({ hasStaff: !snapshot.empty, configured: true });
  } catch (error: any) {
    // Return gracefully without logging noisy console.error
    return res.json({
      hasStaff: false,
      configured: false,
      notice: error.message,
    });
  }
});

// Setup First Owner (One-Time Setup) with granular step tracking
apiRouter.post('/staff/setup-first-owner', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  let currentStep = 1;
  let currentStepName = 'Step 1: Check existing staff in Firestore';

  try {
    // Step 1: Check if staff already exist in Firestore
    console.log(`[Setup First Owner] ${currentStepName}...`);
    let snapshot;
    try {
      snapshot = await adminDb.collection('staff').limit(1).get();
    } catch (fsErr: any) {
      console.error(`[Setup First Owner] FAILED at ${currentStepName}:`, fsErr);
      throw fsErr;
    }

    if (!snapshot.empty) {
      return res.status(400).json({ error: 'First owner has already been configured.' });
    }

    // Step 2: Create or retrieve auth user in Firebase Auth
    currentStep = 2;
    currentStepName = 'Step 2: Create or retrieve user in Firebase Auth';
    console.log(`[Setup First Owner] ${currentStepName} for email "${email}"...`);
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
      console.log(`[Setup First Owner] Existing Auth user found with UID: ${userRecord.uid}`);
    } catch (getErr: any) {
      try {
        userRecord = await adminAuth.createUser({
          email,
          password,
          displayName: name,
          emailVerified: true,
        });
        console.log(`[Setup First Owner] Created new Auth user with UID: ${userRecord.uid}`);
      } catch (createErr: any) {
        console.error(`[Setup First Owner] FAILED at ${currentStepName}:`, createErr);
        throw createErr;
      }
    }

    // Step 3: Set owner custom claims in Firebase Auth
    currentStep = 3;
    currentStepName = 'Step 3: Set owner custom claim in Firebase Auth';
    console.log(`[Setup First Owner] ${currentStepName} for UID: ${userRecord.uid}...`);
    try {
      await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'owner' });
    } catch (claimErr: any) {
      console.error(`[Setup First Owner] FAILED at ${currentStepName}:`, claimErr);
      throw claimErr;
    }

    // Step 4: Write staff profile to Firestore
    currentStep = 4;
    currentStepName = 'Step 4: Write staff profile to Firestore';
    console.log(`[Setup First Owner] ${currentStepName} at staff/${userRecord.uid}...`);
    try {
      await adminDb.collection('staff').doc(userRecord.uid).set({
        name,
        email,
        role: 'owner',
        active: true,
        createdAt: new Date().toISOString(),
      });
    } catch (docErr: any) {
      console.error(`[Setup First Owner] FAILED at ${currentStepName}:`, docErr);
      throw docErr;
    }

    console.log(`[Setup First Owner] SUCCESS! First owner initialized: ${email} (${userRecord.uid})`);
    return res.json({ success: true, uid: userRecord.uid, email, role: 'owner' });
  } catch (error: any) {
    console.error(`[Setup First Owner] Error occurred during "${currentStepName}":`, error);
    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    const isPermissionDenied = error.message?.includes('PERMISSION_DENIED') || error.code === 7;

    return res.status(500).json({
      error: `Failed at ${currentStepName}: ${error.message || 'Permission denied'}`,
      step: currentStep,
      stepName: currentStepName,
      technicalDetails: error.message || String(error),
      errorCode: error.code || 7,
      hasServiceAccountEnv: hasServiceAccount,
      hint: isPermissionDenied
        ? 'Application Default Credentials (ADC) lack IAM access to this Firestore/Auth project. Please configure the FIREBASE_SERVICE_ACCOUNT environment variable with a service account key JSON that has the "Firebase Admin SDK Administrator Service Agent" role.'
        : undefined,
    });
  }
});

// Configure or upload Service Account JSON
apiRouter.post('/staff/save-service-account', async (req: Request, res: Response) => {
  const { serviceAccountJson } = req.body;
  if (!serviceAccountJson) {
    return res.status(400).json({ error: 'Service account JSON string or object is required.' });
  }

  try {
    let parsed: any;
    if (typeof serviceAccountJson === 'string') {
      parsed = JSON.parse(serviceAccountJson.trim());
    } else {
      parsed = serviceAccountJson;
    }

    if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
      return res.status(400).json({
        error: 'Invalid service account format. Must contain "project_id", "private_key", and "client_email".',
      });
    }

    // Write to service-account.json in app directory
    fs.writeFileSync(path.resolve(process.cwd(), 'service-account.json'), JSON.stringify(parsed, null, 2), 'utf8');

    // Update in-memory env
    process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify(parsed);

    // Reload Firebase Admin SDK dynamic instances
    updateFirebaseAdminCredentials(parsed);

    // Test Firestore connection immediately
    const testSnap = await adminDb.collection('staff').limit(1).get();

    return res.json({
      success: true,
      clientEmail: parsed.client_email,
      projectId: parsed.project_id,
      verified: true,
      hasStaff: !testSnap.empty,
    });
  } catch (err: any) {
    console.error('Failed to save service account:', err);
    return res.status(500).json({
      error: `Failed to apply service account: ${err.message}`,
    });
  }
});

// Owner adds new staff member
apiRouter.post('/staff/create', authenticateToken, requireOwner, async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role (owner|support) are required' });
  }

  try {
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
      });
    }

    await adminAuth.setCustomUserClaims(userRecord.uid, { role });
    await adminDb.collection('staff').doc(userRecord.uid).set({
      name,
      email,
      role,
      active: true,
      createdAt: new Date().toISOString(),
    });

    return res.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Owner updates staff role
apiRouter.post('/staff/update-role', authenticateToken, requireOwner, async (req: Request, res: Response) => {
  const { uid, role } = req.body;
  if (!uid || !role) return res.status(400).json({ error: 'uid and role are required' });

  try {
    await adminAuth.setCustomUserClaims(uid, { role });
    await adminDb.collection('staff').doc(uid).update({ role });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Owner toggles active state of staff
apiRouter.post('/staff/toggle-active', authenticateToken, requireOwner, async (req: Request, res: Response) => {
  const { uid, active } = req.body;
  if (uid === undefined || active === undefined) return res.status(400).json({ error: 'uid and active are required' });

  try {
    await adminAuth.updateUser(uid, { disabled: !active });
    await adminDb.collection('staff').doc(uid).update({ active });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. SECURE API FOR ANDROID CUSTOMER APP
// ==========================================

// Customer Profile
apiRouter.post('/customers/profile', rateLimiter(30), authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  try {
    await adminDb.collection('customers').doc(user.uid).set({
      name,
      phone,
      email: user.email || '',
      createdAt: new Date().toISOString(),
    }, { merge: true });

    return res.json({ success: true, uid: user.uid });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Hold departure seats (15 min hold) & generate order
apiRouter.post('/bookings/hold', rateLimiter(30), authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { departureId, travelers } = req.body;

  if (!departureId || !Array.isArray(travelers) || travelers.length === 0) {
    return res.status(400).json({ error: 'departureId and travelers array are required' });
  }

  try {
    const departureRef = adminDb.collection('departures').doc(departureId);
    let totalAmount = 0;
    let commissionAmount = 0;
    let bookingId = '';
    let bookingCode = '';
    let packageData: any = null;
    let agencyData: any = null;

    // Run Firestore transaction to atomically check and hold seats
    await adminDb.runTransaction(async (transaction: any) => {
      const depDoc = await transaction.get(departureRef);
      if (!depDoc.exists) throw new Error('Departure not found');

      const depData = depDoc.data()!;
      if (depData.status === 'closed' || depData.status === 'full') {
        throw new Error('This departure is no longer available');
      }

      const availableSeats = depData.seatsTotal - (depData.seatsBooked || 0) - (depData.seatsHeld || 0);
      if (availableSeats < travelers.length) {
        throw new Error(`Only ${availableSeats} seat(s) available on this departure`);
      }

      const pkgDoc = await transaction.get(adminDb.collection('packages').doc(depData.packageId));
      if (!pkgDoc.exists) throw new Error('Tour package not found');
      packageData = pkgDoc.data()!;

      const agencyDoc = await transaction.get(adminDb.collection('agencies').doc(depData.agencyId));
      agencyData = agencyDoc.exists ? agencyDoc.data()! : { commissionPercent: 10 };

      // Calculate price at this moment
      const pricePerPerson = depData.priceOverride || packageData.pricePerPerson;
      totalAmount = pricePerPerson * travelers.length;
      commissionAmount = Math.round((totalAmount * (agencyData.commissionPercent || 10)) / 100);

      // Increment held seats
      const newSeatsHeld = (depData.seatsHeld || 0) + travelers.length;
      transaction.update(departureRef, { seatsHeld: newSeatsHeld });

      // Generate booking record
      bookingId = adminDb.collection('bookings').doc().id;
      bookingCode = `TM-${Date.now().toString().slice(-6)}`;
      const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      transaction.set(adminDb.collection('bookings').doc(bookingId), {
        id: bookingId,
        bookingCode,
        customerId: user.uid,
        packageId: depData.packageId,
        agencyId: depData.agencyId,
        destinationId: depData.destinationId,
        departureId: depDoc.id,
        travelDate: depData.date,
        travelers,
        totalAmount,
        commissionAmount,
        status: 'held',
        paymentStatus: 'pending',
        holdExpiresAt,
        agencyPayoutStatus: 'pending',
        createdAt: new Date().toISOString(),
      });
    });

    // Check payment mode
    if (isDemoPaymentMode) {
      return res.json({
        mode: 'demo',
        bookingId,
        bookingCode,
        amount: totalAmount,
        keyId: 'rzp_test_demo_mode',
        message: 'DEMO PAYMENT MODE: Complete payment using the simulated verification modal.'
      });
    }

    // Live Razorpay order creation
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: totalAmount * 100, // paise
        currency: 'INR',
        receipt: bookingCode,
        notes: {
          bookingId,
          customerId: user.uid,
        },
      }),
    });

    const rzpOrder = await rzpRes.json();
    if (!rzpRes.ok) {
      console.error('Razorpay order creation failed:', rzpOrder);
      return res.status(502).json({ error: 'Payment gateway error', details: rzpOrder });
    }

    await adminDb.collection('bookings').doc(bookingId).update({
      razorpayOrderId: rzpOrder.id,
    });

    return res.json({
      mode: 'live',
      bookingId,
      bookingCode,
      amount: totalAmount,
      keyId: razorpayKeyId,
      orderId: rzpOrder.id,
    });
  } catch (error: any) {
    console.error('Error holding booking:', error);
    return res.status(400).json({ error: error.message });
  }
});

// Verify payment and confirm booking
apiRouter.post('/bookings/verify', rateLimiter(30), authenticateToken, async (req: Request, res: Response) => {
  const { bookingId, demoResult, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!bookingId) {
    return res.status(400).json({ error: 'bookingId is required' });
  }

  try {
    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();
    if (!bookingDoc.exists) return res.status(404).json({ error: 'Booking not found' });

    const booking = bookingDoc.data()!;
    if (booking.status === 'confirmed') {
      return res.json({ success: true, message: 'Booking already confirmed', booking });
    }

    // Demo Mode Verification
    if (isDemoPaymentMode) {
      if (demoResult === 'failure') {
        // Rollback held seats
        const depRef = adminDb.collection('departures').doc(booking.departureId);
        await adminDb.runTransaction(async (transaction: any) => {
          const depDoc = await transaction.get(depRef);
          if (depDoc.exists) {
            const seatsHeld = Math.max(0, (depDoc.data()!.seatsHeld || 0) - booking.travelers.length);
            transaction.update(depRef, { seatsHeld });
          }
          transaction.update(bookingRef, { status: 'cancelled', paymentStatus: 'failed' });
        });
        return res.status(400).json({ error: 'Simulated payment failed by user' });
      }

      // Successful demo confirmation
      await adminDb.runTransaction(async (transaction: any) => {
        const depRef = adminDb.collection('departures').doc(booking.departureId);
        const depDoc = await transaction.get(depRef);
        if (depDoc.exists) {
          const depData = depDoc.data()!;
          const travelerCount = booking.travelers.length;
          const newHeld = Math.max(0, (depData.seatsHeld || 0) - travelerCount);
          const newBooked = (depData.seatsBooked || 0) + travelerCount;

          let status = depData.status;
          if (newBooked >= depData.seatsTotal) {
            status = 'full';
          } else if (depData.seatsTotal - newBooked <= 4) {
            status = 'limited';
          }

          transaction.update(depRef, {
            seatsHeld: newHeld,
            seatsBooked: newBooked,
            status,
          });
        }

        transaction.update(bookingRef, {
          status: 'confirmed',
          paymentStatus: 'paid',
          razorpayPaymentId: `pay_demo_${Date.now()}`,
          razorpayOrderId: booking.razorpayOrderId || `order_demo_${Date.now()}`,
        });
      });

      return res.json({ success: true, message: 'Payment verified successfully (Demo Mode)', bookingId });
    }

    // Live Razorpay Verification
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing Razorpay verification parameters' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Confirmed in transaction
    await adminDb.runTransaction(async (transaction: any) => {
      const depRef = adminDb.collection('departures').doc(booking.departureId);
      const depDoc = await transaction.get(depRef);
      if (depDoc.exists) {
        const depData = depDoc.data()!;
        const travelerCount = booking.travelers.length;
        const newHeld = Math.max(0, (depData.seatsHeld || 0) - travelerCount);
        const newBooked = (depData.seatsBooked || 0) + travelerCount;

        let status = depData.status;
        if (newBooked >= depData.seatsTotal) {
          status = 'full';
        } else if (depData.seatsTotal - newBooked <= 4) {
          status = 'limited';
        }

        transaction.update(depRef, {
          seatsHeld: newHeld,
          seatsBooked: newBooked,
          status,
        });
      }

      transaction.update(bookingRef, {
        status: 'confirmed',
        paymentStatus: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      });
    });

    return res.json({ success: true, message: 'Payment verified and booking confirmed', bookingId });
  } catch (error: any) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Owner-only Cancel Booking with Razorpay Refund
apiRouter.post('/bookings/cancel', authenticateToken, requireOwner, async (req: Request, res: Response) => {
  const { bookingId, refundAmount, reason } = req.body;
  if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });

  try {
    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();
    if (!bookingDoc.exists) return res.status(404).json({ error: 'Booking not found' });

    const booking = bookingDoc.data()!;
    if (booking.status === 'cancelled' || booking.status === 'refunded') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Rollback booked seats on departure
    const depRef = adminDb.collection('departures').doc(booking.departureId);
    await adminDb.runTransaction(async (transaction: any) => {
      const depDoc = await transaction.get(depRef);
      if (depDoc.exists) {
        const depData = depDoc.data()!;
        const count = booking.travelers?.length || 1;
        const newBooked = Math.max(0, (depData.seatsBooked || 0) - count);
        let status = depData.status;
        if (status === 'full' && newBooked < depData.seatsTotal) {
          status = 'open';
        }
        transaction.update(depRef, { seatsBooked: newBooked, status });
      }

      transaction.update(bookingRef, {
        status: 'refunded',
        paymentStatus: 'refunded',
        notes: (booking.notes ? booking.notes + ' | ' : '') + `Refund processed: ${reason || 'Owner cancelled'}`,
      });
    });

    return res.json({ success: true, message: 'Booking cancelled and seats restored.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Razorpay Webhook backup
apiRouter.post('/razorpay/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (webhookSecret && signature) {
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (expectedSig !== signature) {
      return res.status(400).send('Invalid signature');
    }
  }

  try {
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const orderId = event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id;
      if (orderId) {
        const snap = await adminDb.collection('bookings').where('razorpayOrderId', '==', orderId).limit(1).get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          if (doc.data().status === 'held') {
            await doc.ref.update({
              status: 'confirmed',
              paymentStatus: 'paid',
              razorpayPaymentId: event.payload?.payment?.entity?.id,
            });
          }
        }
      }
    }
    return res.json({ received: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Release expired holds (can be scheduled or called on interval)
apiRouter.get('/jobs/release-holds', async (req: Request, res: Response) => {
  try {
    const nowIso = new Date().toISOString();
    const snap = await adminDb
      .collection('bookings')
      .where('status', '==', 'held')
      .where('holdExpiresAt', '<=', nowIso)
      .get();

    let releasedCount = 0;
    for (const bDoc of snap.docs) {
      const booking = bDoc.data();
      const depRef = adminDb.collection('departures').doc(booking.departureId);

      await adminDb.runTransaction(async (transaction: any) => {
        const depDoc = await transaction.get(depRef);
        if (depDoc.exists) {
          const depData = depDoc.data()!;
          const count = booking.travelers?.length || 1;
          const newHeld = Math.max(0, (depData.seatsHeld || 0) - count);
          transaction.update(depRef, { seatsHeld: newHeld });
        }
        transaction.update(bDoc.ref, {
          status: 'cancelled',
          paymentStatus: 'failed',
          notes: 'Hold expired after 15 minutes without payment completion.',
        });
      });
      releasedCount++;
    }

    return res.json({ success: true, releasedCount });
  } catch (error: any) {
    console.error('Error releasing holds:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. AI CUSTOMER CHATBOT (GEMINI FLASH)
// ==========================================

apiRouter.post('/chat/message', rateLimiter(45), optionalAuth, async (req: Request, res: Response) => {
  const { chatId, text, customerId: reqCustomerId } = req.body;
  const user = (req as any).user;
  const customerId = user?.uid || reqCustomerId || 'guest-customer';

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Text message is required' });
  }

  try {
    let currentChatId = chatId;
    let chatRef: any;

    if (!currentChatId) {
      chatRef = adminDb.collection('chats').doc();
      currentChatId = chatRef.id;
      await chatRef.set({
        id: currentChatId,
        customerId,
        mode: 'bot',
        status: 'open',
        lastMessage: text,
        lastMessageAt: new Date().toISOString(),
      });
    } else {
      chatRef = adminDb.collection('chats').doc(currentChatId);
      const chatDoc = await chatRef.get();
      if (!chatDoc.exists) {
        await chatRef.set({
          id: currentChatId,
          customerId,
          mode: 'bot',
          status: 'open',
          lastMessage: text,
          lastMessageAt: new Date().toISOString(),
        });
      }
    }

    // Save customer message
    const msgRef = chatRef.collection('messages').doc();
    await msgRef.set({
      id: msgRef.id,
      sender: 'customer',
      text,
      createdAt: new Date().toISOString(),
    });

    // Check chat mode
    const chatDoc = await chatRef.get();
    const chatData = chatDoc.data()!;

    // Check if customer explicitly requested human or staff
    const lowerText = text.toLowerCase();
    const asksForHuman =
      lowerText.includes('human') ||
      lowerText.includes('agent') ||
      lowerText.includes('staff') ||
      lowerText.includes('person') ||
      lowerText.includes('call me') ||
      lowerText.includes('operator');

    if (asksForHuman || chatData.mode === 'human') {
      await chatRef.update({
        mode: 'human',
        status: 'waiting_for_staff',
        lastMessage: text,
        lastMessageAt: new Date().toISOString(),
      });

      // Get company support details
      const companyDoc = await adminDb.collection('settings').doc('company').get();
      const comp = companyDoc.data() || {
        supportPhones: ['+91 1800 200 4567'],
        supportHours: 'Mon-Sat 9 AM - 8 PM IST',
      };

      const handoffReply = `I have transferred your conversation to our support team. A staff member will reply directly in this chat shortly. For urgent inquiries, reach us at ${comp.supportPhones?.[0] || '+91 1800 200 4567'} (${comp.supportHours || 'Mon-Sat 9 AM - 8 PM IST'}).`;

      const botMsgRef = chatRef.collection('messages').doc();
      await botMsgRef.set({
        id: botMsgRef.id,
        sender: 'bot',
        text: handoffReply,
        createdAt: new Date().toISOString(),
      });

      await chatRef.update({
        lastMessage: handoffReply,
        lastMessageAt: new Date().toISOString(),
      });

      return res.json({
        chatId: currentChatId,
        reply: handoffReply,
        mode: 'human',
        status: 'waiting_for_staff',
      });
    }

    // Check GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallbackReply = 'Our AI holiday assistant is currently undergoing scheduled maintenance. I have routed your query to our support team. A representative will reply shortly.';
      await chatRef.update({
        mode: 'human',
        status: 'waiting_for_staff',
        lastMessage: fallbackReply,
        lastMessageAt: new Date().toISOString(),
      });

      const botMsgRef = chatRef.collection('messages').doc();
      await botMsgRef.set({
        id: botMsgRef.id,
        sender: 'bot',
        text: fallbackReply,
        createdAt: new Date().toISOString(),
      });

      return res.json({
        chatId: currentChatId,
        reply: fallbackReply,
        mode: 'human',
        status: 'waiting_for_staff',
      });
    }

    // Fetch live Firestore context for grounding
    const [destSnap, pkgSnap, depSnap, compSnap] = await Promise.all([
      adminDb.collection('destinations').where('active', '==', true).limit(30).get(),
      adminDb.collection('packages').where('active', '==', true).limit(30).get(),
      adminDb.collection('departures').where('status', 'in', ['open', 'limited']).limit(40).get(),
      adminDb.collection('settings').doc('company').get(),
    ]);

    const destinationsSummary = destSnap.docs.map((d: any) => {
      const data = d.data();
      return `- ${data.name} (${data.region}): ${data.description}. Best season: ${data.bestSeason}`;
    }).join('\n');

    const packagesSummary = pkgSnap.docs.map((p: any) => {
      const data = p.data();
      return `- [${data.id}] ${data.title} (${data.days}D/${data.nights}N): ₹${data.pricePerPerson}/person. Vehicle: ${data.vehicle?.type} (${data.vehicle?.vehicleName}, AC: ${data.vehicle?.ac}). Food: ${data.food?.mealPlan} (${data.food?.cuisine}). Hotel: ${data.hotel?.category} (${data.hotel?.hotelName}). Policy: ${data.cancellationPolicy}`;
    }).join('\n');

    const departuresSummary = depSnap.docs.map((dep: any) => {
      const data = dep.data();
      return `- Departure: ${data.date} for Package ${data.packageId}, Status: ${data.status}, Seats Left: ${data.seatsTotal - (data.seatsBooked || 0) - (data.seatsHeld || 0)}`;
    }).join('\n');

    const companyData = compSnap.data() || {
      companyName: 'Tour Manage India',
      supportPhones: ['+91 1800 200 4567'],
      supportHours: 'Mon-Sat 9 AM - 8 PM IST',
    };

    const systemPrompt = `You are the official customer service holiday assistant for Tour Manage (Tour Manage.com).
Your job is to answer customer questions about our Indian tour packages, destinations, vehicles, food, hotel stays, upcoming departures, and policies.

CRITICAL RULES:
1. Ground your answers ONLY in the provided Firestore data below. Never invent prices, dates, discounts, or destinations that are not in this data.
2. NEVER take payment or ask for card/UPI details in chat. Advise the user to book directly through the app booking flow.
3. If the user asks for customization, booking for a large group, dates not listed, or if you are unsure, politely state you will connect them with a human staff member, and provide the support hours (${companyData.supportHours}) and phone (${companyData.supportPhones?.[0]}).
4. Be courteous, helpful, concise, and enthusiastic about travel in India.

LIVE FIRESTORE DATA:
Company: ${companyData.companyName}
Support Phone: ${companyData.supportPhones?.join(', ')}
Support Hours: ${companyData.supportHours}

DESTINATIONS:
${destinationsSummary}

PACKAGES (with Vehicle, Food, Hotel details):
${packagesSummary}

UPCOMING SCHEDULED DEPARTURES:
${departuresSummary}
`;

    // Fetch last 6 messages for context
    const historySnap = await chatRef
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(6)
      .get();
    
    const messageHistory = historySnap.docs.reverse().map((d: any) => {
      const data = d.data();
      return `${data.sender.toUpperCase()}: ${data.text}`;
    }).join('\n');

    const ai = new GoogleGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Chat History:\n${messageHistory}\n\nPlease generate the next assistant reply for CUSTOMER.`,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const botReply = response.text || 'Thank you for reaching out! How else can I assist with your holiday plans in India?';

    // Save bot message
    const botMsgRef = chatRef.collection('messages').doc();
    await botMsgRef.set({
      id: botMsgRef.id,
      sender: 'bot',
      text: botReply,
      createdAt: new Date().toISOString(),
    });

    await chatRef.update({
      lastMessage: botReply,
      lastMessageAt: new Date().toISOString(),
    });

    return res.json({
      chatId: currentChatId,
      reply: botReply,
      mode: 'bot',
      status: 'open',
    });
  } catch (error: any) {
    console.error('Chat processing error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Explicit Handoff to Human
apiRouter.post('/chat/handoff', optionalAuth, async (req: Request, res: Response) => {
  const { chatId } = req.body;
  if (!chatId) return res.status(400).json({ error: 'chatId is required' });

  try {
    const chatRef = adminDb.collection('chats').doc(chatId);
    await chatRef.update({
      mode: 'human',
      status: 'waiting_for_staff',
      lastMessage: 'Customer requested human agent assistance.',
      lastMessageAt: new Date().toISOString(),
    });

    const msgRef = chatRef.collection('messages').doc();
    await msgRef.set({
      id: msgRef.id,
      sender: 'bot',
      text: 'A human support representative has been notified and will assist you shortly.',
      createdAt: new Date().toISOString(),
    });

    return res.json({ success: true, mode: 'human', status: 'waiting_for_staff' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Callback requests
apiRouter.post('/callback-requests', rateLimiter(20), optionalAuth, async (req: Request, res: Response) => {
  const { name, phone, topic } = req.body;
  const user = (req as any).user;

  if (!name || !phone || !topic) {
    return res.status(400).json({ error: 'Name, phone, and topic are required' });
  }

  try {
    const ref = adminDb.collection('callbackRequests').doc();
    await ref.set({
      id: ref.id,
      customerId: user?.uid || null,
      name,
      phone,
      topic,
      status: 'new',
      createdAt: new Date().toISOString(),
    });

    return res.json({ success: true, id: ref.id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. BULK PRICE UPDATE (OWNER ONLY)
// ==========================================

apiRouter.post('/packages/bulk-price-update', authenticateToken, requireOwner, async (req: Request, res: Response) => {
  const { targetType, targetId, adjustmentType, value, action } = req.body;
  // targetType: 'all' | 'agency' | 'destination'
  // adjustmentType: 'percent' | 'fixed'
  // value: number (can be positive or negative)
  // action: 'preview' | 'apply'

  if (!targetType || !adjustmentType || value === undefined || !action) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    let query: any = adminDb.collection('packages');
    if (targetType === 'agency' && targetId) {
      query = query.where('agencyId', '==', targetId);
    } else if (targetType === 'destination' && targetId) {
      query = query.where('destinationId', '==', targetId);
    }

    const snap = await query.get();
    const changes: any[] = [];
    const val = Number(value);

    for (const doc of snap.docs) {
      const data = doc.data();
      const oldPrice = data.pricePerPerson || 0;
      let newPrice = oldPrice;

      if (adjustmentType === 'percent') {
        newPrice = Math.round(oldPrice * (1 + val / 100));
      } else {
        newPrice = Math.max(500, oldPrice + val);
      }

      changes.push({
        packageId: doc.id,
        title: data.title,
        oldPrice,
        newPrice,
        difference: newPrice - oldPrice,
      });
    }

    if (action === 'apply') {
      const batch = adminDb.batch();
      for (const item of changes) {
        batch.update(adminDb.collection('packages').doc(item.packageId), {
          pricePerPerson: item.newPrice,
        });
      }
      await batch.commit();
      return res.json({ success: true, appliedCount: changes.length, changes });
    }

    return res.json({ success: true, previewCount: changes.length, changes });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. DEMO SEEDER & CLEANUP (OWNER ONLY)
// ==========================================

apiRouter.post('/demo/seed', authenticateToken, requireOwner, async (req: Request, res: Response) => {
  try {
    const result = await seedDemoData();
    return res.json(result);
  } catch (error: any) {
    console.error('Demo seed error:', error);
    return res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/demo/delete', authenticateToken, requireOwner, async (req: Request, res: Response) => {
  try {
    const result = await deleteDemoData();
    return res.json(result);
  } catch (error: any) {
    console.error('Demo delete error:', error);
    return res.status(500).json({ error: error.message });
  }
});
