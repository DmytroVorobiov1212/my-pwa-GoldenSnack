import React, { useState } from 'react';
// import PropTypes from 'prop-types';
import styles from './Table.module.css';

const Table = ({ data }) => {
  const [search, setSearch] = useState('');

  // Фільтрація по назві + tubus
  const filteredData = data.filter(item => {
    const matchesSearch = item.vyrobek
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesSearch;
  });

  // Скидання фільтрів
  const resetFilters = () => {
    setSearch('');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tabulka výrobků</h1>

      <input
        type="text"
        placeholder="Hledat podle názvu..."
        className={styles.input}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Кнопка скидання */}
      {/* Кнопка скидання показується тільки якщо пошук не порожній або обраний Tubus ≠ all */}
      {search !== '' && (
        <button className={styles.resetButton} onClick={resetFilters}>
          Vyčistit
        </button>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Výrobek</th>
              <th>Délka</th>
              <th>Posunutí</th>
              <th>Data</th>
              <th>Program</th>
              <th>Tubus</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr key={index}>
                <td>{row.vyrobek}</td>
                <td>{row.delka}</td>
                <td>{row.posunuti}</td>
                <td>{row.datum}</td>
                <td>{row.program}</td>
                <td>{row.tubus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Table.propTypes = {
//   data: PropTypes.array.isRequired,
// };

export default Table;
