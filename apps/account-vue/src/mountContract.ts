export interface AccountMountOptions {
  initialUserName: string;
  source: string;
}

export interface AccountMountHandle {
  unmount(): void;
}
