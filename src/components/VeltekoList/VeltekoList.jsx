import { useMemo, useState } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import ModalSwiper from '../ModalSwiper/ModalSwiper';
import styles from './VeltekoList.module.css';
import VeltekoItem from '../VeltekoItem/VeltekoItem';

const VeltekoList = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

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
      <form
        role="search"
        className={styles.searchWrap}
        onSubmit={e => e.preventDefault()}
      >
        <FiSearch className={styles.searchIcon} aria-hidden />

        <label className="hidden" htmlFor="veltekoSearch">
          Hledat podle názvu
        </label>
        <input
          id="veltekoSearch"
          name="q"
          type="search"
          placeholder="Hledat podle názvu…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          autoComplete="on"
          enterKeyHint="search"
          inputMode="search"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
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
      </form>

      <ul className={styles.list}>
        {filteredData.map((group, index) => (
          <li key={index} className={styles.item}>
            <VeltekoItem
              group={group}
              groupName={group.groupName}
              onSelect={group => {
                setSelectedGroup(group);
                setSelectedVariantIndex(0);
              }}
            />
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

export default VeltekoList;
