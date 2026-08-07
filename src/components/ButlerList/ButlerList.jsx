import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ModalSwiper from '../ModalSwiper/ModalSwiper';
import styles from './ButlerList.module.css';
import ButlerItem from '../ButlerItem/ButlerItem';
import AlphaFilter from '../AlphaFilter/AlphaFilter';
import { buildIndexMap, firstKey, norm } from '../../utils/text';

const ButlerList = ({ data }) => {
  const [params, setParams] = useSearchParams();
  const initialLetter = params.get('letter') || null;

  const [letter, setLetter] = useState(initialLetter);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const onChangeLetter = nextLetter => {
    setLetter(nextLetter);
    const next = new URLSearchParams(params);
    if (nextLetter) next.set('letter', nextLetter);
    else next.delete('letter');
    setParams(next, { replace: true });

    try {
      localStorage.setItem('alphaLetter', nextLetter || '');
    } catch (error) {
      // Storage is optional for the filter state.
    }
  };

  useEffect(() => {
    if (initialLetter) return;

    try {
      const stored = localStorage.getItem('alphaLetter');
      if (stored) setLetter(stored);
    } catch (error) {
      // Storage is optional for the filter state.
    }
  }, [initialLetter]);

  const filteredData = useMemo(() => {
    let items = Array.isArray(data) ? data.slice() : [];
    const query = norm(searchTerm.trim());

    if (letter) {
      items = items.filter(group => firstKey(group && group.groupName) === letter);
    }

    if (query) {
      items = items.filter(group => {
        const groupName = norm(group && group.groupName);
        if (groupName.indexOf(query) !== -1) return true;

        const variants = group && Array.isArray(group.variants) ? group.variants : [];
        return variants.some(variant => norm(variant && variant.title).indexOf(query) !== -1);
      });
    }

    return items;
  }, [data, letter, searchTerm]);

  const grouped = useMemo(() => {
    const result = buildIndexMap(filteredData);
    return { map: result.map, keys: result.keys };
  }, [filteredData]);

  return (
    <div className={styles.container}>
      <div className={styles.catalogHead}>
        <div>
          <span className={styles.kicker}>NASTAVENÍ BALIČKY</span>
          <h1>Vyberte produkt</h1>
        </div>
        <span className={styles.resultCount}>{filteredData.length} položek</span>
      </div>

      <div className={styles.searchWrap}>
        <span className={styles.searchIcon} aria-hidden="true">⌕</span>
        <input
          type="search"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          className={styles.searchInput}
          placeholder="Hledat produkt…"
          aria-label="Hledat produkt"
          autoComplete="off"
        />
        {searchTerm ? (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => setSearchTerm('')}
            aria-label="Vymazat hledání"
          >
            ×
          </button>
        ) : null}
      </div>

      <AlphaFilter data={data} value={letter} onChange={onChangeLetter} />

      {grouped.keys.length ? (
        grouped.keys.map(key => (
          <section key={key} aria-labelledby={`sec-${key}`}>
            <h3 id={`sec-${key}`} className={styles.groupHeader}>{key}</h3>
            <ul className={styles.list}>
              {(grouped.map.get(key) || []).map((group, index) => (
                <li key={`${key}-${index}`} className={styles.item}>
                  <ButlerItem
                    group={group}
                    groupName={group.groupName}
                    onSelect={selected => {
                      setSelectedGroup(selected);
                      setSelectedVariantIndex(0);
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <div className={styles.emptyState}>Žádný produkt neodpovídá filtru.</div>
      )}

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
