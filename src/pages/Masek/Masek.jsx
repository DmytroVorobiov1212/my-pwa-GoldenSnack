import { Link } from 'react-router-dom';
import css from './Masek.module.css';

const Masek = () => {
  return (
    <section className={css.container}>
      <div className={css.topRow}>
        <Link to="/balicka" className={css.backButton}>‹ Baličky</Link>
        <span className={css.sectionLabel}>MAŠEK</span>
      </div>

      <div className={css.card}>
        <div className={css.badge}>03</div>
        <h1>Mašek</h1>
        <p>
          Balička je už součástí výrobního terminálu. Konkrétní parametry a
          výrobky doplníme podle skutečného nastavení stroje.
        </p>

        <div className={css.statusBox}>
          <strong>Konfigurátor připraven k doplnění</strong>
          <span>Nebudeme zadávat žádné hodnoty bez ověření na stroji.</span>
        </div>
      </div>
    </section>
  );
};

export default Masek;
