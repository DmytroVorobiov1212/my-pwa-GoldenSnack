import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { getDeviceToken, useDevice } from '../../device/DeviceContext';
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
  const [faultType, setFaultType] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

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

      const response = await fetch(`${API_BASE_URL}/devices/fault`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          faultType,
          note: note.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          forgetDevice();
        }

        throw new Error(result.message || 'Poruchu se nepodařilo nahlásit.');
      }

      toast.success(`Porucha na ${device.machineName} byla nahlášena`);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Poruchu se nepodařilo nahlásit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={css.container}>
      <div className={css.topRow}>
        <Link to="/" className={css.backButton}>‹ Domů</Link>
        <span className={css.sectionLabel}>
          PORUCHA · {device.machineName.toUpperCase()}
        </span>
      </div>

      <div className={css.heading}>
        <h1>Nahlásit poruchu</h1>
        <p>
          Vyberte zařízení. Balička <strong>{device.machineName}</strong> se doplní automaticky.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
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
          disabled={isSubmitting || !faultType}
        >
          {isSubmitting ? 'Odesílám…' : 'Nahlásit poruchu'}
        </button>
      </form>
    </section>
  );
};

export default ReportFault;
