import type { MouseEventHandler, ReactNode } from 'react';

export interface LabButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'reset' | 'submit';
}

export function LabButton({
  children,
  className,
  disabled = false,
  onClick,
  type = 'button',
}: LabButtonProps) {
  const buttonClassName = className
    ? `mfe-lab-ui-button ${className}`
    : 'mfe-lab-ui-button';

  return (
    <button
      className={buttonClassName}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
