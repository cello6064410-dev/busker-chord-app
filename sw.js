// ============================================
// SERVICE WORKER - Busker App
// ============================================

const CACHE_NAME = 'busker-chords-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/viewer.html',
  '/create.html',
  '/login.html',
  '/adminmenu.html',
  '/viewermenu.html',
  '/dashboard.html',
  '/list.html',
  '/songslist.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('❌ Cache failed:', err))
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch from cache first, then network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch(() => {
          // If both fail, show offline page
          return caches.match('/index.html');
        });
      })
  );
});