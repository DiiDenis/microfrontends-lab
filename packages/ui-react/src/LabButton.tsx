import type { MouseEventHandler, ReactNode } from 'react';

export interface LabButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  size?: 'default' | 'compact';
  type?: 'button' | 'reset' | 'submit';
}

export function LabButton({
  children,
  className,
  disabled = false,
  onClick,
  size = 'default',
  type = 'button',
}: LabButtonProps) {
  const buttonClassNames = [
    'mfe-lab-ui-button',
    size === 'compact' ? 'mfe-lab-ui-button--compact' : '',
    className,
  ].filter(Boolean);

  return (
    <button
      className={buttonClassNames.join(' ')}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
