// src/components/UpdateToast.jsx
import toast from 'react-hot-toast';
import styles from './UpdateToast.module.css';

/**
 * Показує кастомний toast з кнопками.
 * @param {{ onConfirm: () => void, onDismiss?: () => void }} params
 */
export function showUpdateToast({ onConfirm, onDismiss }) {
  toast.custom(
    t => (
      <div className={styles.toast} role="status" aria-live="polite">
        <span className={styles.msg}>🔥 Доступна нова версія застосунку</span>
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => {
              toast.dismiss(t.id);
              onDismiss?.();
            }}
          >
            Пізніше
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => {
              // 1) Закриваємо toast
              toast.dismiss(t.id);
              // 2) Викликаємо колбек, що попросить SW активуватися
              onConfirm();
            }}
          >
            Оновити
          </button>
        </div>
      </div>
    ),
    {
      duration: 10000, // 10с, щоб не дратувати користувача
      position: 'bottom-center',
    }
  );
}
