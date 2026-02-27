// Service worker for Babylon.js Sandbox PWA
// Provides full offline support by caching app shell and Babylon.js libraries
// The cache is versioned to allow for updates and we use a stale-while-revalidate strategy
// (serve from cache immediately, then update in background)

const CACHE_VERSION = "v2";
const CACHE_NAME = `babylon-sandbox-${CACHE_VERSION}`;

// App shell - core files required for offline startup
const APP_SHELL = ["./", "./index.html", "./index.js", "./babylon.sandbox.js", "./manifest.webmanifest"];

// Icons to pre-cache (key sizes for PWA installation)
const ICONS = [
    // Android icons (required for PWA install)
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    // Windows icons (taskbar, desktop & file associations)
    "./icons/icon-256.png",
    "./icons/icon-96.png",
    "./icons/icon-48.png",
    "./icons/icon-32.png",
    "./icons/icon-24.png",
    "./icons/icon-16.png",
];

// External resources to cache
const EXTERNAL_RESOURCES = [
    // Fonts
    "https://use.typekit.net/cta4xsb.css",

    // Babylon.js CDN version timestamp (used for cache-busting)
    "https://cdn.babylonjs.com/timestamp.js",

    // Physics engines
    "https://cdn.babylonjs.com/ammo.js",
    "https://cdn.babylonjs.com/havok/HavokPhysics_umd.js",
    "https://cdn.babylonjs.com/cannon.js",
    "https://cdn.babylonjs.com/Oimo.js",

    // Babylon.js core libraries (preview/latest)
    "https://preview.babylonjs.com/babylon.js",
    "https://preview.babylonjs.com/addons/babylonjs.addons.min.js",
    "https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js",
    "https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js",
    "https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js",
    "https://preview.babylonjs.com/gui/babylon.gui.min.js",
    "https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js",
    "https://preview.babylonjs.com/inspector/babylon.inspector-v2.bundle.js",
];

// Install: cache app shell and external resources (do not fail on external resources)
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => {
                // Cache app shell first (required)
                return cache.addAll(APP_SHELL).then(() => {
                    // Cache icons (best effort - don't fail install if these fail)
                    const iconPromises = ICONS.map((url) =>
                        fetch(url)
                            .then((response) => (response.ok ? cache.put(url, response) : undefined))
                            .catch(() => {})
                    );
                    // Then cache external resources (best effort - don't fail install if these fail)
                    const externalPromises = EXTERNAL_RESOURCES.map((url) =>
                        fetch(url, { mode: "cors" })
                            .then((response) => (response.ok ? cache.put(url, response) : undefined))
                            .catch(() => {})
                    );
                    return Promise.allSettled([...iconPromises, ...externalPromises]);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                // Delete all caches that are not the current version
                return Promise.all(cacheNames.filter((name) => name.startsWith("babylon-sandbox-") && name !== CACHE_NAME).map((name) => caches.delete(name)));
            })
            .then(() => self.clients.claim())
    );
});

// Fetch: stale-while-revalidate strategy
// Serve from cache immediately, then update cache in background
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== "GET") {
        return;
    }

    // Skip browser extensions, data URLs, etc.
    if (!url.protocol.startsWith("http")) {
        return;
    }

    // Skip analytics
    if (url.hostname.includes("google")) {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            const cacheMatchPromise = cache.match(event.request).then((response) => {
                if (response) {
                    return response;
                }

                // For external resources, try matching without query string (for cache-busting URLs like timestamp.js?t=xxx)
                const requestUrl = new URL(event.request.url);
                const urlWithoutQuery = requestUrl.origin + requestUrl.pathname;
                if (requestUrl.search && !requestUrl.hostname.includes(self.location.hostname)) {
                    return cache.match(urlWithoutQuery);
                }
                return null;
            });

            return cacheMatchPromise.then((cachedResponse) => {
                // Start network fetch in background (don't await)
                const fetchPromise = fetch(event.request)
                    .then((networkResponse) => {
                        // Update cache with fresh version
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Network failed, return null (we'll use cache or fallback)
                        return null;
                    });

                // Return cached response immediately if available
                if (cachedResponse) {
                    return cachedResponse;
                }

                // No cache, wait for network
                return fetchPromise.then((networkResponse) => {
                    if (networkResponse) {
                        return networkResponse;
                    }
                    // Network failed and no cache - return fallback
                    if (event.request.mode === "navigate") {
                        return cache.match("./index.html");
                    }
                    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
                });
            });
        })
    );
});
