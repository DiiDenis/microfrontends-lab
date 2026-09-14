import { useEffect, useRef, useState } from 'react';
import { LabButton } from '@mfe-lab/ui-react';

import type { AccountMountHandle } from 'account/mount';

import styles from './App.module.css';

type RemoteStatus = 'error' | 'loading' | 'mounted';
type AccountFailurePhase = 'import' | 'mount';

export function VueRemoteRoute() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<RemoteStatus>('loading');
  const [failurePhase, setFailurePhase] =
    useState<AccountFailurePhase | null>(null);

  useEffect(() => {
    let cancelled = false;
    let accountHandle: AccountMountHandle | undefined;

    setStatus('loading');

    function reportFailure(phase: AccountFailurePhase, error: unknown) {
      if (cancelled) {
        return;
      }

      if (import.meta.env.DEV) {
        console.error(
          phase === 'import'
            ? 'Falha ao importar o remote Account.'
            : 'Falha ao montar o remote Account.',
          error,
        );
      }

      containerRef.current?.replaceChildren();
      setFailurePhase(phase);
      setStatus('error');
    }

    async function mountAccount() {
      let accountModule: typeof import('account/mount');

      try {
        accountModule = await import('account/mount');
      } catch (error: unknown) {
        reportFailure('import', error);
        return;
      }

      if (cancelled) {
        return;
      }

      const container = containerRef.current;

      if (!container) {
        reportFailure(
          'mount',
          new Error('Container do Account não está disponível.'),
        );
        return;
      }

      try {
        accountHandle = accountModule.mount(container, {
          source: 'shell-react',
          initialUserName: 'Denis',
        });

        if (!cancelled) {
          setStatus('mounted');
        }
      } catch (error: unknown) {
        accountHandle?.unmount();
        accountHandle = undefined;
        reportFailure('mount', error);
      }
    }

    void mountAccount();

    return () => {
      cancelled = true;

      try {
        accountHandle?.unmount();
      } catch (error: unknown) {
        if (import.meta.env.DEV) {
          console.error('Falha no cleanup do remote Account.', error);
        }
      } finally {
        accountHandle = undefined;
        containerRef.current?.replaceChildren();
      }
    };
  }, []);

  function retry() {
    window.location.reload();
  }

  return (
    <section aria-label="Conta remota">
      {status === 'loading' && <p role="status">Carregando Account...</p>}

      {status === 'error' && (
        <div className={styles.remoteFallback} role="alert">
          <h1>Account indisponível</h1>
          <p>
            {failurePhase === 'mount'
              ? 'O remote Account foi carregado, mas falhou durante a montagem.'
              : 'Não foi possível importar o remote Account.'}
          </p>
          <LabButton onClick={retry}>
            Tentar novamente
          </LabButton>
        </div>
      )}

      <div ref={containerRef} hidden={status === 'error'} />
    </section>
  );
}
