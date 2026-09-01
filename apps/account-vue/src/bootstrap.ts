import { mount } from './mount';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento raiz #root não encontrado.');
}

mount(rootElement, {
  initialUserName: 'Denis',
  source: 'account-standalone',
});
