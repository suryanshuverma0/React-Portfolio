/* =========================================================================
   SV Admin service worker

   - Push: shows admin alerts as system notifications (phone, tablet,
     desktop) and opens the right admin page when one is tapped.
   - Offline: if a navigation fails with no connection, show a small
     offline page instead of the browser error. Nothing else is cached,
     so the app is always up to date.
   ========================================================================= */

const OFFLINE_URL = "/app/offline.html";
const CACHE = "sv-admin-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/app/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "SV Admin", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "SV Admin";
  const options = {
    body: data.body || "",
    icon: "/app/icon-192.png",
    badge: "/app/badge-96.png",
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    data: { url: data.url || "/dashboard" },
    timestamp: Date.now(),
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // Tell open admin tabs to refresh their bell right away.
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) =>
        clients.forEach((client) => client.postMessage({ type: "admin-alert" })),
      ),
      self.navigator.setAppBadge ? self.navigator.setAppBadge().catch(() => {}) : null,
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/dashboard", self.location.origin);
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => new URL(c.url).origin === self.location.origin);
      if (existing) {
        existing.focus();
        return existing.navigate ? existing.navigate(target.href) : null;
      }
      return self.clients.openWindow(target.href);
    }),
  );
});
