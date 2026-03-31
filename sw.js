const CACHE_NAME = 'zettel-workbench-v1';
const APP_SHELL = ['./', './index.html', './manifest.json'];
const APP_SHELL_PATHS = new Set(['/', '/index.html', '/manifest.json']);
const STATIC_ASSET_EXTENSIONS = /\.(css|js|mjs|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const isAppShellRoute = APP_SHELL_PATHS.has(requestUrl.pathname);
  const isLocalStaticAsset = STATIC_ASSET_EXTENSIONS.test(requestUrl.pathname);

  if (!isAppShellRoute && !isLocalStaticAsset) return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    const response = await fetch(event.request);
    if (!response || response.status !== 200 || response.type !== 'basic') return response;

    const cache = await caches.open(CACHE_NAME);
    await cache.put(event.request, response.clone());
    return response;
  })());
});
