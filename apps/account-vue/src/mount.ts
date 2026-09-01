import { createAccountApp } from './createAccountApp';
import type { AccountMountHandle, AccountMountOptions } from './mountContract';

export type { AccountMountHandle, AccountMountOptions } from './mountContract';

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
  let isMounted = true;

  const handle: AccountMountHandle = {
    unmount() {
      if (!isMounted) {
        return;
      }

      accountApp.unmount();
      mountedAccounts.delete(container);
      isMounted = false;
    },
  };

  accountApp.mount(container);
  mountedAccounts.set(container, handle);

  return handle;
}
