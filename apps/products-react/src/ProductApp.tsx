import { useState } from 'react';

import styles from './ProductApp.module.css';

const products = [
  { name: 'Teclado mecânico', price: 'R$ 349,90' },
  { name: 'Mouse sem fio', price: 'R$ 189,90' },
] as const;

export function ProductApp() {
  const [addedItems, setAddedItems] = useState(0);

  function addItem() {
    setAddedItems((currentTotal) => currentTotal + 1);
  }

  return (
    <main className={styles.app}>
      <span className={styles.owner}>PRODUCTS · REACT · STANDALONE</span>
      <h1>Produtos</h1>
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

