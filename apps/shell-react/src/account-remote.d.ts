declare module 'account/mount' {
  export interface AccountMountOptions {
    initialUserName: string;
    source: string;
  }

  export interface AccountMountHandle {
    unmount(): void;
  }

  export function mount(
    container: HTMLElement,
    options: AccountMountOptions,
  ): AccountMountHandle;
}
