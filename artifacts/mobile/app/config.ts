/**
 * App Configuration
 * Environment variables should be set in .env file
 */

export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || "";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://api.viasetu.com";

export const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN || "viasetu.com";

export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "",
};

export const ONESIGNAL_APP_ID =
  process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || "";

// Validation
if (!SENTRY_DSN) {
  console.warn("[Config] SENTRY_DSN not configured");
}

if (!FIREBASE_CONFIG.apiKey) {
  console.warn("[Config] Firebase API key not configured");
}
