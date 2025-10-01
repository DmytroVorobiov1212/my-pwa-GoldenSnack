// src/pwa/usePWAUpdatePrompt.js
import { useEffect } from "react";
import { showUpdateToast } from "../components/UpdateToast/UpdateToast";

export function usePWAUpdatePrompt() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        let shown = false; // локальний запобіжник на час життя сторінки

        const askToUpdate = (reg) => {
            if (shown) return;
            if (!reg.waiting) return;   // ✅ показуємо тільки коли справді є waiting
            shown = true;

            showUpdateToast({
                onConfirm: () => {
                    reg.waiting.postMessage({ type: "SKIP_WAITING" });
                    // Перезавантажимося лише коли контролер змінився
                    let reloaded = false;
                    const onCtrlChange = () => {
                        if (reloaded) return;
                        reloaded = true;
                        navigator.serviceWorker.removeEventListener("controllerchange", onCtrlChange);
                        window.location.reload();
                    };
                    navigator.serviceWorker.addEventListener("controllerchange", onCtrlChange);
                },
            });
        };

        const onLoad = async () => {
            const reg = await navigator.serviceWorker.register("/service-worker.js");

            // 1) Якщо оновлення вже чекає
            if (reg.waiting) askToUpdate(reg);

            // 2) Якщо щойно ставиться — дочекаймося переходу в waiting
            reg.installing?.addEventListener("statechange", () => askToUpdate(reg));

            // 3) На майбутні апдейти
            reg.addEventListener("updatefound", () => {
                reg.installing?.addEventListener("statechange", () => askToUpdate(reg));
            });
        };

        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    }, []);
}
