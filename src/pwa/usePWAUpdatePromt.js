// src/pwa/usePWAUpdatePrompt.js
import { useEffect, useRef } from "react";
// import { showUpdateToast } from "../components/UpdateToast";
import { showUpdateToast } from "../components/UpdateToast/UpdateToast";

export function usePWAUpdatePrompt() {
    const initOnce = useRef(false);

    useEffect(() => {
        if (initOnce.current) return;
        initOnce.current = true;

        if (!("serviceWorker" in navigator)) return;

        const onLoad = () => {
            navigator.serviceWorker
                .register("/service-worker.js")
                .then((reg) => {
                    reg.addEventListener("updatefound", () => {
                        const newWorker = reg.installing;
                        if (!newWorker) return;

                        newWorker.addEventListener("statechange", () => {
                            const isInstalled = newWorker.state === "installed";
                            const hasActiveController = Boolean(navigator.serviceWorker.controller);

                            if (isInstalled && hasActiveController) {
                                // показуємо тост з кнопкою «Оновити»
                                showUpdateToast({
                                    onConfirm: () => {
                                        const waitingSW = reg.waiting || newWorker;
                                        waitingSW?.postMessage({ type: "SKIP_WAITING" });

                                        let reloaded = false;
                                        navigator.serviceWorker.addEventListener("controllerchange", () => {
                                            if (reloaded) return;
                                            reloaded = true;
                                            window.location.reload();
                                        });
                                    },
                                });
                            }
                        });
                    });
                })
                .catch((err) => {
                    // опційно: ваш логер
                    console.error("SW registration failed:", err);
                });
        };

        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    }, []);
}
