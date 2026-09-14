import type { HTMLAttributes } from 'react';

import type { LabStatus, LabStatusChipElement } from './LabStatusChip';

type LabStatusChipReactProps = HTMLAttributes<LabStatusChipElement> & {
  label?: string;
  status?: LabStatus;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'lab-status-chip': LabStatusChipReactProps;
    }
  }
}

export {};
