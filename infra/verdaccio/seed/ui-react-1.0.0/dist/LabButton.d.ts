import type { MouseEventHandler, ReactNode } from 'react';

export interface LabButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'reset' | 'submit';
}

export declare function LabButton({
  children,
  className,
  disabled,
  onClick,
  type,
}: LabButtonProps): import('react').JSX.Element;
