import { Link } from 'react-router-dom';
import css from './MachineSelect.module.css';

const MachineSelect = () => {
  return (
    <section className={css.container}>
      <div className={css.topRow}>
        <Link to="/" className={css.backButton}>‹ Domů</Link>
        <span className={css.sectionLabel}>NASTAVENÍ BALIČKY</span>
      </div>

      <div className={css.heading}>
        <h1>Vyberte baličku</h1>
        <p>Po výběru se otevře konfigurátor konkrétního stroje.</p>
      </div>

      <div className={css.machineList}>
        <Link to="/butler" className={css.machineCard}>
          <span className={css.number}>01</span>
          <span className={css.machineText}>
            <strong>Butler</strong>
            <small>Konfigurace výrobku a parametrů</small>
          </span>
          <span className={css.arrow}>›</span>
        </Link>

        <Link to="/velteko" className={css.machineCard}>
          <span className={css.number}>02</span>
          <span className={css.machineText}>
            <strong>Velteko</strong>
            <small>Konfigurace výrobku a parametrů</small>
          </span>
          <span className={css.arrow}>›</span>
        </Link>

        <Link to="/masek" className={css.machineCard}>
          <span className={css.number}>03</span>
          <span className={css.machineText}>
            <strong>Mašek</strong>
            <small>Stroj je připraven v systému, parametry doplníme</small>
          </span>
          <span className={css.arrow}>›</span>
        </Link>
      </div>
    </section>
  );
};

export default MachineSelect;
