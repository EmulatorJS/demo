const CACHE_NAME = "offline-demo";
const OFFLINE_FILES = [
    "index.html",
    "404.html",
    "favicon.ico",
    "manifest.json",
    "img/icon.png",
    "img/logo.png",
    "img/logo-light.png",
    "img/screenshot.png",
    "img/mobile_screenshot.png",
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
                const requestURL = new URL(event.request.url);
                var url = requestURL.pathname;
                if (requestURL.hostname === "cdn.emulatorjs.org") {   
                    return await fetch(event.request)
                } else {
                    const cache = await caches.open(CACHE_NAME);
                    if (url === "/") {
                        url = "index.html";
                    } else if (url === "/versions") {
                        url = "https://cdn.emulatorjs.org/versions.json";
                    } else {
                        url = url.slice(1);
                    }
                    if (!OFFLINE_FILES.includes(url)) {
                        url = "404.html";
                    }
                    return await cache.match(url);
                }
            }
        })()
    );
});
