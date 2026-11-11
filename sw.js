// 오프라인 캐시: 박람회장 와이파이가 끊겨도 한 번 연 기기에서는 계속 동작
const VERSION = 'vibe-taste-v9';
const FILES = [
  './', './index.html', './css/app.css', './manifest.webmanifest', './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png',
  './js/main.js', './js/data.js', './js/util.js', './js/build.js', './js/share.js', './js/qr.js', './js/mascot.js',
  './js/templates/index.js', './js/templates/common.js', './js/templates/reaction.js', './js/templates/dodge.js', './js/templates/quiz.js',
  './js/templates/typing.js', './js/templates/timer.js', './js/templates/ladder.js', './js/templates/picker.js', './js/templates/paint.js', './js/templates/piano.js',
  './js/templates/memory.js', './js/templates/mole.js', './js/templates/flash.js', './js/templates/math.js', './js/templates/groups.js', './js/templates/checklist.js', './js/templates/beat.js', './js/templates/pixel.js',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      const net = fetch(e.request).then(res => { if (res.ok) caches.open(VERSION).then(c => c.put(e.request, res.clone())); return res; }).catch(() => hit);
      return hit || net;
    })
  );
});
