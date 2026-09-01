import { lazy, Suspense } from 'react';

const RemoteProductApp = lazy(async () => {
  const remoteModule = await import('products/ProductApp');

  return { default: remoteModule.ProductApp };
});

export default function ProductsRemoteModule() {
  return (
    <Suspense fallback={<p role="status">Carregando módulo remoto de Products...</p>}>
      <RemoteProductApp />
    </Suspense>
  );
}
