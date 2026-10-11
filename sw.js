const CACHE = 'filesquiez-v5';
const SHELL = [
  './', 'index.html', 'styles.css', 'fonts/unbounded-title.woff2',
  'js/main.js', 'js/sizepicker.js', 'js/lib.js', 'js/warnings.js', 'js/search.js',
  'js/compressors/image.js', 'js/compressors/pdf.js', 'js/compressors/office.js', 'js/compressors/text.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Libraries and fonts never change: cache-first. App files: serve cached copy, refresh in the background.
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const immutable = /\/(vendor|fonts)\//.test(url.pathname);
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit && immutable) return hit;
    const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; });
    if (hit) { net.catch(() => {}); return hit; }
    return net;
  }));
});
