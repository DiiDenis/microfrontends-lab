import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ProductApp } from './ProductApp';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento raiz #root não encontrado.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ProductApp />
  </StrictMode>,
);

