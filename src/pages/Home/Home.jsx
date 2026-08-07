import { Link } from 'react-router-dom';
import { useDevice } from '../../device/DeviceContext';
import css from './Home.module.css';

const Home = () => {
  const { device } = useDevice();
  return (
    <section className={css.container}>
      <div className={css.hero}>
        <img src="/gs-mark.svg" alt="Golden Snack" className={css.logo} />
        <div>
          <p className={css.eyebrow}>VÝROBNÍ TERMINÁL · {device.machineName.toUpperCase()}</p>
          <h1 className={css.title}>Co potřebujete udělat?</h1>
          <p className={css.subtitle}>Terminál je přiřazen k baličce <strong>{device.machineName}</strong>.</p>
        </div>
      </div>
      <div className={css.actions}>
        <Link to="/balicka" className={css.actionCard}>
          <span className={css.icon} aria-hidden="true">⚙</span>
          <span className={css.actionText}><strong>Nastavit baličku</strong><small>Otevřít konfiguraci {device.machineName}</small></span>
          <span className={css.arrow} aria-hidden="true">›</span>
        </Link>
        <Link to="/material" className={css.actionCard}>
          <span className={css.icon} aria-hidden="true">▣</span>
          <span className={css.actionText}><strong>Objednat materiál</strong><small>Požadavek ze stroje {device.machineName}</small></span>
          <span className={css.arrow} aria-hidden="true">›</span>
        </Link>
      </div>
      <p className={css.hint}>{device.name} · Golden Snack Výroba</p>
    </section>
  );
};
export default Home;
