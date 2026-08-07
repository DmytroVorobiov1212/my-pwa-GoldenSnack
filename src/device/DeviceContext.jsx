import { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'gs_production_device_token';
const DEVICE_KEY = 'gs_production_device';

const DeviceContext = createContext(null);

function readCachedDevice() {
  try {
    const raw = localStorage.getItem(DEVICE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDevice(device) {
  localStorage.setItem(DEVICE_KEY, JSON.stringify(device));
}

function clearDeviceStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(DEVICE_KEY);
}

export function DeviceProvider({ children }) {
  const [device, setDevice] = useState(() => readCachedDevice());
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState('');

  const verifyDevice = async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setDevice(null);
      setIsChecking(false);
      return;
    }

    try {
      setError('');

      const response = await fetch(`${API_BASE_URL}/devices/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          clearDeviceStorage();
          setDevice(null);
        }

        throw new Error(result.message || 'Zařízení se nepodařilo ověřit');
      }

      setDevice(result.data);
      saveDevice(result.data);
    } catch (requestError) {
      setError(requestError.message || 'Zařízení se nepodařilo ověřit');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    verifyDevice();
  }, []);

  const pairDevice = async (pairingCode) => {
    const response = await fetch(`${API_BASE_URL}/devices/pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pairingCode }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Zařízení se nepodařilo spárovat');
    }

    localStorage.setItem(TOKEN_KEY, result.data.token);
    saveDevice(result.data.device);
    setDevice(result.data.device);
    setError('');

    return result.data.device;
  };

  const forgetDevice = () => {
    clearDeviceStorage();
    setDevice(null);
    setError('');
  };

  return (
    <DeviceContext.Provider
      value={{
        device,
        isChecking,
        error,
        pairDevice,
        verifyDevice,
        forgetDevice,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);

  if (!context) {
    throw new Error('useDevice must be used inside DeviceProvider');
  }

  return context;
}

export function getDeviceToken() {
  return localStorage.getItem(TOKEN_KEY);
}
