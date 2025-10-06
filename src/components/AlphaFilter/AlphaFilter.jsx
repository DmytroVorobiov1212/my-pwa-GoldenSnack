// import styles from './AlphaFilter.module.css';

// const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// export default function AlphaFilter({ value, onChange }) {
//   return (
//     <div
//       className={styles.wrap}
//       role="group"
//       aria-label="Фільтр за першою літерою"
//     >
//       <button
//         type="button"
//         className={`${styles.chip} ${!value ? styles.active : ''}`}
//         onClick={() => onChange(null)}
//         aria-pressed={!value}
//       >
//         Vše
//       </button>
//       {LETTERS.map(l => (
//         <button
//           key={l}
//           type="button"
//           className={`${styles.chip} ${value === l ? styles.active : ''}`}
//           onClick={() => onChange(l)}
//           aria-pressed={value === l}
//         >
//           {l}
//         </button>
//       ))}
//     </div>
//   );
// }

// import { useEffect, useMemo, useRef, useState } from 'react';
// import styles from './AlphaFilter.module.css';
// import { buildIndexMap } from '../../utils/text';

// export default function AlphaFilter({
//   data,
//   value,
//   onChange,
//   onOpenSearch, // відкриєш модалку пошуку
//   getLabel = x => x?.groupName,
// }) {
//   const { map, keys } = useMemo(
//     () => buildIndexMap(data, getLabel),
//     [data, getLabel]
//   );
//   const wrapRef = useRef(null);
//   const [stuck, setStuck] = useState(false);

//   // sticky shadow
//   useEffect(() => {
//     const el = wrapRef.current;
//     if (!el) return;
//     const obs = new IntersectionObserver(
//       ([e]) => setStuck(e.intersectionRatio < 1),
//       { threshold: [1] }
//     );
//     obs.observe(el);
//     return () => obs.disconnect();
//   }, []);

//   return (
//     <div
//       ref={wrapRef}
//       className={`${styles.wrap} ${stuck ? styles.stuck : ''}`}
//       role="group"
//       aria-label="Фільтр за першою літерою"
//     >
//       <button
//         type="button"
//         className={`${styles.chip} ${!value ? styles.active : ''}`}
//         onClick={() => onChange(null)}
//         aria-pressed={!value}
//       >
//         Vše
//         <span className={styles.badge}>{data?.length || 0}</span>
//       </button>

//       {keys.map(k => (
//         <button
//           key={k}
//           type="button"
//           className={`${styles.chip} ${value === k ? styles.active : ''}`}
//           onClick={() => onChange(k)}
//           aria-pressed={value === k}
//         >
//           {k}
//           <span className={styles.badge}>{(map.get(k) || []).length}</span>
//         </button>
//       ))}

//       <div className={styles.spacer} />

//       {/* Кнопка пошуку у модалці (без клавіатури на сторінці) */}
//       <button
//         type="button"
//         className={styles.searchBtn}
//         aria-label="Otevřít vyhledávání"
//         onClick={onOpenSearch}
//         title="Vyhledávání"
//       >
//         🔍
//       </button>
//     </div>
//   );
// }

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './AlphaFilter.module.css';
import { buildIndexMap } from '../../utils/text';

export default function AlphaFilter({
  data,
  value,
  onChange,
  getLabel = x => x?.groupName,
}) {
  const { map, keys } = useMemo(
    () => buildIndexMap(data, getLabel),
    [data, getLabel]
  );
  const wrapRef = useRef(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setStuck(e.intersectionRatio < 1),
      { threshold: [1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`${styles.wrap} ${stuck ? styles.stuck : ''}`}
      role="group"
      aria-label="Фільтр за першою літерою"
    >
      <button
        type="button"
        className={`${styles.chip} ${!value ? styles.active : ''}`}
        onClick={() => onChange(null)}
        aria-pressed={!value}
      >
        Vše
        <span className={styles.badge}>{data?.length || 0}</span>
      </button>

      {keys.map(k => (
        <button
          key={k}
          type="button"
          className={`${styles.chip} ${value === k ? styles.active : ''}`}
          onClick={() => onChange(k)}
          aria-pressed={value === k}
        >
          {k}
          <span className={styles.badge}>{(map.get(k) || []).length}</span>
        </button>
      ))}
    </div>
  );
}
