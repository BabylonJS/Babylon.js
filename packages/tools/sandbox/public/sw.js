// Service worker for Babylon.js Sandbox PWA
// Provides full offline support by caching app shell and Babylon.js libraries
// Uses two strategies:
//   - Network-first for versioned Babylon.js libraries (timestamp.js + preview CDN)
//     so that new framework versions are always picked up when online
//   - Stale-while-revalidate for app shell, icons, fonts, and physics engines

const CACHE_VERSION = "v3";
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

// Static external resources — these change infrequently and use stale-while-revalidate
const STATIC_EXTERNAL_RESOURCES = [
    // Fonts
    "https://use.typekit.net/cta4xsb.css",

    // Physics engines
    "https://cdn.babylonjs.com/ammo.js",
    "https://cdn.babylonjs.com/havok/HavokPhysics_umd.js",
    "https://cdn.babylonjs.com/cannon.js",
    "https://cdn.babylonjs.com/Oimo.js",
];

// Versioned Babylon.js resources — these use network-first to ensure fresh versions
const VERSIONED_RESOURCES = [
    // Babylon.js CDN version timestamp (used for cache-busting)
    "https://cdn.babylonjs.com/timestamp.js",

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
                    // Cache static external resources (best effort)
                    const staticPromises = STATIC_EXTERNAL_RESOURCES.map((url) =>
                        fetch(url, { mode: "cors" })
                            .then((response) => (response.ok ? cache.put(url, response) : undefined))
                            .catch(() => {})
                    );
                    // Cache versioned resources (best effort - serves as offline fallback)
                    const versionedPromises = VERSIONED_RESOURCES.map((url) =>
                        fetch(url, { mode: "cors" })
                            .then((response) => (response.ok ? cache.put(url, response) : undefined))
                            .catch(() => {})
                    );
                    return Promise.allSettled([...iconPromises, ...staticPromises, ...versionedPromises]);
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

// Returns true if the request is for a versioned Babylon.js resource that must be network-first
function isVersionedResource(url) {
    // timestamp.js (with or without query string)
    if (url.pathname.endsWith("/timestamp.js")) {
        return true;
    }
    // Babylon.js preview CDN libraries
    if (url.hostname === "preview.babylonjs.com") {
        return true;
    }
    // Snapshot CDN libraries
    if (url.hostname === "snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net") {
        return true;
    }
    // Versioned CDN libraries (e.g. cdn.babylonjs.com/v7.x.x/...)
    if (url.hostname === "cdn.babylonjs.com" && url.pathname.match(/^\/v\d/)) {
        return true;
    }
    return false;
}

// Network-first strategy: try network, fall back to cache only when offline
function networkFirst(event, cache) {
    return fetch(event.request)
        .then((networkResponse) => {
            if (networkResponse.ok || networkResponse.type === "opaque") {
                // Update cache with the fresh response; use waitUntil to
                // ensure writes complete before the SW is terminated
                const cacheUpdates = [];
                cacheUpdates.push(cache.put(event.request, networkResponse.clone()));
                // Also cache without query string so offline fallback works
                const url = new URL(event.request.url);
                if (url.search) {
                    cacheUpdates.push(cache.put(url.origin + url.pathname, networkResponse.clone()));
                }
                event.waitUntil(Promise.allSettled(cacheUpdates));
            }
            return networkResponse;
        })
        .catch(() => {
            // Network failed — try cache (exact match first, then without query string)
            return cache.match(event.request).then((cached) => {
                if (cached) {
                    return cached;
                }
                const url = new URL(event.request.url);
                return cache.match(url.origin + url.pathname);
            });
        })
        .then((response) => {
            return response || new Response("Offline", { status: 503, statusText: "Service Unavailable" });
        });
}

// Stale-while-revalidate strategy: serve from cache immediately, update in background
function staleWhileRevalidate(event, cache) {
    const cacheMatchPromise = cache.match(event.request).then((response) => {
        if (response) {
            return response;
        }

        // For external resources, try matching without query string
        const requestUrl = new URL(event.request.url);
        const urlWithoutQuery = requestUrl.origin + requestUrl.pathname;
        if (requestUrl.search && requestUrl.origin !== self.location.origin) {
            return cache.match(urlWithoutQuery);
        }
        return null;
    });

    return cacheMatchPromise.then((cachedResponse) => {
        // Start network fetch in background (don't await)
        const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
                // Update cache with fresh version (including opaque cross-origin responses)
                if (networkResponse.ok || networkResponse.type === "opaque") {
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
}

// Fetch handler: route to appropriate caching strategy
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
            // Versioned Babylon.js resources: always try network first so new
            // framework versions are picked up immediately when online
            if (isVersionedResource(url)) {
                return networkFirst(event, cache);
            }

            // Everything else (app shell, icons, fonts, physics): stale-while-revalidate
            return staleWhileRevalidate(event, cache);
        })
    );
});
