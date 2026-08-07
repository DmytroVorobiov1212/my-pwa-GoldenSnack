import { useState } from 'react';
import { useDevice } from '../../device/DeviceContext';
import css from './PairDevice.module.css';

const PairDevice = () => {
  const { pairDevice, error, verifyDevice } = useDevice();
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = event => {
    const nextValue = event.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(nextValue);
    setFormError('');
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (code.length !== 6 || isSubmitting) {
      setFormError('Zadejte 6místný párovací kód.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');
      await pairDevice(code);
    } catch (pairError) {
      setFormError(pairError.message || 'Zařízení se nepodařilo spárovat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={css.screen}>
      <section className={css.card}>
        <div className={css.logoBox}>
          <img src="/gs-mark.svg" alt="Golden Snack" className={css.logo} />
        </div>
        <p className={css.eyebrow}>GOLDEN SNACK · VÝROBNÍ TERMINÁL</p>
        <h1>Připojit zařízení</h1>
        <p className={css.text}>Zadejte jednorázový 6místný kód vytvořený administrátorem.</p>

        <form onSubmit={handleSubmit} className={css.form}>
          <label htmlFor="pairing-code">Párovací kód</label>
          <input
            id="pairing-code"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={code}
            onChange={handleChange}
            placeholder="000000"
            className={css.codeInput}
          />
          {formError && <p className={css.error}>{formError}</p>}
          <button type="submit" disabled={isSubmitting || code.length !== 6}>
            {isSubmitting ? 'Připojuji...' : 'Připojit terminál'}
          </button>
        </form>

        {error && (
          <div className={css.connectionBox}>
            <p>{error}</p>
            <button type="button" className={css.retryButton} onClick={verifyDevice}>Zkusit znovu</button>
          </div>
        )}
      </section>
    </main>
  );
};

export default PairDevice;
