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
import Footer from './components/Footer/Footer';
// import { FaCircle } from 'react-icons/fa';

// const buildLinkClass = ({ isActive }) => {
//   return clsx(css.link, isActive && css.active);
// };

const App = () => {
  useEffect(() => {
    if (!navigator.onLine) {
      toast.error('Jste offline');
    }
    const handleOnline = () => toast.success('Připojení obnoveno');
    const handleOffline = () => toast.error('Jste nyní offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const renderLink = (to, label) => (
    <NavLink
      to={to}
      className={({ isActive }) => clsx(css.link, isActive && css.active)}
    >
      {({ isActive }) => (
        <>
          <span>{label}</span>
          {/* {isActive && <FaCircle className={css.activeIcon} size={8} />} */}
        </>
      )}
    </NavLink>
  );

  return (
    <>
      <a href="#main" className={css.skip}>
        Skip to content
      </a>

      <header className={css.header}>
        <nav className={css.nav} aria-label="Primary">
          {renderLink('/', 'Home')}
          {renderLink('/butler', 'Butler')}
          {renderLink('/velteko', 'Velteko')}
        </nav>
      </header>

      <main id="main" className={css.main}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/butler" element={<Butler />} />
          <Route path="/velteko" element={<Velteko />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
      <Toaster toastOptions={toastOptions} />
    </>
  );
};

export default App;
