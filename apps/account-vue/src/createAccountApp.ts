import type { AccountMountOptions } from '@mfe-lab/contracts';
import { createApp } from 'vue';

import AccountApp from './AccountApp.vue';

export function createAccountApp(options: AccountMountOptions) {
  return createApp(AccountApp, {
    initialUserName: options.initialUserName,
    source: options.source,
  });
}
