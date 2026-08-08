import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { getDeviceToken, useDevice } from '../../device/DeviceContext';
import { materialCatalog } from '../../data/materialCatalog';
import css from './MaterialOrder.module.css';

const CATEGORY_KEYS = ['priprava', 'polotovar', 'folga'];

function createEmptyItem() {
  return {
    category: 'priprava',
    product: '',
    quantity: '',
    unit: '',
  };
}

function getProduct(categoryKey, productName) {
  const products = materialCatalog[categoryKey].products;

  for (let index = 0; index < products.length; index += 1) {
    if (products[index].name === productName) {
      return products[index];
    }
  }

  return null;
}

function isItemComplete(item) {
  const quantity = Number(item.quantity);

  return Boolean(
    item.category &&
      item.product &&
      item.unit &&
      item.quantity.toString().trim() &&
      Number.isFinite(quantity) &&
      quantity > 0,
  );
}

const MaterialOrder = () => {
  const { device, forgetDevice } = useDevice();
  const [items, setItems] = useState([createEmptyItem()]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (index, field, value) => {
    const nextItems = items.map((item, itemIndex) => {
      if (itemIndex !== index) return item;

      const nextItem = { ...item, [field]: value };

      if (field === 'category') {
        nextItem.product = '';
        nextItem.unit = '';
      }

      if (field === 'product') {
        const product = getProduct(nextItem.category, value);
        nextItem.unit = product ? product.unit : '';
      }

      return nextItem;
    });

    setItems(nextItems);
    setError('');
  };

  const addItem = () => {
    const lastItem = items[items.length - 1];

    if (!isItemComplete(lastItem)) {
      setError('Nejprve vyplňte aktuální položku a množství větší než 0.');
      return;
    }

    setItems((currentItems) => [...currentItems, createEmptyItem()]);
    setError('');
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
    setError('');
  };

  const validate = () => {
    const hasInvalidItem = items.some((item) => !isItemComplete(item));

    if (hasInvalidItem) {
      setError('Vyplňte u každé položky materiál a množství větší než 0.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting || !validate()) return;

    const token = getDeviceToken();

    if (!token) {
      forgetDevice();
      return;
    }

    const preparedOrder = {
      items: items.map((item) => ({
        categoryKey: item.category,
        categoryLabel: materialCatalog[item.category].label,
        product: item.product,
        quantity: Number(item.quantity),
        unit: item.unit,
      })),
    };

    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/device-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preparedOrder),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          forgetDevice();
        }

        throw new Error(result.message || 'Žádost se nepodařilo odeslat');
      }

      setItems([createEmptyItem()]);
      toast.success(`Žádost z ${device.machineName} byla odeslána do skladu`);
    } catch (requestError) {
      setError(requestError.message || 'Žádost se nepodařilo odeslat');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={css.container}>
      <div className={css.topRow}>
        <Link to="/" className={css.backButton}>‹ Domů</Link>
        <span className={css.sectionLabel}>SKLAD · {device.machineName.toUpperCase()}</span>
      </div>

      <div className={css.heading}>
        <h1>Objednat materiál</h1>
        <p>
          Zdroj žádosti: <strong>{device.name}</strong> · balička {device.machineName}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {items.map((item, index) => (
          <article className={css.itemCard} key={`material-${index}`}>
            <div className={css.itemHeader}>
              <strong>Položka {index + 1}</strong>
              {items.length > 1 && (
                <button
                  type="button"
                  className={css.removeButton}
                  onClick={() => removeItem(index)}
                >
                  Odebrat
                </button>
              )}
            </div>

            <div className={css.fields}>
              <label>
                <span>Kategorie</span>
                <select
                  value={item.category}
                  onChange={(event) =>
                    handleChange(index, 'category', event.target.value)
                  }
                >
                  {CATEGORY_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {materialCatalog[key].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={css.productField}>
                <span>Materiál</span>
                <select
                  value={item.product}
                  onChange={(event) =>
                    handleChange(index, 'product', event.target.value)
                  }
                >
                  <option value="">Vyberte materiál</option>
                  {materialCatalog[item.category].products.map((product) => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={css.quantityField}>
                <span>Množství</span>
                <div className={css.quantityWrap}>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={item.quantity}
                    onChange={(event) =>
                      handleChange(index, 'quantity', event.target.value)
                    }
                  />
                  <strong>{item.unit || '—'}</strong>
                </div>
              </label>
            </div>
          </article>
        ))}

        {error && <p className={css.error}>{error}</p>}

        <div className={css.actions}>
          <button type="button" className={css.addButton} onClick={addItem}>
            + Přidat položku
          </button>

          <button
            type="submit"
            className={css.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Odesílám...' : 'Odeslat žádost do skladu'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default MaterialOrder;
