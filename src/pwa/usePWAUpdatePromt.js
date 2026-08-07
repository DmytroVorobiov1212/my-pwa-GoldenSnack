import { useEffect } from 'react';

export function usePWAUpdatePrompt() {
    useEffect(() => {
        if (!import.meta.env.PROD) return undefined;
        if (!('serviceWorker' in navigator)) return undefined;

        let disposed = false;
        let reloading = false;
        let registration = null;

        const reloadForNewController = () => {
            if (disposed || reloading) return;
            reloading = true;
            window.location.reload();
        };

        const activateWaitingWorker = reg => {
            if (reg && reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
        };

        const watchInstallingWorker = reg => {
            if (!reg || !reg.installing) return;

            const worker = reg.installing;
            worker.addEventListener('statechange', () => {
                if (worker.state === 'installed') {
                    activateWaitingWorker(reg);
                }
            });
        };

        const registerAndUpdate = async () => {
            try {
                registration = await navigator.serviceWorker.register('/sw.js');
                if (disposed) return;

                activateWaitingWorker(registration);
                watchInstallingWorker(registration);

                registration.addEventListener('updatefound', () => {
                    watchInstallingWorker(registration);
                });

                try {
                    await registration.update();
                } catch (error) {
                    // A temporary network failure must not break the app.
                }
            } catch (error) {
                console.error('Service worker registration failed:', error);
            }
        };

        const onVisible = () => {
            if (document.visibilityState !== 'visible') return;
            if (!registration) return;

            registration.update().catch(() => undefined);
        };

        navigator.serviceWorker.addEventListener(
            'controllerchange',
            reloadForNewController,
        );
        document.addEventListener('visibilitychange', onVisible);

        if (document.readyState === 'complete') {
            registerAndUpdate();
        } else {
            window.addEventListener('load', registerAndUpdate, { once: true });
        }

        return () => {
            disposed = true;
            navigator.serviceWorker.removeEventListener(
                'controllerchange',
                reloadForNewController,
            );
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('load', registerAndUpdate);
        };
    }, []);
}
