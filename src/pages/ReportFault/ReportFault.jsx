import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { getDeviceToken, useDevice } from '../../device/DeviceContext';
import { submitOrQueue } from '../../offline/offlineQueue';
import { getDeviceMachineKeys, getMachineName } from '../../production/machines';
import css from './ReportFault.module.css';

const FAULTS = [
  ['packer', 'Balička'],
  ['scale', 'Váha'],
  ['xray', 'Rentgen'],
  ['conveyor', 'Dopravník'],
  ['printer', 'Tiskárna / datum'],
  ['other', 'Jiné'],
];

const ReportFault = () => {
  const { device, forgetDevice } = useDevice();
  const navigate = useNavigate();
  const machineKeys = getDeviceMachineKeys(device);
  const [selectedMachineKey, setSelectedMachineKey] = useState('');
  const machineKey = machineKeys.length === 1
    ? machineKeys[0]
    : machineKeys.includes(selectedMachineKey)
      ? selectedMachineKey
      : '';
  const [faultType, setFaultType] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!machineKey) {
      setError('Vyberte baličku, na které je porucha.');
      return;
    }

    if (!faultType) {
      setError('Vyberte, kde je problém.');
      return;
    }

    const token = getDeviceToken();

    if (!token) {
      forgetDevice();
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const result = await submitOrQueue({
        type: 'fault',
        endpoint: `${API_BASE_URL}/device-orders/fault`,
        body: {
          machineKey,
          faultType,
          note: note.trim(),
        },
        deviceId: device.id,
        token,
      });

      if (result.status === 'unauthorized') {
        forgetDevice();
        return;
      }

      if (result.status === 'error') {
        setError(result.message || 'Poruchu se nepodařilo nahlásit.');
        return;
      }

      if (result.status === 'queued') {
        toast.success('Bez připojení: porucha je uložená a odešle se automaticky.');
      } else {
        toast.success(`Porucha na ${getMachineName(machineKey)} byla nahlášena`);
      }

      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Poruchu se nepodařilo uložit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMachineName = getMachineName(machineKey);

  return (
    <section className={css.container}>
      <div className={css.topRow}>
        <Link to="/" className={css.backButton}>‹ Domů</Link>
        <span className={css.sectionLabel}>
          PORUCHA{selectedMachineName ? ` · ${selectedMachineName.toUpperCase()}` : ''}
        </span>
      </div>

      <div className={css.heading}>
        <h1>Nahlásit poruchu</h1>
        <p>
          {machineKeys.length > 1
            ? 'Nejprve vyberte baličku a potom zařízení, kde je problém.'
            : <>Balička <strong>{selectedMachineName}</strong> se doplní automaticky.</>}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {machineKeys.length > 1 && (
          <div className={css.machineSection}>
            <span className={css.machineLabel}>Balička</span>
            <div className={css.machineGrid}>
              {machineKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`${css.machineButton} ${machineKey === key ? css.machineSelected : ''}`}
                  onClick={() => {
                    setSelectedMachineKey(key);
                    setError('');
                  }}
                >
                  {getMachineName(key)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={css.faultGrid}>
          {FAULTS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`${css.faultButton} ${faultType === key ? css.selected : ''}`}
              onClick={() => {
                setFaultType(key);
                setError('');
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <label className={css.noteLabel}>
          <span>
            Poznámka <small>(nepovinné)</small>
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, 300))}
            maxLength="300"
            rows="4"
            placeholder="Krátce popište problém…"
          />
          <small className={css.counter}>{note.length}/300</small>
        </label>

        {error && <p className={css.error}>{error}</p>}

        <button
          type="submit"
          className={css.submitButton}
          disabled={isSubmitting || !machineKey || !faultType}
        >
          {isSubmitting ? 'Ukládám…' : 'Nahlásit poruchu'}
        </button>
      </form>
    </section>
  );
};

export default ReportFault;
