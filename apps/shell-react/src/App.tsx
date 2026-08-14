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
  return <h1>Products ainda não conectado</h1>;
}

function AccountPlaceholder() {
  return <h1>Account ainda não conectado</h1>;
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

