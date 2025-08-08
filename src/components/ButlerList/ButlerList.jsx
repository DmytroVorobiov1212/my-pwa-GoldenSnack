// src/components/ButlerList/ButlerList.jsx
import { useState } from 'react';
import ModalSwiper from '../ModalSwiper/ModalSwiper';
import styles from './ButlerList.module.css';

const ButlerList = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const handleClick = group => {
    setSelectedGroup(group);
    setSelectedVariantIndex(0); // завжди відкриваємо з першого варіанту
  };

  // 🔍 фільтр по назвам груп (без регістру)
  const filteredData = Array.isArray(data)
    ? data.filter(group => {
        const name = group?.groupName;
        if (typeof name !== 'string') return false;
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

  return (
    <div className={styles.container}>
      <input
        type="text"
        placeholder="Hledat podle názvu..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className={styles.searchInput}
      />
      <ul className={styles.list}>
        {filteredData.map((group, index) => (
          <li
            key={index}
            className={styles.item}
            onClick={() => handleClick(group)}
          >
            {group.groupName}
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
