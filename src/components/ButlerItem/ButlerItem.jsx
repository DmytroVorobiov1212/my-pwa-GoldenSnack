import styles from './ButlerItem.module.css';

const ButlerItem = ({ group, groupName, onSelect }) => {
  const handleClick = group => {
    setSelectedGroup(group);
    setSelectedVariantIndex(0);
  };
  return (
    <>
      <button
        type="button"
        className={styles.itemBtn}
        onClick={() => onSelect(group)}
        aria-label={`Otevřít skupinu ${groupName}`}
      >
        <span className={styles.itemTitle}>{groupName}</span>
        <span className={styles.itemArrow} aria-hidden>
          ›
        </span>
      </button>
    </>
  );
};

export default ButlerItem;
