import { Link } from 'react-router-dom';
import { FaGear, FaCartShopping, FaScrewdriverWrench } from 'react-icons/fa6';
import { useDevice } from '../../device/DeviceContext';
import css from './Home.module.css';

const Home = () => {
  const { device } = useDevice();

  return (
    <section className={css.container}>
      <header className={css.hero}>
        <p className={css.eyebrow}>VÝROBNÍ TERMINÁL</p>
        <h1 className={css.title}>Co potřebujete udělat?</h1>
        <p className={css.subtitle}>
          Terminál <strong>{device.name}</strong> je připraven pro baličku <strong>{device.machineName}</strong>.
        </p>
      </header>

      <div className={css.actions}>
        <Link to="/balicka" className={`${css.actionCard} ${css.primary}`}>
          <span className={css.icon} aria-hidden="true"><FaGear /></span>
          <span className={css.actionText}>
            <strong>Nastavit baličku</strong>
            <small>Parametry produktu a stroje</small>
          </span>
          <span className={css.arrow} aria-hidden="true">›</span>
        </Link>

        <Link to="/material" className={css.actionCard}>
          <span className={`${css.icon} ${css.darkIcon}`} aria-hidden="true"><FaCartShopping /></span>
          <span className={css.actionText}>
            <strong>Objednat materiál</strong>
            <small>Požadavek pro sklad ze stroje {device.machineName}</small>
          </span>
          <span className={css.arrow} aria-hidden="true">›</span>
        </Link>

        <Link to="/porucha" className={`${css.actionCard} ${css.faultCard}`}>
          <span className={`${css.icon} ${css.faultIcon}`} aria-hidden="true"><FaScrewdriverWrench /></span>
          <span className={css.actionText}>
            <strong>Nahlásit poruchu</strong>
            <small>Rychlé hlášení vedoucímu výroby</small>
          </span>
          <span className={css.arrow} aria-hidden="true">›</span>
        </Link>
      </div>

      <div className={css.footerLine}>
        <span className={css.statusDot} />
        {device.machineName} · Golden Snack Výroba
      </div>
    </section>
  );
};

export default Home;
