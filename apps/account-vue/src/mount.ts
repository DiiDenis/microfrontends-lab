import type { AccountMountHandle, AccountMountOptions } from '@mfe-lab/contracts';

import { createAccountApp } from './createAccountApp';

export type { AccountMountHandle, AccountMountOptions } from '@mfe-lab/contracts';

const mountedAccounts = new WeakMap<HTMLElement, AccountMountHandle>();

export function mount(
  container: HTMLElement,
  options: AccountMountOptions,
): AccountMountHandle {
  if (!(container instanceof HTMLElement)) {
    throw new TypeError('Account precisa receber um HTMLElement válido.');
  }

  if (mountedAccounts.has(container)) {
    throw new Error('Account já está montado neste container.');
  }

  const accountApp = createAccountApp(options);
  let isMounted = false;

  const handle: AccountMountHandle = {
    unmount() {
      if (!isMounted) {
        return;
      }

      try {
        accountApp.unmount();
      } finally {
        mountedAccounts.delete(container);
        container.replaceChildren();
        isMounted = false;
      }
    },
  };

  try {
    accountApp.mount(container);
    isMounted = true;
    mountedAccounts.set(container, handle);
  } catch (error: unknown) {
    try {
      accountApp.unmount();
    } catch (cleanupError: unknown) {
      if (import.meta.env.DEV) {
        console.error(
          'Falha ao limpar uma montagem incompleta de Account.',
          cleanupError,
        );
      }
    } finally {
      mountedAccounts.delete(container);
      container.replaceChildren();
    }

    throw error;
  }

  return handle;
}
