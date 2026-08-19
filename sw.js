const CACHE_NAME = 'tadabbur-v2.0.0';
const STATIC_CACHE = 'tadabbur-static-v2.0.0';
const DYNAMIC_CACHE = 'tadabbur-dynamic-v2.0.0';

// Resolved against the service worker's own scope so the app works both at a domain
// root and inside a GitHub Pages project subfolder (e.g. /Tadabbur/).
const BASE = new URL('./', self.location.href);
const scopedUrl = (path) => new URL(path, BASE).href;

// Files to cache for offline functionality
const STATIC_FILES = [
  './',
  'index.html',
  'tailwind.css',
  'manifest.json',
  'browserconfig.xml',
  'sw-register.js',
  'icons/icon-72x72.svg',
  'icons/icon-96x96.svg',
  'icons/icon-128x128.svg',
  'icons/icon-144x144.svg',
  'icons/icon-152x152.svg',
  'icons/icon-192x192.svg',
  'icons/icon-384x384.svg',
  'icons/icon-512x512.svg'
].map(scopedUrl);

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event
// - Navigations/HTML: network-first so deployed updates reach users immediately,
//   falling back to the cached shell when offline.
// - Everything else: cache-first with dynamic caching for speed.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Let the browser handle cross-origin traffic itself. Quran API responses are cached
  // by the page via the Cache Storage API, and proxying media here would break the
  // HTTP range requests that audio playback and seeking depend on.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Range requests (audio seeking) must reach the network untouched.
  if (request.headers.has('range')) {
    return;
  }

  if (request.mode === 'navigate' || request.destination === 'document') {
    // 'no-cache' forces revalidation with the origin rather than trusting the
    // HTTP cache. GitHub Pages serves HTML with max-age=600, so without this a
    // freshly deployed update could take up to ten minutes to reach a visitor.
    event.respondWith(
      fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(scopedUrl('index.html'))))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            // Cache dynamic content
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.log('Service Worker: Network request failed:', error);

            // Return a generic offline response for other requests
            return new Response('Offline content not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks here
      // For example, sync game progress when back online
      syncGameProgress()
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New content available!',
    icon: scopedUrl('icons/icon-192x192.svg'),
    badge: scopedUrl('icons/icon-72x72.svg'),
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Play Now',
        icon: scopedUrl('icons/icon-96x96.svg')
      },
      {
        action: 'close',
        title: 'Close',
        icon: scopedUrl('icons/icon-96x96.svg')
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Tadabbur', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(BASE.href)
    );
  }
});

// Helper function for background sync
async function syncGameProgress() {
  try {
    // Get stored game progress from IndexedDB or localStorage
    // This would sync with your backend when online
    console.log('Service Worker: Syncing game progress...');
  } catch (error) {
    console.error('Service Worker: Sync failed:', error);
  }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
