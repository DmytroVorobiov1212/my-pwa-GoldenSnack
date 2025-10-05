/* eslint-disable no-undef */
// --- Workbox core (injectManifest) ---
import {
    cleanupOutdatedCaches,
    precacheAndRoute,
    createHandlerBoundToURL,
} from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// ---- Версії/кеші -----------------------------------------------------------
const CACHE_VERSION = 'v2.1.0-2025-10-05';
const SW_VERSION = CACHE_VERSION;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

const RUNTIME_MAX_ENTRIES = 80;
const IMAGES_MAX_ENTRIES = 120;

// ---- Хелпери ----------------------------------------------------------------
const sameOrigin = (url) =>
    new URL(url, self.location.href).origin === self.location.origin;

const isHashedAsset = (request) => {
    const url = new URL(request.url);
    return (
        sameOrigin(url) &&
        url.pathname.startsWith('/assets/') &&
        (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))
    );
};

const isImage = (request) => {
    if (request.destination === 'image') return true;
    const url = new URL(request.url);
    return /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname);
};

const isApiGet = (request) =>
    request.method === 'GET' &&
    request.headers.get('accept')?.includes('application/json');

async function putWithLimit(cacheName, request, response, maxEntries) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    const keys = await cache.keys();
    if (keys.length > maxEntries) await cache.delete(keys[0]);
}

// ---- install / activate -----------------------------------------------------
self.addEventListener('install', () => {
    // оновлюємось за командою з UI (SKIP_WAITING), тут нічого не форсимо
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();

            // ❗ Чистимо лише СВОЇ версійні кеші і лише неактуальні версії.
            await Promise.all(
                keys.map((k) => {
                    const isOurCache =
                        k.startsWith('static-') || k.startsWith('runtime-') || k.startsWith('images-');

                    // якщо це наш кеш, але з іншою версією — видалити
                    if (isOurCache && !k.endsWith(CACHE_VERSION)) {
                        return caches.delete(k);
                    }

                    // не чіпаємо workbox-precache-* та інші системні кеші
                    return Promise.resolve(false);
                })
            );

            // optional: navigation preload
            if ('navigationPreload' in self.registration) {
                try {
                    await self.registration.navigationPreload.enable();
                } catch { }
            }

            await self.clients.claim();
        })()
    );
});

// ---- повідомлення з клієнта -------------------------------------------------
self.addEventListener('message', async (event) => {
    const type = event.data && event.data.type;

    if (type === 'GET_VERSION') {
        event.ports[0]?.postMessage({ ok: true, version: SW_VERSION });
        return;
    }

    if (type === 'SKIP_WAITING') {
        self.skipWaiting();
        return;
    }

    if (type === 'PURGE_RUNTIME') {
        const keys = await caches.keys();
        await Promise.all(
            keys
                .filter((k) => k.startsWith('runtime-') || k.startsWith('images-'))
                .map((k) => caches.delete(k))
        );
        event.ports[0]?.postMessage({ ok: true });
        return;
    }
});

// ---- НАВІГАЦІЯ (HTML) — офлайн fallback на precache’d index.html -----------
const navigationHandler = createHandlerBoundToURL('/index.html');

const navigationRoute = new NavigationRoute(navigationHandler, {
    // не чіпати API/статику/SW
    denylist: [/^\/api\//, /\/assets\//, /\/icons\//, /\/sw\.js$/],
});

registerRoute(navigationRoute);

// ---- fetch: політики для інших ресурсів ------------------------------------
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // ніколи не перехоплюємо власний SW
    if (url.pathname === '/sw.js') return;

    const { request } = event;

    // 1) /assets/* (хешовані js/css) → Cache First
    if (isHashedAsset(request)) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(STATIC_CACHE);
                const cached = await cache.match(request);
                if (cached) return cached;

                const network = await fetch(request);
                if (network.ok) cache.put(request, network.clone());
                return network;
            })()
        );
        return;
    }

    // 2) Зображення → Stale-While-Revalidate з лімітом
    if (isImage(request)) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(IMAGE_CACHE);
                const cached = await cache.match(request);

                const networkPromise = fetch(request)
                    .then((res) => {
                        if (res && res.ok) {
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

    // 3) API GET → Stale-While-Revalidate з лімітом
    if (isApiGet(request)) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(RUNTIME_CACHE);
                const cached = await cache.match(request);

                const networkPromise = fetch(request)
                    .then((res) => {
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

    // 4) Інше — просто мережа (навігацію вже покриває NavigationRoute)
});

