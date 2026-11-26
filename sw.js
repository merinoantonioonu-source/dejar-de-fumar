// Service worker: funciona sin conexión y avisa de hitos en segundo plano
// (sincronización periódica, solo en navegadores que la soportan).
const VERSION = 'ddf-v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/styles.css',
  './js/app.js', './js/content.js', './js/logic.js', './js/store.js', './js/notify.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
];
const SCHEDULE_CACHE = 'ddf-schedule';
const SCHEDULE_URL = './__schedule.json';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== SCHEDULE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Red primero para la página (así llegan las actualizaciones), caché si no hay conexión.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))),
  );
});

async function checkSchedule() {
  const cache = await caches.open(SCHEDULE_CACHE);
  const res = await cache.match(SCHEDULE_URL);
  if (!res) return;
  const data = await res.json();
  if (!data.enabled) return;
  const now = Date.now();
  const due = data.items.filter((m) => m.at <= now && !data.notified.includes(m.id));
  if (!due.length) return;
  const last = due[due.length - 1];
  await self.registration.showNotification(last.title, { body: last.body, tag: last.id, icon: 'icons/icon-192.png', data: { url: './#/cuerpo' } });
  data.notified.push(...due.map((m) => m.id));
  await cache.put(SCHEDULE_URL, new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }));
}

self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'ddf-milestones') e.waitUntil(checkSchedule());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) { c.navigate(url); return c.focus(); } }
      return self.clients.openWindow(url);
    }),
  );
});
