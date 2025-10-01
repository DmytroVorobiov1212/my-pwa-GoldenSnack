// src/pwa/usePWAUpdatePrompt.js
import { useEffect, useRef } from "react";
import { showUpdateToast } from "../components/UpdateToast/UpdateToast";

export function usePWAUpdatePrompt() {
    const initOnce = useRef(false);

    useEffect(() => {
        if (initOnce.current) return;
        initOnce.current = true;
        if (!("serviceWorker" in navigator)) return;

        const askToUpdate = (reg) => {
            if (!reg.waiting) return; // ✅ гарантія, що є справжній апдейт
            showUpdateToast({
                onConfirm: () => {
                    reg.waiting.postMessage({ type: "SKIP_WAITING" }); // ✅ тільки в waiting
                    let reloaded = false;
                    navigator.serviceWorker.addEventListener("controllerchange", () => {
                        if (reloaded) return;
                        reloaded = true;
                        window.location.reload();
                    });
                },
            });
        };

        const onLoad = async () => {
            const reg = await navigator.serviceWorker.register("/service-worker.js");

            // 1) Якщо вже є waiting (зайшов після деплою) — покажемо одразу
            if (reg.waiting) askToUpdate(reg);

            // 2) В процесі встановлення — дочекаємось transition до waiting
            if (reg.installing) {
                reg.installing.addEventListener("statechange", () => {
                    if (reg.waiting) askToUpdate(reg);
                });
            }

            // 3) На майбутні оновлення
            reg.addEventListener("updatefound", () => {
                const installing = reg.installing;
                if (!installing) return;
                installing.addEventListener("statechange", () => {
                    if (reg.waiting) askToUpdate(reg);
                });
            });
        };

        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    }, []);
}
