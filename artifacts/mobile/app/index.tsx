import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const VIASETU_URL = "https://www.viasetu.com";
const PRIMARY = "#1A56DB";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SPLASH_TIMEOUT_MS = 15000;

const INJECTED_JS = `(function(){true;})();`;

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
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Permissions + notification channel ──────────────────────────────────
  useEffect(() => {
    requestPermissions();
    setupNotificationChannel();
  }, []);

  const requestPermissions = async () => {
    try { await Location.requestForegroundPermissionsAsync(); } catch {}
    try { await ImagePicker.requestCameraPermissionsAsync(); } catch {}
    try { await ImagePicker.requestMediaLibraryPermissionsAsync(); } catch {}
    try { await Notifications.requestPermissionsAsync(); } catch {}
  };

  const setupNotificationChannel = async () => {
    if (Platform.OS !== "android") return;
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "ViaSetu Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: PRIMARY,
        sound: "default",
        showBadge: true,
      });
    } catch {}
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
    setIsRefreshing(true);
    setHasError(false);
    setIsInitialLoad(false);
    webViewRef.current?.reload();
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    setIsRefreshing(false);
    setHasError(false);
    setIsInitialLoad(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setIsRefreshing(false);
    setHasError(true);
    setIsInitialLoad(false);
  }, []);

  const handleNavigationChange = useCallback(
    (navState: { canGoBack: boolean }) => {
      setCanGoBack(navState.canGoBack);
    },
    []
  );

  const handleShouldStartLoad = useCallback((request: { url: string }) => {
    const { url } = request;
    if (
      url.startsWith("about:") ||
      url.startsWith("data:") ||
      url.startsWith("blob:") ||
      url.includes("viasetu.com")
    ) {
      return true;
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
  if (hasError) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.errorContent}>
          <Image
            source={require("../assets/images/splash-icon.png")}
            style={styles.errorLogo}
            contentFit="contain"
          />
          <Text style={styles.errorTitle}>No Internet Connection</Text>
          <Text style={styles.errorSubtitle}>
            Please check your network settings and try again.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleRefresh}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        overScrollMode="always"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[PRIMARY]}
            tintColor={PRIMARY}
            progressBackgroundColor="#ffffff"
          />
        }
      >
        <WebView
          ref={webViewRef}
          source={{ uri: VIASETU_URL }}
          style={{ height: SCREEN_HEIGHT - insets.top }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
          allowsInlineMediaPlayback={true}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="compatibility"
          cacheEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          nestedScrollEnabled={true}
          setSupportMultipleWindows={false}
          injectedJavaScript={INJECTED_JS}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onNavigationStateChange={handleNavigationChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onFileDownload={handleFileDownload}
          userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          renderToHardwareTextureAndroid={true}
        />
      </ScrollView>

      {/* Splash overlay – shown on first load, hidden once WebView fires onLoadEnd */}
      {isInitialLoad && (
        <View style={styles.splashOverlay}>
          <Image
            source={require("../assets/images/splash-icon.png")}
            style={styles.splashLogo}
            contentFit="contain"
          />
          <ActivityIndicator
            size="large"
            color={PRIMARY}
            style={styles.splashSpinner}
          />
          <Text style={styles.splashText}>Loading ViaSetu...</Text>
        </View>
      )}

      {/* Small activity indicator for subsequent page loads */}
      {isLoading && !isInitialLoad && !isRefreshing && (
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
  errorLogo: {
    width: 100,
    height: 100,
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
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  splashLogo: {
    width: 140,
    height: 140,
  },
  splashSpinner: {
    marginTop: 36,
  },
  splashText: {
    marginTop: 16,
    fontSize: 15,
    color: "#6b7280",
    fontFamily: "Inter_400Regular",
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
