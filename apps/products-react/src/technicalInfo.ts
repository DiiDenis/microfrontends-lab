import { UI_REACT_VERSION } from '@mfe-lab/ui-react';
import { useState, version as reactVersion } from 'react';

export const PRODUCTS_REMOTE_VERSION = 'products-v4';

export const PRODUCTS_TECHNICAL_INFO = {
  framework: 'React',
  frameworkVersion: reactVersion,
  remoteVersion: PRODUCTS_REMOTE_VERSION,
  uiReactVersion: UI_REACT_VERSION,
} as const;

export const PRODUCTS_REACT_USE_STATE_REFERENCE = useState;
