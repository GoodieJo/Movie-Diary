// Minimal service worker — required by Chrome on Android for PWA installability.
// This does not implement offline caching; it just satisfies the install criteria.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: pass-through fetch handler (required for "installable" criteria on some Android versions)
});