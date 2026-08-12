import * as Sentry from "@sentry/react-native";
import { SENTRY_DSN } from "./config";

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.log("[ViaSetu] Sentry not configured - crash reporting disabled");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    sampleRate: 1.0,
    release: "1.0.0",
    environment: process.env.NODE_ENV || "production",
    attachStacktrace: true,
  });

  console.log("[ViaSetu] Sentry initialized");
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureException(error);
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = "info") => {
  Sentry.captureMessage(message, level);
};

export const setUser = (userId: string, email?: string, name?: string) => {
  Sentry.setUser({
    id: userId,
    email,
    username: name,
  });
};

export const clearUser = () => {
  Sentry.setUser(null);
};
