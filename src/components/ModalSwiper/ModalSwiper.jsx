import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ModalSwiper.module.css';

export default function ModalSwiper({ group, activeIndex = 0, onClose }) {
  const variants = group && Array.isArray(group.variants) ? group.variants : [];
  const safeInitialIndex =
    activeIndex >= 0 && activeIndex < variants.length ? activeIndex : 0;
  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);
  const contentRef = useRef(null);

  const variant = variants[currentIndex];
  const hasMultipleVariants = variants.length > 1;

  useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') onClose();
      if (!hasMultipleVariants) return;

      if (event.key === 'ArrowLeft') {
        setCurrentIndex(index =>
          index === 0 ? variants.length - 1 : index - 1,
        );
      }

      if (event.key === 'ArrowRight') {
        setCurrentIndex(index =>
          index === variants.length - 1 ? 0 : index + 1,
        );
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasMultipleVariants, onClose, variants.length]);

  useEffect(() => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow || '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    // Android 5 / old Chrome friendly: reset the modal's own scroll container
    // whenever a different product variant is displayed.
    node.scrollTop = 0;
  }, [currentIndex]);

  if (!variant) return null;

  const showPrevious = () => {
    setCurrentIndex(index =>
      index === 0 ? variants.length - 1 : index - 1,
    );
  };

  const showNext = () => {
    setCurrentIndex(index =>
      index === variants.length - 1 ? 0 : index + 1,
    );
  };

  const paramKeys = variant.params ? Object.keys(variant.params) : [];

  const content = (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={(group && group.groupName) || 'Detail'}
        onClick={event => event.stopPropagation()}
      >
        <div className={styles.handle} aria-hidden="true" />

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Zavřít"
        >
          ×
        </button>

        <div className={styles.content} ref={contentRef}>
          <h2 className={styles.header}>{variant.title}</h2>

          {variant.image ? (
            <img
              src={variant.image}
              alt={variant.title}
              className={styles.image}
            />
          ) : null}

          <div className={styles.paramList}>
            {paramKeys.map(label => (
              <div className={styles.paramItem} key={label}>
                <span className={styles.label}>{label}</span>
                <span className={styles.value}>{variant.params[label]}</span>
              </div>
            ))}
          </div>

          {hasMultipleVariants ? (
            <div className={styles.variantNav}>
              <button
                type="button"
                className={styles.navButton}
                onClick={showPrevious}
                aria-label="Předchozí varianta"
              >
                ‹
              </button>

              <span className={styles.variantCount}>
                {currentIndex + 1} / {variants.length}
              </span>

              <button
                type="button"
                className={styles.navButton}
                onClick={showNext}
                aria-label="Další varianta"
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
