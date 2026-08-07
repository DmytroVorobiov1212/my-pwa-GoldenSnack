import { Link } from 'react-router-dom';
import css from './Home.module.css';

const Home = () => {
  return (
    <section className={css.container}>
      <div className={css.hero}>
        <img src="/logo.png" alt="Golden Snack" className={css.logo} />
        <p className={css.eyebrow}>VÝROBNÍ TERMINÁL</p>
        <h1 className={css.title}>Co potřebujete udělat?</h1>
        <p className={css.subtitle}>
          Vyberte jednu z hlavních činností.
        </p>
      </div>

      <div className={css.actions}>
        <Link to="/balicka" className={css.actionCard}>
          <span className={css.icon} aria-hidden="true">⚙</span>
          <span className={css.actionText}>
            <strong>Nastavit baličku</strong>
            <small>Parametry pro Butler nebo Velteko</small>
          </span>
          <span className={css.arrow} aria-hidden="true">›</span>
        </Link>

        <Link to="/material" className={css.actionCard}>
          <span className={css.icon} aria-hidden="true">▣</span>
          <span className={css.actionText}>
            <strong>Objednat materiál</strong>
            <small>Požadavek na sklad</small>
          </span>
          <span className={css.arrow} aria-hidden="true">›</span>
        </Link>
      </div>

      <p className={css.hint}>Golden Snack · Výroba</p>
    </section>
  );
};

export default Home;
