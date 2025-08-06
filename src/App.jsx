import { Routes, Route, NavLink } from 'react-router-dom';
import clsx from 'clsx';
import Home from './pages/Home/Home';
import Butler from './pages/Butler/Butler';
import Velteko from './pages/Velteko/Velteko';
import NotFound from './pages/NotFound/NotFound';
import css from './App.module.css';
import { Toaster, toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { toastOptions } from './utils/toastStyle';

const buildLinkClass = ({ isActive }) => {
  return clsx(css.link, isActive && css.active);
};

const App = () => {
  useEffect(() => {
    const handleOnline = () => toast.success('Připojení obnoveno');
    const handleOffline = () => toast.error('Jste nyní offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <nav className={css.nav}>
        <NavLink to="/" className={buildLinkClass}>
          Home
        </NavLink>
        <NavLink to="/butler" className={buildLinkClass}>
          Butler
        </NavLink>
        <NavLink to="/velteko" className={buildLinkClass}>
          Velteko
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/butler" element={<Butler />} />
        <Route path="/velteko" element={<Velteko />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster toastOptions={toastOptions} />
    </>
  );
};

export default App;
