import toast from 'react-hot-toast';
import styles from './UpdateToast.module.css';

const TOAST_ID = 'pwa-update'; // фіксований id для унікальності

export function showUpdateToast({ onConfirm, onDismiss }) {
  // Гарантовано прибираємо попередній тост (якщо раптом був)
  toast.dismiss(TOAST_ID);

  toast.custom(
    t => (
      <div className={styles.toast} role="status" aria-live="polite">
        <span className={styles.msg}>🔥 Доступна нова версія застосунку</span>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => {
              toast.dismiss(TOAST_ID);
              onDismiss?.();
            }}
          >
            Пізніше
          </button>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => {
              toast.dismiss(TOAST_ID);
              onConfirm(); // далі постимо SKIP_WAITING
            }}
          >
            Оновити
          </button>
        </div>
      </div>
    ),
    {
      id: TOAST_ID, // 🔒 робить тост унікальним
      duration: 10000,
      position: 'bottom-center',
    }
  );
}
