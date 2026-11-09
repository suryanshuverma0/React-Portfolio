import api from "./axios";

/* ========================================
   APP MODE (PWA) for the admin panel

   The admin installs to a phone, tablet or
   computer like an app (home-screen icon,
   full screen, push notifications) without
   an app store. The manifest is only linked
   on admin/sign-in pages, so portfolio
   visitors are never offered "install".
========================================= */

const APP_PATHS = ["/dashboard", "/login", "/link-device"];

const isAppPath = (pathname) => APP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

let installEvent = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

export const onInstallChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

export const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export const canPromptInstall = () => Boolean(installEvent);

export const promptInstall = async () => {
  if (!installEvent) return "unavailable";
  installEvent.prompt();
  const { outcome } = await installEvent.userChoice;
  installEvent = null;
  emit();
  return outcome;
};

const setHeadTag = (selector, create) => {
  if (document.head.querySelector(selector)) return;
  document.head.appendChild(create());
};

const meta = (name, content) => {
  const el = document.createElement("meta");
  el.name = name;
  el.content = content;
  el.dataset.app = "1";
  return el;
};

// Add / remove the manifest and iOS app tags for the current route.
export const syncAppShell = (pathname) => {
  if (typeof document === "undefined") return;

  if (!isAppPath(pathname)) {
    document.head.querySelectorAll("[data-app]").forEach((el) => el.remove());
    return;
  }

  setHeadTag('link[rel="manifest"]', () => {
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/app/manifest.webmanifest";
    link.dataset.app = "1";
    return link;
  });
  setHeadTag('meta[name="apple-mobile-web-app-capable"]', () => meta("apple-mobile-web-app-capable", "yes"));
  setHeadTag('meta[name="mobile-web-app-capable"]', () => meta("mobile-web-app-capable", "yes"));
  setHeadTag('meta[name="apple-mobile-web-app-status-bar-style"]', () => meta("apple-mobile-web-app-status-bar-style", "black-translucent"));
  setHeadTag('meta[name="apple-mobile-web-app-title"]', () => meta("apple-mobile-web-app-title", "SV Admin"));
  setHeadTag('link[rel="apple-touch-icon"][data-app]', () => {
    const link = document.createElement("link");
    link.rel = "apple-touch-icon";
    link.setAttribute("sizes", "180x180"); // iOS prefers the exact size over the site's photo icon
    link.href = "/app/apple-touch-icon.png";
    link.dataset.app = "1";
    return link;
  });

  registerServiceWorker();
};

let registration = null;

export const registerServiceWorker = async () => {
  if (registration || !("serviceWorker" in navigator) || !window.isSecureContext) return registration;
  try {
    registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    registration = null;
  }
  return registration;
};

export const initAppMode = () => {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // we show our own "Install app" button
    installEvent = event;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installEvent = null;
    emit();
  });
};

/* ---------- push notifications ---------- */

const urlBase64ToUint8Array = (base64) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export const pushSupport = () => {
  if (typeof window === "undefined") return { supported: false, reason: "server" };
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return {
      supported: false,
      reason: isIOS() && !isStandalone() ? "ios-install" : "unsupported",
    };
  }
  return { supported: true, permission: Notification.permission };
};

export const getPushSubscription = async () => {
  const reg = await registerServiceWorker();
  return reg ? reg.pushManager.getSubscription() : null;
};

const deviceLabel = () => {
  const ua = navigator.userAgent;
  const os = /Android/.test(ua) ? "Android" : isIOS() ? (/iPad/.test(ua) || navigator.maxTouchPoints > 1 && !/iPhone/.test(ua) ? "iPad" : "iPhone") : /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${browser} on ${os}${isStandalone() ? " (app)" : ""}`;
};

export const enablePush = async () => {
  const support = pushSupport();
  if (!support.supported) throw new Error(support.reason === "ios-install" ? "On iPhone/iPad, add SV Admin to your Home Screen first, then enable notifications from the app." : "This browser can't receive notifications.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notifications were blocked. Allow them in your browser's site settings.");

  const reg = await registerServiceWorker();
  if (!reg) throw new Error("Couldn't start the notification service.");
  await navigator.serviceWorker.ready;

  const { data } = await api.get("/push/public-key");
  const key = data.data;

  let subscription = await reg.pushManager.getSubscription();
  // A subscription made with an older key can't receive pushes any more.
  if (subscription && subscription.options?.applicationServerKey) {
    const current = btoa(String.fromCharCode(...new Uint8Array(subscription.options.applicationServerKey))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    if (current !== key) {
      await subscription.unsubscribe();
      subscription = null;
    }
  }
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
  }

  const json = subscription.toJSON();
  await api.post("/push/subscribe", { subscription: { endpoint: json.endpoint, keys: json.keys }, label: deviceLabel() });
  return subscription;
};

export const disablePush = async () => {
  const subscription = await getPushSubscription();
  if (!subscription) return;
  await api.post("/push/unsubscribe", { endpoint: subscription.endpoint }).catch(() => {});
  await subscription.unsubscribe();
};

export const clearAppBadge = () => {
  if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
};

export const setAppBadge = (count) => {
  if (!navigator.setAppBadge) return;
  (count ? navigator.setAppBadge(count) : navigator.clearAppBadge()).catch(() => {});
};
