import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
// OneSignal requires native modules — gracefully handle when running in Expo Go
let OneSignal: typeof import("react-native-onesignal").OneSignal | null = null;
type NotificationClickEvent = import("react-native-onesignal").NotificationClickEvent;
try {
  OneSignal = require("react-native-onesignal").OneSignal;
} catch {
  console.warn("[ViaSetu] OneSignal not available (Expo Go does not support native modules)");
}
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { SplashLoader } from "@/components/SplashLoader";

const VIASETU_URL = "https://www.viasetu.com";
const PRIMARY = "#1A56DB";
const ONESIGNAL_APP_ID = "7e452beb-1be1-4bf5-8c02-89eaa326c072";
const SPLASH_TIMEOUT_MS = 15000;

const INJECTED_JS = `
(function(){
  // Bridge: website can call window.ReactNativeWebView.postMessage(JSON.stringify({type, data}))
  // The app listens via onMessage handler
  window.addEventListener('message', function(e) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(typeof e.data === 'string' ? e.data : JSON.stringify(e.data));
    }
  });
})();
`;

// ─── Web fallback ────────────────────────────────────────────────────────────
// react-native-webview has no web implementation; use a plain iframe in the
// Expo web preview so the splash screen does not stay frozen forever.
function WebFallback() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* @ts-ignore – iframe is web-only */}
      <iframe
        src={VIASETU_URL}
        title="ViaSetu"
        allow="geolocation; camera; microphone"
        style={{
          flex: 1,
          border: "none",
          width: "100%",
          height: "100%",
          display: "flex",
        }}
      />
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function WebViewScreen() {
  if (Platform.OS === "web") return <WebFallback />;

  return <NativeWebView />;
}

