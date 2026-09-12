export type AccountRole = 'Administrador' | 'Operador';

export interface AccountMountOptions {
  initialUserName: string;
  source: string;
}

export interface AccountMountHandle {
  unmount(): void;
}

export const LAB_EVENT_NAMES = {
  cartUpdated: 'mfe-lab:cart-updated',
  profileUpdated: 'mfe-lab:profile-updated',
} as const;

export interface CartUpdatedEventPayload {
  totalItems: number;
}

export interface ProfileUpdatedEventPayload {
  name: string;
  role: AccountRole;
}
