// src/pwa/usePWAUpdatePrompt.js
import { useEffect } from "react";
import { showUpdateToast } from "../components/UpdateToast/UpdateToast";

// модульний (файловий) прапорець, щоб не показувати двічі за сесію
let shownOnce = false;

export function usePWAUpdatePrompt() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        // якщо щойно оновились — пропускаємо один цикл перевірок
        let suppressOnce = false;
        try {
            if (sessionStorage.getItem('pwaJustUpdated') === '1') {
                suppressOnce = true;
                sessionStorage.removeItem('pwaJustUpdated');
            }
        } catch { }

        const askToUpdate = (reg) => {
            if (shownOnce) return;
            if (suppressOnce) return;      // ⬅️ пропускаємо одразу після reload
            if (!reg.waiting) return;

            shownOnce = true;
            showUpdateToast({
                onConfirm: () => {
                    reg.waiting.postMessage({ type: "SKIP_WAITING" });

                    let reloaded = false;
                    const onCtrlChange = () => {
                        if (reloaded) return;
                        reloaded = true;
                        navigator.serviceWorker.removeEventListener("controllerchange", onCtrlChange);
                        window.location.reload();
                    };
                    navigator.serviceWorker.addEventListener("controllerchange", onCtrlChange, { once: true });
                },
            });
        };

        const onLoad = async () => {
            const reg = await navigator.serviceWorker.register("/service-worker.js");

            // одразу перевіримо апдейти, але з урахуванням suppressOnce
            if (reg.waiting) askToUpdate(reg);

            // якщо є installing — дочекаємось поки стане waiting
            reg.installing?.addEventListener("statechange", () => askToUpdate(reg));

            // майбутні оновлення
            reg.addEventListener("updatefound", () => {
                reg.installing?.addEventListener("statechange", () => askToUpdate(reg));
            });

            // додатково: коли вкладка повертається у фокус — перевірити апдейти
            const onVisible = async () => {
                if (document.visibilityState === 'visible') {
                    const r = await navigator.serviceWorker.getRegistration();
                    r?.update();
                }
            };
            document.addEventListener('visibilitychange', onVisible);
        };

        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    }, []);
}
