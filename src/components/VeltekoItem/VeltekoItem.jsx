import styles from './VeltekoItem.module.css';

const VeltekoItem = ({ group, groupName, onSelect }) => {
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

export default VeltekoItem;
