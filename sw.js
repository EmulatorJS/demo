const CACHE_NAME = "offline-demo";
const OFFLINE_FILES = [
    "index.html",
    "main.js",
    "main.css",
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
let STABLE_EJS_VER = "4.2.2"; // Fallback version if the request fails

importScripts('/main.js');

loadJSON("https://cdn.emulatorjs.org/versions.json", (response) => {
    if (response) {
        STABLE_EJS_VER = JSON.parse(response).github;
    }
    console.log("Stable EmulatorJS version:", STABLE_EJS_VER);
});

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
    return url.replace(STABLE_EJS_VER, "stable");
}

self.addEventListener("fetch", (event) => {
    event.respondWith(
        (async () => {
            const requestURL = new URL(event.request.url);
            let url = (requestURL.hostname === "cdn.emulatorjs.org") ? event.request.url : requestURL.pathname;
            const cache = await caches.open(CACHE_NAME);
            if (requestURL.hostname === "cdn.emulatorjs.org" && !OFFLINE_FILES.includes(event.request.url.replace(STABLE_EJS_VER, "stable")) && !event.request.url.includes("reports/")) {
                return await fetch(event.request);
            }
            try {
                const req = (url === "/versions") ? "https://cdn.emulatorjs.org/versions.json" : event.request;
                const res = await fetch(req);
                if (!res.ok && res.status !== 0) {
                    throw new Error('status code not ok');
                }
                cache.put(getCacheUrl(url), res.clone());
                return res;
            } catch(e) {
                console.log("error:", e);
                url = getCacheUrl(url);
                let rv = await cache.match(url);
                if (rv === undefined) {
                    rv = await cache.match("404.html");
                }
                return rv;
            }
        })()
    );
});
