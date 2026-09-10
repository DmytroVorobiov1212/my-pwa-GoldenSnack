import { useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { getDeviceToken, useDevice } from '../device/DeviceContext';
import {
  saveCachedProductionCards,
  warmProductionImages,
} from './useProductionCards';

export function useWarmAssignedProductionCards(machineKeys) {
  const { forgetDevice } = useDevice();
  const machineSignature = (Array.isArray(machineKeys) ? machineKeys : []).join('|');

  const refreshAll = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    const token = getDeviceToken();
    if (!token) return;

    const keys = machineSignature ? machineSignature.split('|').filter(Boolean) : [];

    for (let index = 0; index < keys.length; index += 1) {
      const machineKey = keys[index];

      try {
        const response = await fetch(
          `${API_BASE_URL}/devices/production-cards/device/${encodeURIComponent(machineKey)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
            cache: 'no-store',
          },
        );

        if (response.status === 401) {
          forgetDevice();
          return;
        }

        if (!response.ok) continue;

        const result = await response.json();
        const cards = Array.isArray(result.data) ? result.data : [];

        // Butler/Velteko retain their bundled recovery catalog if the server
        // unexpectedly returns no cards. Mašek intentionally may be empty.
        if (!cards.length && machineKey !== 'masek') continue;

        saveCachedProductionCards(machineKey, cards);
        await warmProductionImages(machineKey, cards);
      } catch (error) {
        // One machine/network failure must not block the remaining machines.
      }
    }
  }, [forgetDevice, machineSignature]);

  useEffect(() => {
    const delayedWarm = window.setTimeout(refreshAll, 1800);
    const timer = window.setInterval(refreshAll, 60 * 1000);
    const onOnline = () => refreshAll();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshAll();
    };

    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearTimeout(delayedWarm);
      window.clearInterval(timer);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshAll]);
}
