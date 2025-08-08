// src/components/ModalSwiper/ModalSwiper.jsx
import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import styles from './ModalSwiper.module.css';

const ModalSwiper = ({ group, activeIndex = 0, onClose }) => {
  const swiperRef = useRef();
  const touchStartY = useRef(null);

  const handleTouchStart = e => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = e => {
    const touchEndY = e.changedTouches[0].clientY;
    const distance = touchEndY - touchStartY.current;

    if (distance > 100) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
        <Swiper
          modules={[Pagination]}
          initialSlide={activeIndex}
          loop={true}
          pagination={{ clickable: true }}
          onSwiper={swiper => (swiperRef.current = swiper)}
        >
          {group.variants.map((variant, index) => (
            <SwiperSlide key={variant.id}>
              <div className={styles.slideContent}>
                <h2 className={styles.header}>{variant.title}</h2>
                {variant.image && (
                  <img
                    src={variant.image}
                    alt={variant.title}
                    className={styles.image}
                  />
                )}
                <div className={styles.paramList}>
                  {Object.entries(variant.params).map(([label, value]) => (
                    <div className={styles.paramItem} key={label}>
                      <span className={styles.label}>{label}:</span>
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
