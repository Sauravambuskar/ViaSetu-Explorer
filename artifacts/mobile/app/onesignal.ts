/**
 * OneSignal push notifications.
 *
 * Initialisation lives here (not in a screen) so it runs at app startup: a
 * notification tap that cold-launches the app fires its click event before any
 * screen has mounted, and a listener registered later would miss it entirely.
 * The URL is parked until the WebView is ready to receive it.
 */

// OneSignal requires native modules — gracefully handle when running in Expo Go
let OneSignal: typeof import("react-native-onesignal").OneSignal | null = null;
type NotificationClickEvent = import("react-native-onesignal").NotificationClickEvent;
try {
  OneSignal = require("react-native-onesignal").OneSignal;
} catch {
  console.warn("[ViaSetu] OneSignal not available (Expo Go does not support native modules)");
}

// Not read from config.ts on purpose: EXPO_PUBLIC_ONESIGNAL_APP_ID is not set in
// the EAS production environment, so config's value is an empty string there and
// initialize() would silently no-op in release builds.
const ONESIGNAL_APP_ID =
  process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || "7e452beb-1be1-4bf5-8c02-89eaa326c072";

type UrlHandler = (url: string) => void;
type SubscriptionIdHandler = (subscriptionId: string) => void;

let pendingUrl: string | null = null;
let urlHandler: UrlHandler | null = null;

const deliverUrl = (url: string) => {
  if (urlHandler) urlHandler(url);
  else pendingUrl = url; // cold start — hold it until a handler registers
};

/** Call once, as early in app startup as possible. */
export const initOneSignal = () => {
  if (!OneSignal) return;

  OneSignal.initialize(ONESIGNAL_APP_ID);

  OneSignal.Notifications.addEventListener("click", (event: NotificationClickEvent) => {
    const url = event.result?.url;
    if (url) deliverUrl(url);
  });
};

/**
 * Asks for the notification permission prompt.
 *
 * Kept separate from initOneSignal() so the caller can sequence it: iOS shows
 * one system alert at a time, and a permission request made while another
 * prompt is still on screen is dropped without ever being shown — leaving the
 * device unregistered for push.
 */
export const requestNotificationPermission = async () => {
  if (!OneSignal) return;
  try {
    await OneSignal.Notifications.requestPermission(true);
  } catch {}
};

/** Subscribe to notification-tap deep links. Returns an unsubscribe function. */
export const onNotificationUrl = (handler: UrlHandler) => {
  urlHandler = handler;

  if (pendingUrl) {
    const url = pendingUrl;
    pendingUrl = null;
    handler(url);
  }

  return () => {
    if (urlHandler === handler) urlHandler = null;
  };
};

/** Subscribe to the device's push subscription id once it registers. */
export const onPushSubscriptionId = (handler: SubscriptionIdHandler) => {
  if (!OneSignal) return () => {};

  // Ids prefixed with "local-" are placeholders OneSignal assigns before the
  // device has actually registered with APNs/FCM — not usable for targeting.
  const emit = (subscriptionId: string | null | undefined) => {
    if (!subscriptionId || subscriptionId.startsWith("local-")) return;
    handler(subscriptionId);
  };

  const subscription = OneSignal.User.pushSubscription;
  const listener = (event: { current: { id?: string | null } }) => emit(event.current.id);

  subscription.addEventListener("change", listener);
  subscription.getIdAsync().then(emit).catch(() => {});

  return () => {
    subscription.removeEventListener("change", listener);
  };
};
