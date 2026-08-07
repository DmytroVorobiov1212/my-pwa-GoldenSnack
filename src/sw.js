/* eslint-disable no-undef */
import {
    cleanupOutdatedCaches,
    precacheAndRoute,
    createHandlerBoundToURL,
} from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

const SW_VERSION = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';
const CACHE_VERSION = String(SW_VERSION);
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

const RUNTIME_MAX_ENTRIES = 80;
const IMAGES_MAX_ENTRIES = 120;

const sameOrigin = url =>
    new URL(url, self.location.href).origin === self.location.origin;

const isHashedAsset = request => {
    const url = new URL(request.url);
    return (
        sameOrigin(url) &&
        url.pathname.startsWith('/assets/') &&
        (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))
    );
};

const isImage = request => {
    if (request.destination === 'image') return true;
    const url = new URL(request.url);
    return /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname);
};

const isApiGet = request =>
    request.method === 'GET' &&
    Boolean(request.headers.get('accept')) &&
    request.headers.get('accept').indexOf('application/json') !== -1;

async function putWithLimit(cacheName, request, response, maxEntries) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    const keys = await cache.keys();
    if (keys.length > maxEntries) await cache.delete(keys[0]);
}

self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();

            await Promise.all(
                keys.map(key => {
                    const isOurRuntimeCache =
                        key.startsWith('static-') ||
                        key.startsWith('runtime-') ||
                        key.startsWith('images-');

                    if (isOurRuntimeCache && !key.endsWith(CACHE_VERSION)) {
                        return caches.delete(key);
                    }

                    return Promise.resolve(false);
                })
            );

            if ('navigationPreload' in self.registration) {
                try {
                    await self.registration.navigationPreload.disable();
                } catch (error) {
                    // Navigation preload is optional.
                }
            }

            await self.clients.claim();
        })()
    );
});

self.addEventListener('message', async event => {
    const type = event.data && event.data.type;

    if (type === 'GET_VERSION') {
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ ok: true, version: SW_VERSION });
        }
        return;
    }

    if (type === 'SKIP_WAITING') {
        await self.skipWaiting();
        return;
    }

    if (type === 'PURGE_RUNTIME') {
        const keys = await caches.keys();
        await Promise.all(
            keys
                .filter(key =>
                    key.startsWith('runtime-') || key.startsWith('images-')
                )
                .map(key => caches.delete(key))
        );

        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ ok: true });
        }
    }
});

const navigationHandler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(navigationHandler, {
    denylist: [/^\/api\//, /\/assets\//, /\/icons\//, /\/sw\.js$/],
});
registerRoute(navigationRoute);

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.pathname === '/sw.js') return;

    const request = event.request;

    if (isHashedAsset(request)) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(STATIC_CACHE);
                const cached = await cache.match(request);
                if (cached) return cached;

                const network = await fetch(request);
                if (network.ok) await cache.put(request, network.clone());
                return network;
            })()
        );
        return;
    }

    if (isImage(request)) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(IMAGE_CACHE);
                const cached = await cache.match(request);

                const networkPromise = fetch(request)
                    .then(response => {
                        if (response && response.ok) {
                            putWithLimit(
                                IMAGE_CACHE,
                                request,
                                response.clone(),
                                IMAGES_MAX_ENTRIES
                            );
                        }
                        return response;
                    })
                    .catch(() => cached);

                return cached || networkPromise;
            })()
        );
        return;
    }

    if (isApiGet(request)) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(RUNTIME_CACHE);
                const cached = await cache.match(request);

                const networkPromise = fetch(request)
                    .then(response => {
                        if (response && response.ok) {
                            putWithLimit(
                                RUNTIME_CACHE,
                                request,
                                response.clone(),
                                RUNTIME_MAX_ENTRIES
                            );
                        }
                        return response;
                    })
                    .catch(() => cached);

                return cached || networkPromise;
            })()
        );
    }
});
