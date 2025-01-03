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
    "https://cdn.emulatorjs.org/versions.json",

    // Only cache stable assets offline...?
    "https://cdn.emulatorjs.org/stable/data/loader.js",
    "https://cdn.emulatorjs.org/stable/data/emulator.min.js",
    "https://cdn.emulatorjs.org/stable/data/emulator.min.css",
    "https://cdn.emulatorjs.org/stable/data/compression/extract7z.js",
    "https://cdn.emulatorjs.org/stable/data/compression/extractzip.js",
    "https://cdn.emulatorjs.org/stable/data/compression/libunrar.js",
    "https://cdn.emulatorjs.org/stable/data/compression/libunrar.wasm"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(OFFLINE_FILES);
        })()
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    self.clients.claim();
});

function getCacheUrl(url) {
    if (url === "/") {
        return "index.html";
    } else if (url === "/versions") {
        return "https://cdn.emulatorjs.org/versions.json";
    } else if (url.startsWith("/")) {
        return url.slice(1);
    }
    return url;
}

self.addEventListener("fetch", (event) => {
    event.respondWith(
        (async () => {
            const requestURL = new URL(event.request.url);
            let url = (requestURL.hostname === "cdn.emulatorjs.org") ? event.request.url : requestURL.pathname;
            const cache = await caches.open(CACHE_NAME);
            if (requestURL.hostname === "cdn.emulatorjs.org" && !OFFLINE_FILES.includes(event.request.url)) {
                return await fetch(event.request);
            }
            try {
                const req = (url === "/versions") ? "https://cdn.emulatorjs.org/versions.json" : event.request;
                const res = await fetch(req);
                if (!res.status.toString().startsWith('2')) {
                    throw new Error('status code not ok');
                }
                cache.put(getCacheUrl(url), res.clone());
                return res;
            } catch(e) {
                url = getCacheUrl(url);
                if (!OFFLINE_FILES.includes(url)) {
                    url = "404.html";
                }
                return await cache.match(url);
            }
        })()
    );
});
