/* Combat Masters — Service Worker
 * Estratégia:
 *  - Shell (index.html): network-first com fallback ao cache (mantém o jogo atualizado).
 *  - Assets com hash (/assets/): cache-first (imutáveis — recarga instantânea e offline).
 *  - Demais same-origin GET (sprites, áudio, json, manifest): cache-first com atualização
 *    em background (stale-while-revalidate) — 43MB de sprites carregam instantâneo na 2ª visita.
 */
const CACHE = 'combat-masters-v1';
const SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function cacheAndFetch(request, cacheName, response) {
  return caches.open(cacheName).then((cache) => {
    cache.put(request, response.clone());
    return response;
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Bundles com hash: imutáveis -> cache-first puro
  if (url.pathname.includes('/assets/index-')) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).then((res) => cacheAndFetch(req, CACHE, res))
      )
    );
    return;
  }

  // Navegação (shell): network-first com fallback offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => cacheAndFetch(req, CACHE, res))
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // Sprites, áudio, json, manifest...: cache-first + revalidação em background
  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req)
        .then((res) => (res.ok ? cacheAndFetch(req, CACHE, res) : res))
        .catch(() => hit);
      return hit || network;
    })
  );
});
