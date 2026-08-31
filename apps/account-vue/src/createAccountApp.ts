import { createApp } from 'vue';

import AccountApp from './AccountApp.vue';

export function createAccountApp() {
  return createApp(AccountApp);
}

