import { createAccountApp } from './createAccountApp';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento raiz #root não encontrado.');
}

createAccountApp().mount(rootElement);

