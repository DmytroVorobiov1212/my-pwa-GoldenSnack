// import { useMemo, useState } from 'react';
// import { FiX, FiSearch } from 'react-icons/fi';
// import ModalSwiper from '../ModalSwiper/ModalSwiper';
// import styles from './ButlerList.module.css';
// import ButlerItem from '../ButlerItem/ButlerItem';

// const ButlerList = ({ data }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

//   const filteredData = useMemo(() => {
//     if (!Array.isArray(data)) return [];
//     const term = searchTerm.trim().toLowerCase();
//     if (!term) return data;
//     return data.filter(group => {
//       const name = group?.groupName;
//       return typeof name === 'string' && name.toLowerCase().includes(term);
//     });
//   }, [data, searchTerm]);

//   return (
//     <div className={styles.container}>
//       <form
//         role="search"
//         className={styles.searchWrap}
//         onSubmit={e => e.preventDefault()}
//       >
//         <FiSearch className={styles.searchIcon} aria-hidden />

//         <label className="hidden" htmlFor="butlerSearch">
//           Hledat podle názvu
//         </label>
//         <input
//           id="butlerSearch"
//           name="q"
//           type="search"
//           placeholder="Hledat podle názvu…"
//           value={searchTerm}
//           onChange={e => setSearchTerm(e.target.value)}
//           className={styles.searchInput}
//           autoComplete="on"
//           enterKeyHint="search"
//           inputMode="search"
//           spellCheck={false}
//           autoCapitalize="off"
//           autoCorrect="off"
//         />

//         {searchTerm && (
//           <button
//             type="button"
//             className={styles.clearBtn}
//             onClick={() => setSearchTerm('')}
//             aria-label="Vymazat hledání"
//           >
//             <FiX />
//           </button>
//         )}
//       </form>

//       <ul className={styles.list}>
//         {filteredData.map((group, index) => (
//           <li key={index} className={styles.item}>
//             <ButlerItem
//               group={group}
//               groupName={group.groupName}
//               onSelect={group => {
//                 setSelectedGroup(group);
//                 setSelectedVariantIndex(0);
//               }}
//             />
//           </li>
//         ))}
//       </ul>

//       {selectedGroup && (
//         <ModalSwiper
//           group={selectedGroup}
//           activeIndex={selectedVariantIndex}
//           onClose={() => setSelectedGroup(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default ButlerList;

// import { useMemo, useState } from 'react';
// import ModalSwiper from '../ModalSwiper/ModalSwiper';
// import styles from './ButlerList.module.css';
// import ButlerItem from '../ButlerItem/ButlerItem';
// import AlphaFilter from '../AlphaFilter/AlphaFilter';

// const norm = s =>
//   (s || '')
//     .toLowerCase()
//     .normalize('NFD')
//     .replace(/[\u0300-\u036f]/g, ''); // прибрати діакритику (č → c, etc)

// const firstLetter = s => {
//   const n = norm(s).trim();
//   return n ? n[0].toUpperCase() : '';
// };

// const ButlerList = ({ data }) => {
//   const [letter, setLetter] = useState(null);
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

//   const filteredData = useMemo(() => {
//     if (!Array.isArray(data)) return [];
//     if (!letter) return data;
//     return data.filter(group => firstLetter(group?.groupName) === letter);
//   }, [data, letter]);

//   return (
//     <div className={styles.container}>
//       <AlphaFilter value={letter} onChange={setLetter} />

//       <ul className={styles.list}>
//         {filteredData.map((group, index) => (
//           <li key={index} className={styles.item}>
//             <ButlerItem
//               group={group}
//               groupName={group.groupName}
//               onSelect={g => {
//                 setSelectedGroup(g);
//                 setSelectedVariantIndex(0);
//               }}
//             />
//           </li>
//         ))}
//       </ul>

//       {selectedGroup && (
//         <ModalSwiper
//           group={selectedGroup}
//           activeIndex={selectedVariantIndex}
//           onClose={() => setSelectedGroup(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default ButlerList;

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ModalSwiper from '../ModalSwiper/ModalSwiper';
import styles from './ButlerList.module.css';
import ButlerItem from '../ButlerItem/ButlerItem';
import AlphaFilter from '../AlphaFilter/AlphaFilter';
import SearchModal from '../SearchModal/SearchModal';
import { buildIndexMap, firstKey, norm } from '../../utils/text';

const ButlerList = ({ data }) => {
  const [params, setParams] = useSearchParams();
  const initialLetter = params.get('letter');
  const [letter, setLetter] = useState(initialLetter);
  const [searchQ, setSearchQ] = useState(null); // текстовий фільтр з модалки
  const [showSearch, setShowSearch] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // зберігаємо останній вибір у URL і localStorage
  const onChangeLetter = l => {
    setLetter(l);
    const next = new URLSearchParams(params);
    if (l) next.set('letter', l);
    else next.delete('letter');
    setParams(next, { replace: true });
    try {
      localStorage.setItem('alphaLetter', l ?? '');
    } catch {}
  };

  // початкове відновлення з localStorage (одноразово)
  useMemo(() => {
    if (!initialLetter) {
      const stored =
        typeof window !== 'undefined'
          ? localStorage.getItem('alphaLetter')
          : '';
      if (stored) setLetter(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // індекс для фільтра
  const { map, keys } = useMemo(() => buildIndexMap(data), [data]);

  // комбіноване фільтрування (літера + модал-пошук)
  const filteredData = useMemo(() => {
    let arr = Array.isArray(data) ? data.slice() : [];
    if (letter) arr = arr.filter(g => firstKey(g?.groupName) === letter);
    if (searchQ && searchQ.trim()) {
      const q = norm(searchQ);
      arr = arr.filter(g => norm(g?.groupName).includes(q));
    }
    return arr;
  }, [data, letter, searchQ]);

  // групування під заголовками
  const grouped = useMemo(() => {
    const { map: m, keys: k } = buildIndexMap(filteredData);
    return { m, k };
  }, [filteredData]);

  return (
    <div className={styles.container}>
      <AlphaFilter
        data={data}
        value={letter}
        onChange={onChangeLetter}
        onOpenSearch={() => setShowSearch(true)}
      />

      {/* Груповані секції A / B / … */}
      {grouped.k.map(k => (
        <section key={k} aria-labelledby={`sec-${k}`}>
          <h3 id={`sec-${k}`} className={styles.groupHeader}>
            {k}
          </h3>
          <ul className={styles.list}>
            {(grouped.m.get(k) || []).map((group, index) => (
              <li key={`${k}-${index}`} className={styles.item}>
                <ButlerItem
                  group={group}
                  groupName={group.groupName}
                  onSelect={g => {
                    setSelectedGroup(g);
                    setSelectedVariantIndex(0);
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {selectedGroup && (
        <ModalSwiper
          group={selectedGroup}
          activeIndex={selectedVariantIndex}
          onClose={() => setSelectedGroup(null)}
        />
      )}

      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSearch={q => setSearchQ(q)}
      />
    </div>
  );
};

export default ButlerList;
