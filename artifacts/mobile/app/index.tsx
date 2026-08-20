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

const VIASETU_URL = "https://www.viasetu.com";
const PRIMARY = "#1A56DB";
const ONESIGNAL_APP_ID = "7e452beb-1be1-4bf5-8c02-89eaa326c072";

// Pins the page to a fixed scale so the app never behaves like a zoomable web
// page. Applied both before and after content load: the pre-load pass covers
// early paint, but a viewport meta tag in the page's own HTML is parsed after
// that and would otherwise win, so the post-load pass re-asserts it.
// touch-action backs this up on WebKit, which ignores user-scalable=no in some
// versions but still honours the CSS.
const ZOOM_LOCK_JS = `
(function(){
  var content = 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover';
  var meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    meta.setAttribute('content', content);
  } else if (document.head) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }

  if (document.head && !document.getElementById('rn-zoom-lock')) {
    var style = document.createElement('style');
    style.id = 'rn-zoom-lock';
    style.textContent = 'html{touch-action:pan-x pan-y;-webkit-text-size-adjust:100%;}';
    document.head.appendChild(style);
  }
})();
`;

const INJECTED_JS = `
(function(){
  // Bridge: website can call window.ReactNativeWebView.postMessage(JSON.stringify({type, data}))
  // The app listens via onMessage handler
  window.addEventListener('message', function(e) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(typeof e.data === 'string' ? e.data : JSON.stringify(e.data));
    }
  });

  // Block WebKit's native pinch-to-zoom gesture (Android zoom is disabled via
  // the setBuiltInZoomControls WebView prop instead, since gesture events
  // below are iOS/WebKit-only).
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('gesturechange', function (e) { e.preventDefault(); });
})();
`;

