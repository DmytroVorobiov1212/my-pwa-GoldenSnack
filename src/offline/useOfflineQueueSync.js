import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getDeviceToken } from '../device/DeviceContext';
import {
  flushOfflineQueue,
  getOfflineQueueSummary,
  OFFLINE_QUEUE_EVENT,
} from './offlineQueue';

export function useOfflineQueueSync(device, forgetDevice) {
  const deviceId = device ? device.id : '';
  const [summary, setSummary] = useState(() => getOfflineQueueSummary(deviceId));
  const syncingRef = useRef(false);
  const lastBlockedRef = useRef(summary.blocked);

  const refreshSummary = useCallback(() => {
    const next = getOfflineQueueSummary(deviceId);
    setSummary(next);

    if (next.blocked > lastBlockedRef.current) {
      toast.error('Některý offline požadavek vyžaduje kontrolu administrátora.');
    }

    lastBlockedRef.current = next.blocked;
    return next;
  }, [deviceId]);

  const sync = useCallback(async () => {
    if (!deviceId || syncingRef.current) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    const token = getDeviceToken();
    if (!token) return;

    syncingRef.current = true;

    try {
      const result = await flushOfflineQueue({ token, deviceId });

      if (result.unauthorized) {
        forgetDevice();
        return;
      }

      if (result.sent > 0) {
        toast.success(
          result.sent === 1
            ? 'Offline požadavek byl automaticky odeslán.'
            : `${result.sent} offline požadavky byly automaticky odeslány.`,
        );
      }

      refreshSummary();
    } finally {
      syncingRef.current = false;
    }
  }, [deviceId, forgetDevice, refreshSummary]);

  useEffect(() => {
    refreshSummary();
    sync();

    const handleQueueChange = () => refreshSummary();
    const handleOnline = () => sync();
    const handleVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };

    window.addEventListener(OFFLINE_QUEUE_EVENT, handleQueueChange);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisible);

    const timer = window.setInterval(sync, 30 * 1000);

    return () => {
      window.removeEventListener(OFFLINE_QUEUE_EVENT, handleQueueChange);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisible);
      window.clearInterval(timer);
    };
  }, [refreshSummary, sync]);

  return summary;
}
