// public/service-worker.js

// ---- Версія кешів (збільшуй на кожний реліз) ------------------------------
const CACHE_VERSION = "v1.0.0-2025-10-01";
const SW_VERSION = CACHE_VERSION;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Скільки максимум записів зберігати у runtime/зображеннях
const RUNTIME_MAX_ENTRIES = 80;
const IMAGES_MAX_ENTRIES = 120;

// ---- Хелпери ----------------------------------------------------------------
const sameOrigin = (url) => new URL(url, self.location.href).origin === self.location.origin;

const isNavigationRequest = (request) =>
    request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html");

const isHashedAsset = (request) => {
    const url = new URL(request.url);
    return sameOrigin(url) && url.pathname.startsWith("/assets/") &&
        (url.pathname.endsWith(".js") || url.pathname.endsWith(".css"));
};

const isImage = (request) => {
    const dest = request.destination;
    if (dest === "image") return true;
    const url = new URL(request.url);
    return /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname);
};

const isApiGet = (request) =>
    request.method === "GET" && request.headers.get("accept")?.includes("application/json");

// Лімітатор для runtime-кешів
async function putWithLimit(cacheName, request, response, maxEntries) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
        await cache.delete(keys[0]);
    }
}

// ---- install ---------------------------------------------------------------
self.addEventListener("install", (event) => {
    // НЕ робимо skipWaiting тут: оновлюємось за кнопкою (SKIP_WAITING з UI)
    // Можна precache app-shell, якщо треба:
    // event.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(["/","/index.html"])));
});

// ---- activate: чистимо старі кеші -----------------------------------------
self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        const allow = new Set([STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE]);
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => !allow.has(k)).map(k => caches.delete(k)));

        // Navigation Preload (опційно прискорює NetworkFirst)
        if ('navigationPreload' in self.registration) {
            try { await self.registration.navigationPreload.enable(); } catch { }
        }

        await self.clients.claim();
    })());
});

// ---- повідомлення з клієнта ------------------------------------------------
self.addEventListener("message", async (event) => {
    const type = event.data && event.data.type;

    if (type === "GET_VERSION") {
        event.ports[0]?.postMessage({ ok: true, version: SW_VERSION });
        return;
    }

    if (type === "SKIP_WAITING") {
        self.skipWaiting();
        return;
    }

    if (type === "PURGE_RUNTIME") {
        const keys = await caches.keys();
        await Promise.all(
            keys
                .filter((k) => k.startsWith("runtime-") || k.startsWith("images-"))
                .map((k) => caches.delete(k))
        );
        event.ports[0]?.postMessage({ ok: true });
        return;
    }
});

// ---- fetch: політики кешування --------------------------------------------
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // ❌ Ніколи не перехоплюємо сам SW-файл
    if (url.pathname === "/service-worker.js") return;

    const { request } = event;

    // 1) Навігація/HTML → network-first + офлайн fallback на index.html
    if (isNavigationRequest(request)) {
        event.respondWith((async () => {
            try {
                // Navigation Preload швидше за звичайний fetch
                const preload = await event.preloadResponse;
                if (preload) return preload;

                const network = await fetch(request);
                const cache = await caches.open(STATIC_CACHE);
                if (network.ok && network.type === "basic") {
                    cache.put("/index.html", network.clone());
                }
                return network;
            } catch (_) {
                const cache = await caches.open(STATIC_CACHE);
                const cached = await cache.match("/index.html");
                if (cached) return cached;
                const any = await caches.match(request);
                if (any) return any;
                return new Response("Offline", { status: 503, statusText: "Offline" });
            }
        })());
        return;
    }

    // 2) Хешовані ассети JS/CSS у /assets → cache-first
    if (isHashedAsset(request)) {
        event.respondWith((async () => {
            const cache = await caches.open(STATIC_CACHE);
            const cached = await cache.match(request);
            if (cached) return cached;
            const network = await fetch(request);
            if (network.ok) cache.put(request, network.clone());
            return network;
        })());
        return;
    }

    // 3) Зображення → stale-while-revalidate з лімітом
    if (isImage(request)) {
        event.respondWith((async () => {
            const cache = await caches.open(IMAGE_CACHE);
            const cached = await cache.match(request);
            const networkPromise = fetch(request)
                .then((res) => {
                    if (res && res.ok) putWithLimit(IMAGE_CACHE, request, res.clone(), IMAGES_MAX_ENTRIES);
                    return res;
                })
                .catch(() => cached);
            return cached || networkPromise;
        })());
        return;
    }

    // 4) API GET → stale-while-revalidate з лімітом
    if (isApiGet(request)) {
        event.respondWith((async () => {
            const cache = await caches.open(RUNTIME_CACHE);
            const cached = await cache.match(request);
            const networkPromise = fetch(request)
                .then((res) => {
                    if (res.ok) putWithLimit(RUNTIME_CACHE, request, res.clone(), RUNTIME_MAX_ENTRIES);
                    return res;
                })
                .catch(() => cached);
            return cached || networkPromise;
        })());
        return;
    }

    // 5) Інше — йдемо в мережу
});
