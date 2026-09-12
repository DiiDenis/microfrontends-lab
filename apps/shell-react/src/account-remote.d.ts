declare module 'account/mount' {
  export type AccountMountOptions =
    import('@mfe-lab/contracts').AccountMountOptions;
  export type AccountMountHandle =
    import('@mfe-lab/contracts').AccountMountHandle;

  export function mount(
    container: HTMLElement,
    options: AccountMountOptions,
  ): AccountMountHandle;
}
