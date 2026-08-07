import { Link } from 'react-router-dom';
import css from './MaterialOrder.module.css';

const MaterialOrder = () => {
  return (
    <section className={css.container}>
      <div className={css.topRow}>
        <Link to="/" className={css.backButton}>‹ Domů</Link>
        <span className={css.sectionLabel}>SKLAD</span>
      </div>

      <div className={css.card}>
        <div className={css.icon} aria-hidden="true">▣</div>
        <h1>Objednat materiál</h1>
        <p>
          Sem připojíme stávající objednávkový systém skladu. Přihlášení PINem,
          katalog, odeslání žádosti a Telegram zůstanou zachované.
        </p>

        <div className={css.statusBox}>
          <strong>V1 terminálu</strong>
          <span>Shell je připraven. Další krok: připojit objednávkový modul.</span>
        </div>
      </div>
    </section>
  );
};

export default MaterialOrder;
