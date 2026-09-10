import { Link } from 'react-router-dom';
import { useDevice } from '../../device/DeviceContext';
import { getDeviceMachineKeys, getMachineName, MACHINE_ROUTES } from '../../production/machines';
import css from './MachineSelect.module.css';

const MachineSelect = () => {
  const { device } = useDevice();
  const machineKeys = getDeviceMachineKeys(device);

  return (
    <section className={css.container}>
      <div className={css.topRow}>
        <Link to="/" className={css.backButton}>‹ Domů</Link>
        <span className={css.sectionLabel}>NASTAVENÍ BALIČKY</span>
      </div>

      <div className={css.heading}>
        <h1>Vyberte baličku</h1>
        <p>Terminál <strong>{device.name}</strong> může pracovat s více baličkami.</p>
      </div>

      <div className={css.machineList}>
        {machineKeys.map((machineKey, index) => (
          <Link
            key={machineKey}
            to={MACHINE_ROUTES[machineKey]}
            className={css.machineCard}
          >
            <span className={css.number}>{String(index + 1).padStart(2, '0')}</span>
            <span className={css.machineText}>
              <strong>{getMachineName(machineKey)}</strong>
              <small>Výrobní karty a parametry stroje</small>
            </span>
            <span className={css.arrow}>›</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default MachineSelect;
