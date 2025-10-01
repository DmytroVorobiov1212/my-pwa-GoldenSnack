import { useEffect } from "react";
import { showUpdateToast } from "../components/UpdateToast/UpdateToast";

export function usePWAUpdatePrompt() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        let shown = false; // запобіжник від повторів у межах сесії

        const askToUpdate = (reg) => {
            if (shown) return;
            if (!reg.waiting) return; // показуємо тост тільки коли реально є waiting
            shown = true;

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
                    navigator.serviceWorker.addEventListener("controllerchange", onCtrlChange);
                },
            });
        };

        const onLoad = async () => {
            const reg = await navigator.serviceWorker.register("/service-worker.js");

            if (reg.waiting) askToUpdate(reg);

            reg.installing?.addEventListener("statechange", () => {
                if (reg.waiting) askToUpdate(reg);
            });

            reg.addEventListener("updatefound", () => {
                reg.installing?.addEventListener("statechange", () => {
                    if (reg.waiting) askToUpdate(reg);
                });
            });
        };

        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    }, []);
}
