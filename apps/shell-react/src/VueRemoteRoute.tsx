import { useEffect, useRef, useState } from 'react';
import { LabButton } from '@mfe-lab/ui-react';

import type { AccountMountHandle } from 'account/mount';

type RemoteStatus = 'error' | 'loading' | 'mounted';

export function VueRemoteRoute() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<RemoteStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    let accountHandle: AccountMountHandle | undefined;

    setStatus('loading');

    async function mountAccount() {
      try {
        const accountModule = await import('account/mount');

        if (cancelled) {
          return;
        }

        const container = containerRef.current;

        if (!container) {
          throw new Error('Container do Account não está disponível.');
        }

        accountHandle = accountModule.mount(container, {
          source: 'shell-react',
          initialUserName: 'Denis',
        });

        if (!cancelled) {
          setStatus('mounted');
        }
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }

        console.error('Falha ao carregar o remote Account.', error);
        setStatus('error');
      }
    }

    void mountAccount();

    return () => {
      cancelled = true;
      accountHandle?.unmount();
    };
  }, []);

  function retry() {
    window.location.reload();
  }

  return (
    <section aria-label="Conta remota">
      {status === 'loading' && <p role="status">Carregando Account...</p>}

      {status === 'error' && (
        <div role="alert">
          <h1>Account indisponível</h1>
          <p>O remote Vue não pôde ser carregado.</p>
          <LabButton onClick={retry}>
            Tentar novamente
          </LabButton>
        </div>
      )}

      <div ref={containerRef} hidden={status === 'error'} />
    </section>
  );
}
