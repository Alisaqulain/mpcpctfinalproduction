"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function isFirebaseClientConfigured() {
  const c = getFirebaseConfig();
  return !!(c.apiKey && c.authDomain && c.projectId && c.appId);
}

export function getFirebaseAuth() {
  const config = getFirebaseConfig();
  if (!config.apiKey || !config.projectId) {
    throw new Error("Firebase client is not configured");
  }
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  return getAuth(app);
}

export function toFirebaseE164(mobile10) {
  const d = String(mobile10 || "").replace(/\D/g, "").slice(-10);
  if (d.length !== 10) return "";
  return `+91${d}`;
}
