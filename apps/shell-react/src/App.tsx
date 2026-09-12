import {
  LAB_EVENT_NAMES,
  type CartUpdatedEventPayload,
  type ProfileUpdatedEventPayload,
} from '@mfe-lab/contracts';
import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';

import { RemoteRouteErrorBoundary } from './RemoteRouteErrorBoundary';
import { VueRemoteRoute } from './VueRemoteRoute';
import styles from './App.module.css';

const ProductsRemoteModule = lazy(() => import('./ProductsRemoteModule'));

function HomePage() {
  return (
    <section>
      <h1>Home</h1>
      <p>Esta página pertence ao shell.</p>
    </section>
  );
}

function ProductsRemoteRoute() {
  return (
    <RemoteRouteErrorBoundary>
      <Suspense fallback={<p role="status">Carregando Products...</p>}>
        <ProductsRemoteModule />
      </Suspense>
    </RemoteRouteErrorBoundary>
  );
}

export function App() {
  const [cartTotal, setCartTotal] = useState(0);
  const [profile, setProfile] = useState<ProfileUpdatedEventPayload | null>(
    null,
  );

  useEffect(() => {
    function handleCartUpdated(event: CustomEvent<CartUpdatedEventPayload>) {
      setCartTotal(event.detail.totalItems);
    }

    function handleProfileUpdated(
      event: CustomEvent<ProfileUpdatedEventPayload>,
    ) {
      setProfile(event.detail);
    }

    window.addEventListener(LAB_EVENT_NAMES.cartUpdated, handleCartUpdated);
    window.addEventListener(
      LAB_EVENT_NAMES.profileUpdated,
      handleProfileUpdated,
    );

    return () => {
      window.removeEventListener(LAB_EVENT_NAMES.cartUpdated, handleCartUpdated);
      window.removeEventListener(
        LAB_EVENT_NAMES.profileUpdated,
        handleProfileUpdated,
      );
    };
  }, []);

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

        <div className={styles.status} aria-live="polite">
          <span>Carrinho: {cartTotal}</span>
          <span>
            {profile
              ? `Usuário: ${profile.name} · ${profile.role}`
              : 'Usuário: aguardando Account'}
          </span>
        </div>
      </header>

      <main className={styles.content}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsRemoteRoute />} />
          <Route path="/account" element={<VueRemoteRoute />} />
        </Routes>
      </main>
    </div>
  );
}
