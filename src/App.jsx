import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home/Home';
import MaterialOrder from './pages/MaterialOrder/MaterialOrder';
import ReportFault from './pages/ReportFault/ReportFault';
import PairDevice from './pages/PairDevice/PairDevice';
import MachineSelect from './pages/MachineSelect/MachineSelect';
import Butler from './pages/Butler/Butler';
import Velteko from './pages/Velteko/Velteko';
import Masek from './pages/Masek/Masek';
import NotFound from './pages/NotFound/NotFound';
import css from './App.module.css';
import { Toaster, toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { toastOptions } from './utils/toastStyle';
import { usePWAUpdatePrompt } from './pwa/usePWAUpdatePromt';
import { useDevice } from './device/DeviceContext';
import { useOfflineQueueSync } from './offline/useOfflineQueueSync';
import { getDeviceMachineKeys, getMachineName, MACHINE_ROUTES } from './production/machines';
import { useWarmAssignedProductionCards } from './production/useWarmAssignedProductionCards';

const BRAND_MARK = '/icons/icon-192x192.png';

const App = () => {
  const location = useLocation();
  const { device, isChecking, forgetDevice } = useDevice();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const offlineQueue = useOfflineQueueSync(device, forgetDevice);
  const machineKeys = getDeviceMachineKeys(device);

  useWarmAssignedProductionCards(machineKeys);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Připojení obnoveno');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Jste nyní offline');
    };

    if (!navigator.onLine) toast.error('Jste offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  usePWAUpdatePrompt();

  if (isChecking && !device) {
    return (
      <main className={css.loadingScreen}>
        <img src={BRAND_MARK} alt="Golden Snack" className={css.loadingLogo} />
        <p>Ověřuji výrobní terminál...</p>
      </main>
    );
  }

  if (!device) return <PairDevice />;

  const singleMachineKey = machineKeys.length === 1 ? machineKeys[0] : '';
  const machineRoute = singleMachineKey ? MACHINE_ROUTES[singleMachineKey] : '/balicka';
  const machineStatusLabel = singleMachineKey
    ? getMachineName(singleMachineKey).toUpperCase()
    : `${machineKeys.length} BALIČKY`;
  const machineSectionActive = ['/balicka', '/butler', '/velteko', '/masek'].includes(location.pathname);
  const canUseMachine = (machineKey) => machineKeys.includes(machineKey);

  const renderLink = (to, label, forceActive = false) => (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `${css.link} ${isActive || forceActive ? css.active : ''}`.trim()
      }
    >
      {label}
    </NavLink>
  );

  return (
    <div className={css.appShell}>
      <a href="#main" className={css.skip}>Přeskočit na obsah</a>

      <header className={css.header}>
        <div className={css.topBar}>
          <div className={css.brand}>
            <div className={css.logoBox}>
              <img src={BRAND_MARK} alt="GS" className={css.brandLogo} />
            </div>
            <div className={css.brandCopy}>
              <strong className={css.brandTitle}>Golden Snack</strong>
              <span className={css.terminalLabel}>VÝROBNÍ TERMINÁL</span>
            </div>
          </div>

          <div className={css.machineStatus}>
            <strong>{machineStatusLabel}</strong>
            <span className={isOnline ? css.online : css.offline}>
              <i aria-hidden="true" />
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {offlineQueue.total > 0 && (
              <span className={offlineQueue.blocked > 0 ? css.queueError : css.queuePending}>
                {offlineQueue.blocked > 0
                  ? `Nevyřízeno: ${offlineQueue.blocked}`
                  : `Čeká na odeslání: ${offlineQueue.pending}`}
              </span>
            )}
          </div>
        </div>

        <nav className={css.nav} aria-label="Hlavní navigace">
          {renderLink('/', 'Domů')}
          {renderLink('/balicka', 'Balička', machineSectionActive)}
          {renderLink('/material', 'Materiál')}
        </nav>
      </header>

      <main id="main" className={css.main}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/balicka"
            element={singleMachineKey ? <Navigate to={machineRoute} replace /> : <MachineSelect />}
          />
          <Route path="/material" element={<MaterialOrder />} />
          <Route path="/porucha" element={<ReportFault />} />
          <Route
            path="/butler"
            element={canUseMachine('butler') ? <Butler /> : <Navigate to="/balicka" replace />}
          />
          <Route
            path="/velteko"
            element={canUseMachine('velteko') ? <Velteko /> : <Navigate to="/balicka" replace />}
          />
          <Route
            path="/masek"
            element={canUseMachine('masek') ? <Masek /> : <Navigate to="/balicka" replace />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Toaster toastOptions={toastOptions} />
    </div>
  );
};

export default App;
