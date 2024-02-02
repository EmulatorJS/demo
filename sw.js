const CACHE_NAME = "offline-demo";
const OFFLINE_FILES = [
    "index.html",
    "favicon.ico",
    "img/logo-light.png",
    "404.html",
    "https://cdn.emulatorjs.org/versions.json"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            for (const file of OFFLINE_FILES) {
                await cache.add(new Request(file, {cache: "reload"}));
            }
        })()
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        (async () => {
            try {
                const res = await fetch(event.request);
                if (!res.status.toString().startsWith('2')) {
                    throw new Error('status code not ok');
                }
                return res;
            } catch (e) {
                const cache = await caches.open(CACHE_NAME);
                const requestURL = new URL(event.request.url);
                var url = requestURL.pathname;
                if (url === "/") {
                    url = "index.html";
                } else {
                    url = url.slice(1);
                }
                if (!OFFLINE_FILES.includes(url)) {
                    url = "404.html";
                }
                return await cache.match(url);
            }
        })()
    );
});
