// sw.js — Arcave Academy Service Worker
// Har baar jab tum website ka content badlo aur naya deploy karo, sirf
// neeche wala CACHE_VERSION number badha dena (v3, v4, v5...) — bas itna hi.
// Isse purana cache khud-ba-khud clear ho jaega aur students ko naya version milega.
const CACHE_VERSION = 'v3';
const CACHE_NAME = `arcave-academy-${CACHE_VERSION}`;

// Sirf wahi files cache karo jo kam badalti hain (icons, manifest).
// index.html/about/contact jaisi pages ko cache NAHI kar rahe — unhe hamesha
// network se taaza lena hai taaki "purana version" wali dikkat dobara na ho.
const PRECACHE_ASSETS = [
  'icon-192.png',
  'icon-512.png',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting(); // naya service worker turant activate ho, purane ka wait na kare
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME) // purane saare cache versions delete
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // turant sabhi open tabs pe control le lo
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // HTML pages (index.html, about.html, waghera) — hamesha NETWORK se lo,
  // taaki naya deploy turant dikhe. Sirf offline hone par purana cached version dikhao.
  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Baaki static files (icons/manifest) — cache-first, fast loading ke liye.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
