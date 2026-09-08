import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { getDeviceToken, useDevice } from '../device/DeviceContext';

function readCachedCards(machineKey) {
  try {
    const raw = localStorage.getItem(`gs_production_cards_${machineKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch (error) {
    return null;
  }
}

function saveCachedCards(machineKey, cards) {
  try {
    localStorage.setItem(`gs_production_cards_${machineKey}`, JSON.stringify(cards));
  } catch (error) {
    // Storage is a convenience cache. The static fallback remains available.
  }
}

export function useProductionCards(machineKey, fallbackData) {
  const { forgetDevice } = useDevice();
  const cached = readCachedCards(machineKey);
  const [cards, setCards] = useState(cached || fallbackData || []);
  const [source, setSource] = useState(cached ? 'cache' : 'static');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const refresh = useCallback(async () => {
    const token = getDeviceToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/devices/production-cards/device`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (response.status === 401) {
        forgetDevice();
        return;
      }

      if (!response.ok) return;

      const result = await response.json();
      const nextCards = Array.isArray(result.data) ? result.data : [];

      // During migration an empty database must never blank a production tablet.
      if (!nextCards.length) return;

      setCards(nextCards);
      setSource('server');
      setLastUpdatedAt(new Date());
      saveCachedCards(machineKey, nextCards);
    } catch (error) {
      // Offline/network failure: keep the last known good cards already in state.
    }
  }, [forgetDevice, machineKey]);

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

  return {
    cards,
    source,
    lastUpdatedAt,
    refresh,
  };
}
