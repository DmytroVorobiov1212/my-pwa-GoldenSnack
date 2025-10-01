// ---- Версія кешів (збільшуй на кожний реліз) ------------------------------
const CACHE_VERSION = "v1.0.0-2025-10-01";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Скільки максимум записів зберігати у runtime/зображеннях
const RUNTIME_MAX_ENTRIES = 80;
const IMAGES_MAX_ENTRIES = 120;

// ---- Хелпери ----------------------------------------------------------------
const sameOrigin = (url) => new URL(url, self.location.href).origin === self.location.origin;

const isNavigationRequest = (request) =>
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html");

const isHashedAsset = (request) => {
    // Vite кладе файли в /assets/... з хешованими іменами
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
    request.method === "GET" &&
    request.headers.get("accept")?.includes("application/json");

// Додаємо елемент у кеш і тримаємо простий ліміт (найстаріші видаляємо)
async function putWithLimit(cacheName, request, response, maxEntries) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
        // видаляємо найстаріші (початок масиву)
        await cache.delete(keys[0]);
    }
}

// ---- install ---------------------------------------------------------------
self.addEventListener("install", (event) => {
    // Не робимо skipWaiting — оновлюємось за кнопкою з UI (SKIP_WAITING).
    // Можна попередньо закешувати app-shell, якщо хочеш:
    // event.waitUntil(
    //   caches.open(STATIC_CACHE).then((cache) =>
    //     cache.addAll(["/", "/index.html"])
    //   )
    // );
});

// ---- activate: чистимо старі кеші -----------------------------------------
self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const allow = new Set([STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE]);
            const keys = await caches.keys();
            await Promise.all(
                keys.filter((k) => !allow.has(k)).map((k) => caches.delete(k))
            );
            await self.clients.claim();
        })()
    );
});

// ---- повідомлення з клієнта ------------------------------------------------
self.addEventListener("message", async (event) => {
    const type = event.data && event.data.type;

    if (type === "SKIP_WAITING") {
        // Активуємо новий SW (викликається з вашого тосту "Оновити")
        self.skipWaiting();
        return;
    }

    if (type === "PURGE_RUNTIME") {
        // Ручне очищення runtime-кешів (з адмін/дебаг-кнопки)
        const keys = await caches.keys();
        await Promise.all(
            keys
                .filter((k) => k.startsWith("runtime-") || k.startsWith("images-"))
                .map((k) => caches.delete(k))
        );
        // Відповідь назад у сторінку (через MessageChannel)
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
        event.respondWith(
            (async () => {
                try {
                    const network = await fetch(request);
                    // Кэшувати сам HTML агресивно не варто, але можна покласти index.html як офлайн-fallback
                    const cache = await caches.open(STATIC_CACHE);
                    // Кладемо ту ж відповідь як fallback (або завантажимо окремо "/index.html")
                    // Клонуємо тільки якщо 200 OK і тип basic
                    if (network.ok && network.type === "basic") {
                        cache.put("/index.html", network.clone());
                    }
                    return network;
                } catch (_) {
                    // Офлайн → віддай кешований index.html якщо є
                    const cache = await caches.open(STATIC_CACHE);
                    const cached = await cache.match("/index.html");
                    if (cached) return cached;
                    // Як запасний варіант — пробуємо звичайний кеш збіг
                    const any = await caches.match(request);
                    if (any) return any;
                    // Немає нічого — стандартна помилка
                    return new Response("Offline", { status: 503, statusText: "Offline" });
                }
            })()
        );
        return;
    }

    // 2) Хешовані ассети JS/CSS у /assets → cache-first
    if (isHashedAsset(request)) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(STATIC_CACHE);
                const cached = await cache.match(request);
                if (cached) return cached;

                const network = await fetch(request);
                // Хешовані файли безпечно класти в кеш (вони immutable)
                if (network.ok) {
                    cache.put(request, network.clone());
                }
                return network;
            })()
        );
        return;
    }

    // 3) Зображення → stale-while-revalidate з лімітом
    if (isImage(request)) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(IMAGE_CACHE);
                const cached = await cache.match(request);
                const networkPromise = fetch(request)
                    .then((res) => {
                        if (res && res.ok) {
                            // кладемо з лімітом
                            putWithLimit(IMAGE_CACHE, request, res.clone(), IMAGES_MAX_ENTRIES);
                        }
                        return res;
                    })
                    .catch(() => cached);

                return cached || networkPromise;
            })()
        );
        return;
    }

    // 4) API GET → stale-while-revalidate з лімітом
    if (isApiGet(request)) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(RUNTIME_CACHE);
                const cached = await cache.match(request);

                const networkPromise = fetch(request)
                    .then((res) => {
                        // 200 OK → кладемо копію з лімітом
                        if (res.ok) {
                            putWithLimit(RUNTIME_CACHE, request, res.clone(), RUNTIME_MAX_ENTRIES);
                        }
                        return res;
                    })
                    .catch(() => cached);

                return cached || networkPromise;
            })()
        );
        return;
    }

    // 5) Інше — за замовчуванням просто йдемо в мережу (можна розширювати під свої потреби)
});
