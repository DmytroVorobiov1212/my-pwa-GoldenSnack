// // src/components/ButlerList/ButlerList.jsx
// import { useState } from 'react';
// import ModalSwiper from '../ModalSwiper/ModalSwiper';
// import styles from './ButlerList.module.css';

// const ButlerList = ({ data }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

//   const handleClick = group => {
//     setSelectedGroup(group);
//     setSelectedVariantIndex(0); // завжди відкриваємо з першого варіанту
//   };

//   // 🔍 фільтр по назвам груп (без регістру)
//   const filteredData = Array.isArray(data)
//     ? data.filter(group => {
//         const name = group?.groupName;
//         if (typeof name !== 'string') return false;
//         return name.toLowerCase().includes(searchTerm.toLowerCase());
//       })
//     : [];

//   return (
//     <div className={styles.container}>
//       <input
//         type="text"
//         placeholder="Hledat podle názvu..."
//         value={searchTerm}
//         onChange={e => setSearchTerm(e.target.value)}
//         className={styles.searchInput}
//       />
//       <ul className={styles.list}>
//         {filteredData.map((group, index) => (
//           <li
//             key={index}
//             className={styles.item}
//             onClick={() => handleClick(group)}
//           >
//             {group.groupName}
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

// src/components/ButlerList/ButlerList.jsx
import { useMemo, useState } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import ModalSwiper from '../ModalSwiper/ModalSwiper';
import styles from './ButlerList.module.css';

const ButlerList = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const handleClick = group => {
    setSelectedGroup(group);
    setSelectedVariantIndex(0);
  };

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return data;
    return data.filter(group => {
      const name = group?.groupName;
      return typeof name === 'string' && name.toLowerCase().includes(term);
    });
  }, [data, searchTerm]);

  return (
    <div className={styles.container}>
      <div className={styles.searchWrap}>
        <FiSearch className={styles.searchIcon} aria-hidden />
        <input
          type="text"
          placeholder="Hledat podle názvu…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          aria-label="Vyhledávání podle názvu"
        />
        {searchTerm && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => setSearchTerm('')}
            aria-label="Vymazat hledání"
          >
            <FiX />
          </button>
        )}
      </div>

      <ul className={styles.list}>
        {filteredData.map((group, index) => (
          <li key={index} className={styles.item}>
            <button
              type="button"
              className={styles.itemBtn}
              onClick={() => handleClick(group)}
              aria-label={`Otevřít skupinu ${group.groupName}`}
            >
              <span className={styles.itemTitle}>{group.groupName}</span>
              <span className={styles.itemArrow} aria-hidden>
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selectedGroup && (
        <ModalSwiper
          group={selectedGroup}
          activeIndex={selectedVariantIndex}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
};

export default ButlerList;
