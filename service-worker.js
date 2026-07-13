const CACHE_NAME = 'transport-dashboard-v71';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app2.js',
  './data.js',
  './dashboard_data.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

// Network-First 전략: 항상 서버에서 최신 파일을 먼저 받아옵니다. 실패할 경우에만 캐시를 사용합니다.
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 네트워크에서 성공적으로 가져오면 캐시도 최신화
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 연결 실패(오프라인 등) 시 캐시에서 반환
        return caches.match(event.request);
      })
  );
});