function NativeWebView() {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const backPressRef = useRef(0);

  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [errorType, setErrorType] = useState<"none" | "no-internet" | "server-down">("none");

  // ── Permissions + push notifications (OneSignal) ────────────────────────
  useEffect(() => {
    requestPermissions();
    setupOneSignal();
  }, []);

  const requestPermissions = async () => {
    try { await Location.requestForegroundPermissionsAsync(); } catch {}
    try { await ImagePicker.requestCameraPermissionsAsync(); } catch {}
    try { await ImagePicker.requestMediaLibraryPermissionsAsync(); } catch {}
  };

  const setupOneSignal = () => {
    if (!OneSignal) return; // Skip if running in Expo Go

    OneSignal.initialize(ONESIGNAL_APP_ID);
    OneSignal.Notifications.requestPermission(true);

    // When a user taps a notification — deep link into the WebView
    OneSignal.Notifications.addEventListener("click", (event: NotificationClickEvent) => {
      const url = event.result?.url;
      if (url && webViewRef.current) {
        webViewRef.current.injectJavaScript(`window.location.href = '${url}';`);
      }
    });

    const isRegistered = (subscriptionId: string | null | undefined) =>
      !!subscriptionId && !subscriptionId.startsWith("local-");

    const onSubscriptionId = (subscriptionId: string | null | undefined) => {
      if (!isRegistered(subscriptionId)) return;
      console.log("[ViaSetu] OneSignal subscription id:", subscriptionId);

      // Inject the subscription id into the WebView so the website can use it
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `window.dispatchEvent(new CustomEvent('pushToken', { detail: '${subscriptionId}' }));`
        );
      }
    };

    OneSignal.User.pushSubscription.addEventListener("change", (subscription) => {
      onSubscriptionId(subscription.current.id);
    });
    OneSignal.User.pushSubscription.getIdAsync().then(onSubscriptionId);
  };

  // ── Safety timeout: clear splash if WebView stalls ──────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, SPLASH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  // ── Android hardware back button ─────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (canGoBack) {
          webViewRef.current?.goBack();
          return true;
        }
        if (backPressRef.current === 0) {
          backPressRef.current = 1;
          ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
          setTimeout(() => { backPressRef.current = 0; }, 2000);
          return true;
        }
        return false;
      }
    );
    return () => subscription.remove();
  }, [canGoBack]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setErrorType("none");
    setIsInitialLoad(false);
    webViewRef.current?.reload();
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    setErrorType("none");
    setIsInitialLoad(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setErrorType("no-internet");
    setIsInitialLoad(false);
  }, []);

  const handleHttpError = useCallback(
    ({ nativeEvent }: { nativeEvent: { statusCode: number } }) => {
      if (nativeEvent.statusCode >= 500) {
        setIsLoading(false);
        setErrorType("server-down");
        setIsInitialLoad(false);
      }
    },
    []
  );

  const handleNavigationChange = useCallback(
    (navState: { canGoBack: boolean }) => {
      setCanGoBack(navState.canGoBack);
    },
    []
  );

  const handleShouldStartLoad = useCallback((request: { url: string }) => {
    const { url } = request;
    if (url.startsWith("about:") || url.startsWith("data:") || url.startsWith("blob:")) {
      return true;
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        const hostname = new URL(url).hostname;
        if (hostname === "viasetu.com" || hostname.endsWith(".viasetu.com")) {
          return true;
        }
      } catch {}
    }
    if (
      url.startsWith("tel:") ||
      url.startsWith("mailto:") ||
      url.startsWith("whatsapp:")
    ) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  }, []);

  const handleFileDownload = useCallback(
    ({ nativeEvent }: { nativeEvent: { downloadUrl: string } }) => {
      if (nativeEvent?.downloadUrl) {
        Linking.openURL(nativeEvent.downloadUrl).catch(() => {});
      }
    },
    []
  );

  // ── No-internet screen ───────────────────────────────────────────────────
  if (errorType === "no-internet") {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.errorContent}>
          <Image
            source={require("../assets/images/no-internet.png")}
            style={styles.errorIllustration}
            contentFit="contain"
          />
          <Text style={styles.errorTitle}>No Internet Connection</Text>
          <Text style={styles.errorSubtitle}>
            Please check your Wi-Fi or mobile data and try again.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleRefresh}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Server-down screen ───────────────────────────────────────────────────
  if (errorType === "server-down") {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.errorContent}>
          <Image
            source={require("../assets/images/server-down.png")}
            style={styles.errorIllustration}
            contentFit="contain"
          />
          <Text style={styles.errorTitle}>We'll Be Right Back</Text>
          <Text style={styles.errorSubtitle}>
            ViaSetu is currently undergoing maintenance. Please check back in a few minutes.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleRefresh}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <WebView
        ref={webViewRef}
        source={{ uri: VIASETU_URL }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
        allowsInlineMediaPlayback={true}
        allowFileAccess={true}
        mixedContentMode="never"
        cacheEnabled={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        nestedScrollEnabled={true}
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures={Platform.OS === "ios"}
        injectedJavaScript={INJECTED_JS}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onNavigationStateChange={handleNavigationChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onHttpError={handleHttpError}
        onFileDownload={handleFileDownload}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log("[ViaSetu] Message from website:", data);
            if (data.type === "share" && data.data?.url) {
              // Could trigger native share sheet here
            }
          } catch {}
        }}
        userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        renderToHardwareTextureAndroid={true}
      />

      {/* Animated splash screen — fades out once WebView fires onLoadEnd */}
      <SplashLoader visible={isInitialLoad} />

      {/* Small activity indicator for subsequent page loads */}
      {isLoading && !isInitialLoad && (
        <View style={[styles.miniLoader, { pointerEvents: "none" }]}>
          <ActivityIndicator size="small" color={PRIMARY} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  webView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  errorContent: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorIllustration: {
    width: 260,
    height: 260,
    marginBottom: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0a0a0a",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
  errorSubtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
    fontFamily: "Inter_400Regular",
  },
  retryBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  miniLoader: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
});
