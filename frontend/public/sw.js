/**
 * ExamForge Production Service Worker
 * 
 * ZERO-LEAK SECURITY CONTRACT:
 * - Pre-caches only static application shell assets, fonts, icons, and offline shells.
 * - Stale-While-Revalidate for static script chunks, stylesheets, and fonts.
 * - STRICT NON-CACHING FOR ALL API ROUTES (/api/*): Sensitive examination data,
 *   authentication tokens, OTPs, Aadhaar proofs, answers, and payment states are NEVER
 *   stored in CacheStorage.
 */

const CACHE_VERSION = 'examforge-v2.0.0';
const STATIC_CACHE = `examforge-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `examforge-runtime-${CACHE_VERSION}`;

const PRECACHE_SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/result-portal',
  '/candidate',
  '/safebatch',
  '/verify-result'
];

// 1. Install Event: Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_SHELL_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache partial failure (non-fatal):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Purge outdated cache buckets
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('examforge-') && name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[ServiceWorker] Purging legacy cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Zero-Leak Security Cache Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests, Chrome extension protocols, and background sync
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // =========================================================================
  // ZERO-LEAK RULE: ALL /api/ ROUTES ARE STRICTLY NETWORK-ONLY
  // Never cache authentication tokens, candidate PII, OTPs, or exam answers!
  // =========================================================================
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            error: "Network unavailable. This examination operation requires an active internet connection.",
            offline: true,
            timestamp: new Date().toISOString()
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" }
          }
        );
      })
    );
    return;
  }

  // Static Assets & Web App Pages: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and navigating to a page, serve pre-cached shell
          if (event.request.mode === 'navigate') {
            return caches.match('/') || caches.match('/result-portal');
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Push Notification Event (Examination Schedules, Hall Ticket Alerts, Dispute Updates)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const title = payload.title || 'ExamForge Alert';
    const options = {
      body: payload.body || 'Important examination update available.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: payload.url || '/result-portal',
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'Open Portal' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('[ServiceWorker] Push notification payload parse error:', e);
  }
});

// 5. Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
