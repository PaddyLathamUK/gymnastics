/* ═══════════════════════════════════════════
   SERVICE WORKER
   Bump CACHE_VERSION when pushing updates —
   the app will detect the change and prompt
   the user to refresh.
═══════════════════════════════════════════ */

const CACHE_VERSION = 'v6';
const CACHE_NAME    = `gymnastics-${CACHE_VERSION}`;

// Core files to cache for offline use
const CORE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/design.css',
  './js/supabase.js',
  './js/auth.js',
  './js/data.js',
  './js/app.js',
  './js/views/auth.js',
  './js/views/dashboard.js',
  './js/views/competitions.js',
  './js/views/training.js',
  './js/views/worlds.js',
  './js/views/achievements.js',
  './js/views/admin.js',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

// ── Install: cache core files & take over immediately ──────
self.addEventListener('install', event => {
  // skipWaiting immediately — no more "waiting" state
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_FILES))
  );
});

// ── Activate: delete old caches ─────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('gymnastics-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Message: allow page to trigger update ───
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Fetch: network-first for JS/HTML, cache-first for assets ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Don't intercept Supabase API calls or external CDN
  if (!url.origin.includes(self.location.origin)) return;

  // Network-first for HTML, JS and CSS (so updates land immediately)
  const isAppFile = url.pathname.endsWith('.html')
                 || url.pathname.endsWith('.js')
                 || url.pathname.endsWith('.css')
                 || url.pathname === '/';

  if (isAppFile) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for CSS, images etc
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
      )
  );
});
