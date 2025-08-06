import { Routes, Route, NavLink } from 'react-router-dom';
import clsx from 'clsx';
import Home from './pages/Home/Home';
import Butler from './pages/Butler/Butler';
import Velteko from './pages/Velteko/Velteko';
import NotFound from './pages/NotFound/NotFound';
import css from './App.module.css';

const buildLinkClass = ({ isActive }) => {
  return clsx(css.link, isActive && css.active);
};

const App = () => {
  return (
    <div>
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
    </div>
  );
};

export default App;
