import { Component, type ErrorInfo, type ReactNode } from 'react';

interface RemoteRouteErrorBoundaryProps {
  children: ReactNode;
}

interface RemoteRouteErrorBoundaryState {
  hasError: boolean;
}

export class RemoteRouteErrorBoundary extends Component<
  RemoteRouteErrorBoundaryProps,
  RemoteRouteErrorBoundaryState
> {
  public override state: RemoteRouteErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): RemoteRouteErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Falha ao carregar a rota remota de Products.', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <section role="alert">
          <h1>Products indisponível</h1>
          <p>O remote não pôde ser carregado. Home e Account continuam disponíveis.</p>
        </section>
      );
    }

    return this.props.children;
  }
}
