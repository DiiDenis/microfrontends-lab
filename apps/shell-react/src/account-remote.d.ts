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

declare module 'account/technicalInfo' {
  export const ACCOUNT_TECHNICAL_INFO: {
    readonly framework: 'Vue';
    readonly frameworkVersion: string;
    readonly remoteVersion: string;
  };
}
