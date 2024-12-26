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
  "https://cdn.emulatorjs.org/stable/data/loader.js",
  "https://cdn.emulatorjs.org/stable/data/version.json",
  "https://cdn.emulatorjs.org/stable/data/emulator.min.js",
  "https://cdn.emulatorjs.org/stable/data/emulator.min.css",
  "https://cdn.emulatorjs.org/stable/data/cores/cores.json",
  "https://cdn.emulatorjs.org/stable/data/compression/extract7z.js",
  "https://cdn.emulatorjs.org/stable/data/compression/extractzip.js",
  "https://cdn.emulatorjs.org/stable/data/compression/libunrar.js",
  "https://cdn.emulatorjs.org/stable/data/compression/libunrar.wasm",
];
let cacheStatus = false;

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

self.addEventListener("message", async (event) => {
  if (event.data && event.data.type === "CACHE_URLS") {
    const urls = event.data.urls;
    for (const url of urls) {
      while (cacheStatus) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      cacheStatus = true;
      try {
        const cache = await caches.open(CACHE_NAME);
        const response = await fetch(url);
        if (response && response.status === 200) {
          await cache.put(url, response.clone());
        }
      } finally {
        cacheStatus = false;
      }
    }
  }
  if (event.data && event.data.type === "REMOVE_URLS") {
    const urls = event.data.urls;
    const cache = await caches.open(CACHE_NAME);
    for (const url of urls) {
      await cache.delete(url);
    }
  }
});

function cacheUpdate(fileUrl) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "CACHE_UPDATE",
        url: fileUrl,
      });
    });
  });
}

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
      let url =
        requestURL.hostname === "cdn.emulatorjs.org"
          ? event.request.url
          : requestURL.pathname;
      const cache = await caches.open(CACHE_NAME);
      if (
        event.request.url.startsWith("https://cdn.emulatorjs.org/stable/data/")
      ) {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        cacheStatus = true;
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
          cacheUpdate(event.request.url);
        }
        cacheStatus = false;
        return networkResponse;
      }
      if (
        requestURL.hostname === "cdn.emulatorjs.org" &&
        !OFFLINE_FILES.includes(event.request.url)
      ) {
        return await fetch(event.request);
      }
      try {
        const req =
          url === "/versions"
            ? "https://cdn.emulatorjs.org/versions.json"
            : event.request;
        const res = await fetch(req);
        if (!res.status.toString().startsWith("2")) {
          throw new Error("status code not ok");
        }
        cache.put(getCacheUrl(url), res.clone());
        return res;
      } catch (e) {
        url = getCacheUrl(url);
        if (!OFFLINE_FILES.includes(url)) {
          url = "404.html";
        }
        return await cache.match(url);
      }
    })()
  );
});
