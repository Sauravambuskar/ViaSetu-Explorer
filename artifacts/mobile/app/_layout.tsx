import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initOneSignal } from "./onesignal";
import { initSentry } from "./sentry.config";

// Initialize Sentry for crash reporting
initSentry();

// Register push handling before any screen mounts, so a notification tap that
// cold-launches the app still reaches its deep-link handler.
initOneSignal();

SplashScreen.preventAutoHideAsync();

// Keep the splash up for a minimum beat so the brand mark is actually seen —
// fonts usually resolve in well under this, which would otherwise flash it away.
const SPLASH_MIN_DURATION_MS = 3000;
const appLaunchedAt = Date.now();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    const elapsed = Date.now() - appLaunchedAt;
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, Math.max(0, SPLASH_MIN_DURATION_MS - elapsed));

    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
