import { useEffect, useRef, useState } from 'react';
import styles from './SearchModal.module.css';

export default function SearchModal({ isOpen, onClose, onSearch }) {
  const ref = useRef(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const lastY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lastY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, lastY);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => ref.current?.focus(), 0);
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>Vyhledávání</h2>
        <input
          ref={ref}
          className={styles.input}
          type="search"
          placeholder="Zadejte hledaný text…"
          value={q}
          onChange={e => setQ(e.target.value)}
          enterKeyHint="search"
          inputMode="search"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <div className={styles.actions}>
          <button type="button" onClick={onClose}>
            Zrušit
          </button>
          <button
            type="button"
            onClick={() => {
              onSearch(q);
              onClose();
            }}
          >
            Hledat
          </button>
        </div>
      </div>
    </div>
  );
}
