const CACHE_NAME = 'sohbet-v2.0.0';
const urlsToCache = [
  '/Whatsapp/',
  '/Whatsapp/index.html',
  '/Whatsapp/style.css',
  '/Whatsapp/main.js',
  '/Whatsapp/manifest.json',
  '/Whatsapp/icon-192x192.png',
  '/Whatsapp/icon-512x512.png',
  '/Whatsapp/g1.html',
  '/Whatsapp/register.html',
  '/Whatsapp/profil.html',
  '/Whatsapp/kullanicilar.html',
  '/Whatsapp/arkadaslar.html',
  '/Whatsapp/anasayfa.html',
  '/Whatsapp/ayarlar.html'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache açıldı');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
});
