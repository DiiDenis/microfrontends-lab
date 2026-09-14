export interface AppBoundaryLabelProps {
  className?: string;
  label: string;
}

export function AppBoundaryLabel({
  className,
  label,
}: AppBoundaryLabelProps) {
  const labelClassName = className
    ? `mfe-lab-ui-boundary-label ${className}`
    : 'mfe-lab-ui-boundary-label';

  return <span className={labelClassName}>{label}</span>;
}
