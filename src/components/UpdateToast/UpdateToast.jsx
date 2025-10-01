// src/components/UpdateToast/UpdateToast.jsx
import toast from 'react-hot-toast';
import styles from './UpdateToast.module.css';

const TOAST_ID = 'pwa-update';

export function showUpdateToast({ onConfirm, onDismiss }) {
  toast.dismiss(TOAST_ID);

  toast.custom(
    t => (
      <div className={styles.toast} role="status" aria-live="polite">
        <span className={styles.msg}>
          🔥 Je k dispozici nová verze aplikace
        </span>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => {
              toast.dismiss(TOAST_ID);
              onDismiss?.();
            }}
          >
            Později
          </button>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => {
              try {
                sessionStorage.setItem('pwaJustUpdated', '1');
              } catch {}
              toast.dismiss(TOAST_ID);
              onConfirm();
            }}
          >
            Aktualizovat
          </button>
        </div>
      </div>
    ),
    { id: TOAST_ID, duration: 10000, position: 'bottom-center' }
  );
}
