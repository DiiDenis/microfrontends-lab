import {
  LAB_EVENT_NAMES,
  type CartUpdatedEventPayload,
} from '@mfe-lab/contracts';
import { DESIGN_TOKENS_VERSION } from '@mfe-lab/design-tokens';
import '@mfe-lab/design-tokens/tokens.css';
import {
  AppBoundaryLabel,
  LabButton,
  UI_REACT_VERSION,
} from '@mfe-lab/ui-react';
import '@mfe-lab/ui-react/styles.css';
import { useEffect, useState } from 'react';

import styles from './ProductApp.module.css';
import { PRODUCTS_REMOTE_VERSION } from './technicalInfo';

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
    <main className={styles.app} data-mfe-owner="products-react">
      <div className={styles.ownership}>
        <AppBoundaryLabel label="PRODUCTS · REACT · STANDALONE" />
        <small>Design tokens: {DESIGN_TOKENS_VERSION}</small>
        <small>UI React: {UI_REACT_VERSION}</small>
      </div>
      <h1 className={styles.title}>Produtos</h1>
      <p>Remote version: {PRODUCTS_REMOTE_VERSION}</p>
      <p>Itens adicionados: {addedItems}</p>

      <ul className={styles.productList}>
        {products.map((product) => (
          <li className={styles.product} key={product.name}>
            <div>
              <h2 className={styles.productName}>{product.name}</h2>
              <p>{product.price}</p>
            </div>
            <LabButton onClick={addItem} size="compact">
              Adicionar
            </LabButton>
          </li>
        ))}
      </ul>
    </main>
  );
}
