const CACHE_NAME = 'apiflow-8e82400e8fbe8ce47c33';
const BUILD_ASSETS = ["/assets/vendor-dexie-B0yzgGqo.js","/assets/vendor-faker-CdBPqZdY.js","/assets/vendor-lucide-BLObK2Hs.js","/assets/index-hToMhs5W.js","/assets/index-5Q8PwA9L.css","/assets/LandingPage-CW-OfI-R.js","/assets/AppShell-CmBMnexE.js","/assets/StatsDashboard-BwnybYGS.js","/assets/schema-generator-LtWMFmUy.js"];
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/favicon.svg'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    if (CACHE_NAME.includes('__BUILD_ID__')) throw new Error('Offline caching requires a production build.');
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([...new Set([...STATIC_ASSETS, ...BUILD_ASSETS])]);
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('apiflow-') && key !== CACHE_NAME) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Whitelist app resources. Never store admin, API, proxy or arbitrary pages.
  const navigation = url.pathname === '/' || url.pathname === '/index.html';
  // A query changes client-side state, not the static app shell. Never persist
  // the query URL (which may contain a legacy shared payload or credentials).
  if (url.search && !navigation) return;
  const asset = url.pathname.startsWith('/assets/') || ['/manifest.json','/favicon.svg'].includes(url.pathname);
  if (!navigation && !asset) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Keep the HTML and lazy chunks from the same release until the waiting
    // worker activates. Network-first HTML could mix a new shell with old chunks.
    const cachedBuild = await cache.match(navigation ? '/index.html' : event.request);
    if (cachedBuild) return cachedBuild;
    try {
      const response = await fetch(event.request);
      if (!url.search && response.ok && response.type === 'basic') await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(navigation ? '/index.html' : event.request);
      if (cached) return cached;
      throw error;
    }
  })());
});
