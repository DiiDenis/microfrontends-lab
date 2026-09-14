import { version as vueVersion } from 'vue';

export const ACCOUNT_REMOTE_VERSION = 'account-v1';

export const ACCOUNT_TECHNICAL_INFO = {
  framework: 'Vue',
  frameworkVersion: vueVersion,
  remoteVersion: ACCOUNT_REMOTE_VERSION,
} as const;
