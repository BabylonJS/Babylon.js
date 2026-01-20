// Minimal service worker for PWA installability
// This is the minimum needed for the browser to recognize the app as a PWA

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
    // Let all requests go to the network normally
});
