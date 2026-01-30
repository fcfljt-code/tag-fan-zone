// Service Worker für TSG 1899 Hoffenheim Fan-Zone PWA
const CACHE_NAME = 'tsg-fan-zone-v1';
const STATIC_CACHE = 'tsg-static-v1';
const DYNAMIC_CACHE = 'tsg-dynamic-v1';

// Dateien, die beim Install gecacht werden
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/main.js',
    '/js/auth.js',
    '/js/tabelle.js',
    '/js/spielplan.js',
    '/js/blog.js',
    '/js/galerie.js',
    '/js/top11.js',
    '/js/fangruppe.js',
    '/images/logo.png',
    '/manifest.json'
];

// API-URLs die nicht gecacht werden sollen
const API_URLS = [
    'api.openligadb.de'
];

// Install Event - Static Files cachen
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[Service Worker] Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event - Alte Caches löschen
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Cache-First für Static, Network-First für API
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API-Anfragen: Network First mit Fallback
    if (API_URLS.some(api => url.hostname.includes(api))) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Antwort clonen und cachen
                    const clonedResponse = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then((cache) => cache.put(event.request, clonedResponse));
                    return response;
                })
                .catch(() => {
                    // Offline: Aus Cache laden
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Statische Dateien: Cache First
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Nicht im Cache, vom Netzwerk laden
                return fetch(event.request)
                    .then((response) => {
                        // Nur gültige Antworten cachen
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Bilder und andere Assets dynamisch cachen
                        const clonedResponse = response.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then((cache) => cache.put(event.request, clonedResponse));

                        return response;
                    })
                    .catch(() => {
                        // Offline-Fallback für HTML
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Push Notifications (für zukünftige Erweiterungen)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Neue Nachricht von TSG Fan-Zone!',
        icon: '/images/icons/icon-192x192.png',
        badge: '/images/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'tsg-notification'
    };

    event.waitUntil(
        self.registration.showNotification('TSG 1899 Hoffenheim', options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
