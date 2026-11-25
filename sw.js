/* FARMACIA PRO 2.0 - Service Worker
 * Solo guarda en caché la "carcasa" de la app (páginas, iconos y manifiestos de ESTE sitio).
 * Nunca toca las llamadas al Apps Script ni a otros dominios: los datos siempre vienen en vivo.
 * Las páginas se piden primero a la red, así una actualización en GitHub se ve de inmediato. */
const CACHE = 'fpro-shell-v2';
const SHELL = ['./index.html', './admin-general.html', './manifest.webmanifest', './manifest-admin.webmanifest',
  './icon-192.png', './icon-512.png', './icon-admin-192.png', './icon-admin-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // API y CDN: directo a la red
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')).then(r => r || new Response('Sin conexión', {status: 503}))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const red = fetch(req).then(res => { if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); } return res; }).catch(() => hit);
    return hit || red;
  }));
});
