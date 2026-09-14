import { jsx } from 'react/jsx-runtime';

function AppBoundaryLabel({ className, label }) {
  const labelClassName = className
    ? `mfe-lab-ui-boundary-label ${className}`
    : 'mfe-lab-ui-boundary-label';

  return jsx('span', {
    className: labelClassName,
    children: label,
  });
}

function LabButton({
  children,
  className,
  disabled = false,
  onClick,
  type = 'button',
}) {
  const buttonClassName = className
    ? `mfe-lab-ui-button ${className}`
    : 'mfe-lab-ui-button';

  return jsx('button', {
    className: buttonClassName,
    disabled,
    onClick,
    type,
    children,
  });
}

const UI_REACT_VERSION = '1.0.0';

export { AppBoundaryLabel, LabButton, UI_REACT_VERSION };
