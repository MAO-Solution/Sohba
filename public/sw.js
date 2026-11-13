// Offline-first shell, network-first API with cache fallback.
const VERSION = 'sohba-v1';
const SHELL = ['/', '/css/app.css', '/js/app.js', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/admin')) return; // staff pages: always network, never cached

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then((r) => { const copy = r.clone(); if (r.ok) caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
