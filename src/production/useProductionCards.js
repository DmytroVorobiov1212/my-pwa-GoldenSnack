import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { getDeviceToken, useDevice } from '../device/DeviceContext';

function readCachedCards(machineKey) {
  try {
    const raw = localStorage.getItem(`gs_production_cards_${machineKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

export function saveCachedProductionCards(machineKey, cards) {
  try {
    localStorage.setItem(`gs_production_cards_${machineKey}`, JSON.stringify(cards));
  } catch (error) {
    // Storage is a convenience cache. The static fallback remains available.
  }
}

function collectImagePaths(cards) {
  const seen = {};
  const paths = [];

  (Array.isArray(cards) ? cards : []).forEach((group) => {
    const variants = group && Array.isArray(group.variants) ? group.variants : [];

    variants.forEach((variant) => {
      const image = variant && variant.image ? String(variant.image).trim() : '';
      if (!image || image.toLowerCase().indexOf('not-img') !== -1) return;
      if (seen[image]) return;
      seen[image] = true;
      paths.push(image);
    });
  });

  return paths.sort();
}

export async function warmProductionImages(machineKey, cards) {
  if (typeof navigator === 'undefined' || navigator.onLine === false) return;
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

  const paths = collectImagePaths(cards);
  if (!paths.length) return;

  const signatureKey = `gs_production_image_signature_${machineKey}`;
  const signature = paths.join('|');

  try {
    if (localStorage.getItem(signatureKey) === signature) return;
  } catch (error) {
    // Continue without the optimization if storage is unavailable.
  }

  for (let index = 0; index < paths.length; index += 1) {
    try {
      await fetch(paths[index], { credentials: 'same-origin' });
    } catch (error) {
      // One unavailable image must not stop the rest of the offline warm-up.
    }
  }

  try {
    localStorage.setItem(signatureKey, signature);
  } catch (error) {
    // Images are already cached; the signature is only an optimization.
  }
}

export function useProductionCards(machineKey, fallbackData, options = {}) {
  const { forgetDevice } = useDevice();
  const allowEmptyServer = Boolean(options.allowEmptyServer);
  const cached = readCachedCards(machineKey);
  const hasCachedCards = Array.isArray(cached) && cached.length > 0;
  const [cards, setCards] = useState(hasCachedCards ? cached : fallbackData || []);
  const [source, setSource] = useState(hasCachedCards ? 'cache' : 'static');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const refresh = useCallback(async () => {
    const token = getDeviceToken();
    if (!token) return;

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

      if (!response.ok) return;

      const result = await response.json();
      const nextCards = Array.isArray(result.data) ? result.data : [];

      // Keep the static Butler/Velteko catalog only as a recovery fallback.
      // Mašek has no legacy catalog, so an empty server response is authoritative.
      if (!nextCards.length && !allowEmptyServer) return;

      setCards(nextCards);
      setSource('server');
      setLastUpdatedAt(new Date());
      saveCachedProductionCards(machineKey, nextCards);
    } catch (error) {
      // Offline/network failure: keep the last known good cards already in state.
    }
  }, [allowEmptyServer, forgetDevice, machineKey]);

  useEffect(() => {
    refresh();

    const timer = window.setInterval(refresh, 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    const warm = () => warmProductionImages(machineKey, cards);
    const timer = window.setTimeout(warm, 1500);
    const serviceWorker = 'serviceWorker' in navigator ? navigator.serviceWorker : null;

    if (serviceWorker) {
      serviceWorker.addEventListener('controllerchange', warm);
    }

    return () => {
      window.clearTimeout(timer);
      if (serviceWorker) serviceWorker.removeEventListener('controllerchange', warm);
    };
  }, [cards, machineKey]);

  return {
    cards,
    source,
    lastUpdatedAt,
    refresh,
  };
}
