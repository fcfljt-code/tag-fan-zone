// Service Worker für TSG 1899 Hoffenheim Fan-Zone PWA
// Version 3 - Network First für bessere Zuverlässigkeit
const CACHE_VERSION = 'v3';
const CACHE_NAME = 'tsg-fan-zone-' + CACHE_VERSION;

// Install Event
self.addEventListener('install', (event) => {
    console.log('[SW] Installing version', CACHE_VERSION);
    // Sofort aktivieren, nicht auf alte Tabs warten
    self.skipWaiting();
});

// Activate Event - Alte Caches löschen
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating version', CACHE_VERSION);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            // Sofort alle Clients übernehmen
            return self.clients.claim();
        })
    );
});

// Fetch Event - Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
    // Nur GET Requests behandeln
    if (event.request.method !== 'GET') {
        return;
    }

    // Externe APIs nicht cachen
    if (event.request.url.includes('api.openligadb.de') ||
        event.request.url.includes('firebaseio.com') ||
        event.request.url.includes('googleapis.com') ||
        event.request.url.includes('gstatic.com')) {
        return;
    }

    event.respondWith(
        // Immer zuerst vom Netzwerk laden
        fetch(event.request)
            .then((response) => {
                // Nur gültige Responses cachen
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline: Aus Cache laden
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Fallback für HTML-Seiten
                    if (event.request.headers.get('accept') &&
                        event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});
