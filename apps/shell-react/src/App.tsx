import {
  LAB_EVENT_NAMES,
  type CartUpdatedEventPayload,
  type ProfileUpdatedEventPayload,
} from '@mfe-lab/contracts';
import { DESIGN_TOKENS_VERSION } from '@mfe-lab/design-tokens';
import '@mfe-lab/design-tokens/tokens.css';
import {
  AppBoundaryLabel,
  UI_REACT_VERSION,
} from '@mfe-lab/ui-react';
import '@mfe-lab/ui-react/styles.css';
import {
  registerLabStatusChip,
  UI_WEB_VERSION,
} from '@mfe-lab/ui-web';
import '@mfe-lab/ui-web/react';
import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';

import { ProductsRemoteRoute } from './ProductsRemoteRoute';
import { TechnicalPanel } from './TechnicalPanel';
import { VueRemoteRoute } from './VueRemoteRoute';
import styles from './App.module.css';

registerLabStatusChip();

function HomePage() {
  return (
    <section>
      <h1>Home</h1>
      <p>Esta página pertence ao shell.</p>
    </section>
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
        <div className={styles.ownership}>
          <AppBoundaryLabel label="SHELL · REACT" />
          <small>Design tokens: {DESIGN_TOKENS_VERSION}</small>
          <small>UI React: {UI_REACT_VERSION}</small>
          <lab-status-chip
            label={`UI Web: ${UI_WEB_VERSION}`}
            status="success"
          />
        </div>

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

      {import.meta.env.DEV && <TechnicalPanel />}

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
