import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useState,
} from 'react';

import { LabButton } from '@mfe-lab/ui-react';

import styles from './App.module.css';

type ProductsLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; ProductApp: ComponentType }
  | { status: 'load-error' };

interface ProductsRenderBoundaryProps {
  children: ReactNode;
}

interface ProductsRenderBoundaryState {
  hasError: boolean;
}

class ProductsRenderBoundary extends Component<
  ProductsRenderBoundaryProps,
  ProductsRenderBoundaryState
> {
  public override state: ProductsRenderBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ProductsRenderBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(
        'Falha de renderização no remote Products.',
        error,
        errorInfo,
      );
    }
  }

  private retryRender = () => {
    this.setState({ hasError: false });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className={styles.remoteFallback} role="alert">
          <h1>Products indisponível</h1>
          <p>O remote Products falhou durante a renderização.</p>
          <LabButton onClick={this.retryRender}>Tentar novamente</LabButton>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ProductsRemoteRoute() {
  const [loadState, setLoadState] = useState<ProductsLoadState>({
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const remoteModule = await import('products/ProductApp');

        if (!cancelled) {
          setLoadState({
            status: 'loaded',
            ProductApp: remoteModule.ProductApp,
          });
        }
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }

        if (import.meta.env.DEV) {
          console.error('Falha ao importar o remote Products.', error);
        }

        setLoadState({ status: 'load-error' });
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadState.status === 'loading') {
    return <p role="status">Carregando remote Products...</p>;
  }

  if (loadState.status === 'load-error') {
    return (
      <div className={styles.remoteFallback} role="alert">
        <h1>Products indisponível</h1>
        <p>Não foi possível carregar o remote Products.</p>
        <LabButton onClick={() => window.location.reload()}>
          Tentar novamente
        </LabButton>
      </div>
    );
  }

  const { ProductApp } = loadState;

  return (
    <ProductsRenderBoundary>
      <ProductApp />
    </ProductsRenderBoundary>
  );
}
