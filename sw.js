// Arcave Academy — Service Worker
// Kaam: (1) website ko "installable" (PWA) banana, (2) app-shell ko cache karke
// agli baar website jaldi khulwaana. Student data (Firestore/Firebase) ye cache
// nahi karta — wo hamesha live/fresh hi aata hai.

const CACHE_NAME = 'arcave-shell-v1';
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Sirf apni hi website ke GET request cache karो — Firebase/Firestore/Razorpay
  // jaise doosre domains ke request ko chhoo mat, unhe seedha internet se jaane do.
  if(req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req).then((res) => {
      const resClone = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(()=>{});
      return res;
    }).catch(() =>
      caches.match(req).then((cached) => cached || caches.match('/index.html'))
    )
  );
});
