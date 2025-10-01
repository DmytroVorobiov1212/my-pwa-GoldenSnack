// src/pwa/usePWAUpdatePrompt.js
import { useEffect } from "react";
import { showUpdateToast } from "../components/UpdateToast/UpdateToast";

function askVersion(target) {
    return new Promise((resolve) => {
        const ch = new MessageChannel();
        const timer = setTimeout(() => resolve(null), 800);
        ch.port1.onmessage = (e) => { clearTimeout(timer); resolve(e.data?.version ?? null); };
        try { target.postMessage({ type: "GET_VERSION" }, [ch.port2]); } catch { resolve(null); }
    });
}

export function usePWAUpdatePrompt() {
    useEffect(() => {
        // ⬅️ SW тільки у продакшені
        if (!import.meta.env.PROD) return;
        if (!("serviceWorker" in navigator)) return;

        let shownOnce = false;

        const shouldShowUpdateToast = async (reg) => {
            if (shownOnce || !reg.waiting) return false;

            const controller = navigator.serviceWorker.controller;
            const activeVersion = controller ? await askVersion(controller) : null;
            const waitingVersion = await askVersion(reg.waiting);

            // якщо версії однакові — фантом, не показуємо
            if (activeVersion && waitingVersion && waitingVersion === activeVersion) return false;

            // коротка пауза на випадок переходу waiting -> redundant
            await new Promise((r) => setTimeout(r, 200));
            if (!reg.waiting) return false;

            // анти-флеш одразу після реального оновлення
            try {
                if (sessionStorage.getItem("pwaJustUpdated") === "1") {
                    sessionStorage.removeItem("pwaJustUpdated");
                    return false;
                }
            } catch { }

            return true;
        };

        const showToastIfRealUpdate = async (reg) => {
            if (!(await shouldShowUpdateToast(reg))) return;
            shownOnce = true;

            showUpdateToast({
                onConfirm: () => {
                    try { sessionStorage.setItem("pwaJustUpdated", "1"); } catch { }
                    reg.waiting.postMessage({ type: "SKIP_WAITING" });
                    const onCtrlChange = () => {
                        navigator.serviceWorker.removeEventListener("controllerchange", onCtrlChange);
                        window.location.reload();
                    };
                    navigator.serviceWorker.addEventListener("controllerchange", onCtrlChange, { once: true });
                },
            });
        };

        const onLoad = async () => {
            const reg = await navigator.serviceWorker.register("/sw.js");

            if (reg.waiting) await showToastIfRealUpdate(reg);

            reg.installing?.addEventListener("statechange", () => {
                if (reg.waiting) showToastIfRealUpdate(reg);
            });

            reg.addEventListener("updatefound", () => {
                reg.installing?.addEventListener("statechange", () => {
                    if (reg.waiting) showToastIfRealUpdate(reg);
                });
            });

            // коли вкладка повертається — перевірити апдейти
            const onVisible = async () => {
                if (document.visibilityState === "visible") {
                    const r = await navigator.serviceWorker.getRegistration();
                    r?.update();
                }
            };
            document.addEventListener("visibilitychange", onVisible);
        };

        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    }, []);
}