// Exposes the native safe-area insets to the page as CSS custom properties so
// the website's own stylesheet can keep fixed/floating elements (e.g. the
// chat widget) clear of the iOS home indicator / Android gesture-nav area —
// mirrors env(safe-area-inset-*) for the WebView runtimes that don't compute
// it themselves (Android WebView does not derive nav-bar height from env()).
const safeAreaInjectedJS = (top: number, bottom: number) => `
(function(){
  var root = document.documentElement;
  root.style.setProperty('--rn-safe-area-top', '${top}px');
  root.style.setProperty('--rn-safe-area-bottom', '${bottom}px');
})();
true;
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
  const [errorType, setErrorType] = useState<"none" | "no-internet" | "server-down">("none");

  // ── Permissions + push notifications (OneSignal) ────────────────────────
  useEffect(() => {
    checkNetwork();
    requestPermissions();
    setupOneSignal();
  }, []);

  // Re-sync safe-area insets into the page whenever they change (e.g. rotation)
  // so a fixed chat widget positioned via the injected CSS vars stays correct.
  useEffect(() => {
    webViewRef.current?.injectJavaScript(safeAreaInjectedJS(insets.top, insets.bottom));
  }, [insets.top, insets.bottom]);

  // Check network on app launch — show offline screen immediately if no connection
  const checkNetwork = async () => {
    try {
      const response = await fetch(VIASETU_URL, { method: "HEAD", cache: "no-cache" });
      if (!response.ok) {
        setErrorType("server-down");
      }
    } catch {
      setErrorType("no-internet");
    }
  };

  const requestPermissions = async () => {
    try { await Location.requestForegroundPermissionsAsync(); } catch {}
    // Camera/photo access for WebView file-upload inputs is granted by the OS
    // at the point of use (native file chooser / system photo picker), so no
    // upfront priming or app-held media library permission is needed here.
  };

  const setupOneSignal = () => {
    if (!OneSignal) return; // Skip if running in Expo Go

    OneSignal.initialize(ONESIGNAL_APP_ID);
    OneSignal.Notifications.requestPermission(true);

    // When a user taps a notification — deep link into the WebView
    OneSignal.Notifications.addEventListener("click", (event: NotificationClickEvent) => {
      const url = event.result?.url;
      if (url && webViewRef.current) {
        webViewRef.current.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`);
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
          `window.dispatchEvent(new CustomEvent('pushToken', { detail: ${JSON.stringify(subscriptionId)} })); true;`
        );
      }
    };

    OneSignal.User.pushSubscription.addEventListener("change", (subscription) => {
      onSubscriptionId(subscription.current.id);
    });
    OneSignal.User.pushSubscription.getIdAsync().then(onSubscriptionId);
  };

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
    webViewRef.current?.reload();
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    setErrorType("none");
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setErrorType("no-internet");
  }, []);

  const handleHttpError = useCallback(
    ({ nativeEvent }: { nativeEvent: { statusCode: number } }) => {
      if (nativeEvent.statusCode >= 500) {
        setIsLoading(false);
        setErrorType("server-down");
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
    // Regular web navigation (viasetu.com, payment gateway checkout pages,
    // bank OTP/3-D Secure pages, etc.) all stay inside the WebView so the
    // payment flow can complete and redirect back to us. Only hand off
    // schemes that a WebView can never render itself.
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return true;
    }
    if (url.startsWith("about:") || url.startsWith("data:") || url.startsWith("blob:")) {
      return true;
    }
    if (
      url.startsWith("tel:") ||
      url.startsWith("mailto:") ||
      url.startsWith("whatsapp:") ||
      url.startsWith("upi:") ||
      url.startsWith("intent:")
    ) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    // Anything else with a custom scheme is most likely a UPI app deep link
    // (phonepe://, tez://, paytmmp://, credpay:// ...) triggered by the
    // payment gateway — hand it to the OS so the relevant app can open.
    Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  const handleOpenWindow = useCallback(
    ({ nativeEvent }: { nativeEvent: { targetUrl: string } }) => {
      // Some payment gateways open their checkout/OTP step via window.open()
      // instead of a normal navigation. WKWebView drops these silently
      // without an explicit handler, so route it back into the same WebView.
      if (nativeEvent?.targetUrl) {
        webViewRef.current?.injectJavaScript(
          `window.location.href = ${JSON.stringify(nativeEvent.targetUrl)}; true;`
        );
      }
    },
    []
  );

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
      <View style={[styles.offlineContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Top brand */}
        <View style={styles.offlineBrand}>
          <Text style={styles.offlineBrandText}>ViaSetu</Text>
        </View>

        {/* Illustration */}
        <View style={styles.offlineIllustrationWrap}>
          <Image
            source={require("../assets/images/no-internet.png")}
            style={styles.offlineIllustration}
            contentFit="contain"
          />
        </View>

        {/* Message card */}
        <View style={styles.offlineCard}>
          <Text style={styles.offlineCardTitle}>You're Offline</Text>
          <Text style={styles.offlineCardSubtitle}>
            Check your connection and{"\n"}we'll get you back online.
          </Text>
        </View>

        {/* Retry button */}
        <TouchableOpacity
          style={styles.offlineRetryBtn}
          onPress={handleRefresh}
          activeOpacity={0.8}
        >
          <Text style={styles.offlineRetryText}>Try Again</Text>
        </TouchableOpacity>

        {/* Bottom note */}
        <Text style={styles.offlineFooter}>
          Some features may be limited while offline.{"\n"}Connect to the internet to enjoy the{"\n"}full <Text style={styles.offlineFooterBrand}>ViaSetu</Text> experience.
        </Text>
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
        javaScriptCanOpenWindowsAutomatically={true}
        onOpenWindow={handleOpenWindow}
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        allowsBackForwardNavigationGestures={Platform.OS === "ios"}
        injectedJavaScriptBeforeContentLoaded={
          ZOOM_LOCK_JS + safeAreaInjectedJS(insets.top, insets.bottom)
        }
        injectedJavaScript={
          ZOOM_LOCK_JS + INJECTED_JS + safeAreaInjectedJS(insets.top, insets.bottom)
        }
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
        renderToHardwareTextureAndroid={true}
      />

      {/* Small activity indicator while the page loads */}
      {isLoading && (
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
  // ── Server-down screen (kept as is) ──
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
  // ── Offline screen (matching design) ──
  offlineContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  offlineBrand: {
    alignItems: "center",
    paddingTop: 24,
  },
  offlineBrandText: {
    fontSize: 22,
    fontWeight: "700",
    color: PRIMARY,
    fontFamily: "Inter_700Bold",
  },
  offlineIllustrationWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxHeight: "45%",
  },
  offlineIllustration: {
    width: "85%",
    height: "100%",
    maxWidth: 320,
    maxHeight: 280,
  },
  offlineCard: {
    backgroundColor: "#f0f9f6",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0f2ed",
    marginBottom: 20,
  },
  offlineCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0a0a0a",
    marginBottom: 8,
    fontFamily: "Inter_700Bold",
  },
  offlineCardSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  offlineRetryBtn: {
    backgroundColor: "#2ABFAD",
    paddingVertical: 16,
    paddingHorizontal: 56,
    borderRadius: 28,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#2ABFAD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  offlineRetryText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  offlineFooter: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  offlineFooterBrand: {
    color: "#2ABFAD",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  // ── Mini loader ──
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
