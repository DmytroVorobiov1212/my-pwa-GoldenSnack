import { useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import styles from './ModalSwiper.module.css';
import { IoIosCloseCircleOutline } from 'react-icons/io';

const ModalSwiper = ({ group, activeIndex = 0, onClose }) => {
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

  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, []);

  return (
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
          modules={[Pagination, Keyboard]}
          initialSlide={activeIndex}
          loop
          keyboard={{ enabled: true }}
          pagination={{ clickable: true }}
          onSwiper={swiper => (swiperRef.current = swiper)}
        >
          {group.variants.map(variant => (
            <SwiperSlide key={variant.id}>
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
};

export default ModalSwiper;
