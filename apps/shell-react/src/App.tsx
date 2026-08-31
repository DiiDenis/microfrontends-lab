import { NavLink, Route, Routes } from 'react-router-dom';

import styles from './App.module.css';

function HomePage() {
  return (
    <section>
      <h1>Home</h1>
      <p>Esta página pertence ao shell.</p>
    </section>
  );
}

function ProductsPlaceholder() {
  return (
    <section>
      <h1>Products ainda não conectado</h1>
      <p>Este placeholder não incorpora o app independente da porta 3001.</p>
    </section>
  );
}

function AccountPlaceholder() {
  return (
    <section>
      <h1>Account ainda não conectado</h1>
      <p>Este placeholder não incorpora o app independente da porta 3002.</p>
    </section>
  );
}

export function App() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.owner}>SHELL · REACT</span>

        <nav aria-label="Navegação principal">
          <ul className={styles.navigation}>
            <li>
              <NavLink to="/">Home</NavLink>
            </li>
            <li>
              <NavLink to="/products">Products</NavLink>
            </li>
            <li>
              <NavLink to="/account">Account</NavLink>
            </li>
          </ul>
        </nav>
      </header>

      <main className={styles.content}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPlaceholder />} />
          <Route path="/account" element={<AccountPlaceholder />} />
        </Routes>
      </main>
    </div>
  );
}
