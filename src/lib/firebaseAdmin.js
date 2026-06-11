import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getPrivateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  if (!raw) return null;
  return raw.replace(/\\n/g, "\n");
}

export function isFirebaseAdminConfigured() {
  return !!(
    process.env.FIREBASE_PROJECT_ID?.trim() &&
    process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
    getPrivateKey()
  );
}

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin not configured: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getFirebaseAdminAuth() {
  getAdminApp();
  return getAuth();
}

/** Verify Firebase ID token from client after phone OTP success. */
export async function verifyFirebaseIdToken(idToken) {
  if (!idToken) {
    throw new Error("Firebase ID token required");
  }
  const auth = getFirebaseAdminAuth();
  return auth.verifyIdToken(idToken, true);
}

/** Extract 10-digit Indian mobile from Firebase claims. */
export function phoneFromFirebaseClaims(decoded) {
  const raw = decoded?.phone_number || decoded?.firebase?.identities?.phone?.[0] || "";
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.startsWith("91") && digits.length === 12) return digits.slice(2);
  if (digits.length >= 10) return digits.slice(-10);
  throw new Error("Verified phone number not found in Firebase token");
}
