import { createApp } from 'vue';

import AccountApp from './AccountApp.vue';
import type { AccountMountOptions } from './mountContract';

export function createAccountApp(options: AccountMountOptions) {
  return createApp(AccountApp, {
    initialUserName: options.initialUserName,
    source: options.source,
  });
}
