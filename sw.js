// Offline support and fast opening: the app opens from its saved copy, and new versions download in the background.
// When releasing, bump VERSION here together with the ?v= numbers in index.html.
const VERSION = 'abe-v30';
const SCRIPTS = ['icons', 'strings', 'core', 'book', 'fridge', 'family', 'notebooks', 'more', 'app'].map(n => `./js/${n}.js?v=${VERSION}`);
const SHELL = ['./', './index.html', `./css/app.css?v=${VERSION}`, ...SCRIPTS, './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/logo-128.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Tell the open app (again a moment later, in case it is still starting).
function notify() {
  const send = async () => { for (const c of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) c.postMessage('update-ready'); };
  send(); setTimeout(send, 1500); setTimeout(send, 4000);
}

// The page: shown from the saved copy straight away; the network copy replaces it for next time,
// and if it changed, the open app offers to reload.
async function page(req) {
  const cache = await caches.open(VERSION);
  const saved = await cache.match('./index.html');
  const savedText = saved ? await saved.clone().text() : null;  // read before the page takes the response
  const fresh = fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(async res => {
    if (!res.ok) return res;
    const text = await res.clone().text();
    await cache.put('./index.html', res.clone());
    if (savedText !== null && text !== savedText) notify();
    return res;
  });
  if (saved) { fresh.catch(() => {}); return saved; }
  return fresh.catch(() => caches.match('./index.html'));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return;
  if (sameOrigin && url.pathname.startsWith('/api/')) return;  // the recipe-page fetcher is always live

  if (req.mode === 'navigate') { e.respondWith(page(req)); return; }
  // Versioned app files never change: cache only.
  if (sameOrigin && url.searchParams.get('v') === VERSION) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })));
    return;
  }
  // Everything else (art, libraries, fonts): saved copy first, refreshed in the background.
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
