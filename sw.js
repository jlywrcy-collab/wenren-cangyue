// 闻人苍月 · 梦女同人写作台 — Service Worker
// 缓存核心资源实现离线打开；网络优先，失败回退缓存
const CACHE = 'wenren-v1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // 只处理同源 GET
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        // 网络成功：更新缓存（只缓存文档与静态资源）
        if (resp.ok && (url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('.png') || url.pathname.endsWith('.webmanifest'))) {
          const clone = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('./')))
  );
});
