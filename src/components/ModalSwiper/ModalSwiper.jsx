import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import styles from './ModalSwiper.module.css';
import { IoIosCloseCircleOutline } from 'react-icons/io';

export default function ModalSwiper({ group, activeIndex = 0, onClose }) {
  const swiperRef = useRef(null);
  const touchStartY = useRef(null);
  const dialogRef = useRef(null);

  const handleTouchStart = e => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = e => {
    const touchEndY = e.changedTouches[0].clientY;
    if (touchEndY - touchStartY.current > 100) onClose();
  };

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // iOS-safe: блокуємо фон через position:fixed
  useEffect(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const original = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
    };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    return () => {
      document.body.style.position = original.position || '';
      document.body.style.top = original.top || '';
      document.body.style.left = original.left || '';
      document.body.style.right = original.right || '';
      document.body.style.width = original.width || '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const content = (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={group?.groupName || 'Detail'}
        tabIndex={-1}
        ref={dialogRef}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.handle} aria-hidden />
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Zavřít"
        >
          <IoIosCloseCircleOutline />
        </button>

        <Swiper
          className={styles.swiper} // висота = 100% модалки
          modules={[Pagination, Keyboard]}
          initialSlide={activeIndex}
          loop
          keyboard={{ enabled: true }}
          pagination={{ clickable: true }}
          onSwiper={swiper => (swiperRef.current = swiper)}
        >
          {group.variants.map(variant => (
            <SwiperSlide key={variant.id} className={styles.slide}>
              <div className={styles.slideContent}>
                <h2 className={styles.header}>{variant.title}</h2>

                {variant.image && (
                  <img
                    src={variant.image}
                    alt={variant.title}
                    className={styles.image}
                    loading="lazy"
                  />
                )}

                <div className={styles.paramList}>
                  {Object.entries(variant.params).map(([label, value]) => (
                    <div className={styles.paramItem} key={label}>
                      <span className={styles.label}>{label}</span>
                      <span className={styles.value}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
