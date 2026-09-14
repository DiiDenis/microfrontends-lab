import {
  LAB_EVENT_NAMES,
  type CartUpdatedEventPayload,
} from '@mfe-lab/contracts';
import { DESIGN_TOKENS_VERSION } from '@mfe-lab/design-tokens';
import '@mfe-lab/design-tokens/tokens.css';
import { useEffect, useState } from 'react';

import styles from './ProductApp.module.css';

const products = [
  { name: 'Teclado mecânico', price: 'R$ 349,90' },
  { name: 'Mouse sem fio', price: 'R$ 189,90' },
] as const;

export function ProductApp() {
  const [addedItems, setAddedItems] = useState(0);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent<CartUpdatedEventPayload>(LAB_EVENT_NAMES.cartUpdated, {
        detail: { totalItems: addedItems },
      }),
    );
  }, [addedItems]);

  function addItem() {
    setAddedItems((currentTotal) => currentTotal + 1);
  }

  return (
    <main className={styles.app}>
      <div className={styles.ownership}>
        <span className={styles.owner}>PRODUCTS · REACT · STANDALONE</span>
        <small>Design tokens: {DESIGN_TOKENS_VERSION}</small>
      </div>
      <h1>Produtos</h1>
      <p>Remote version: products-v2</p>
      <p>Itens adicionados: {addedItems}</p>

      <ul className={styles.productList}>
        {products.map((product) => (
          <li className={styles.product} key={product.name}>
            <div>
              <h2 className={styles.productName}>{product.name}</h2>
              <p>{product.price}</p>
            </div>
            <button type="button" onClick={addItem}>
              Adicionar
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
