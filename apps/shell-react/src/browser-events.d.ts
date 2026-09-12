import {
  LAB_EVENT_NAMES,
  type CartUpdatedEventPayload,
  type ProfileUpdatedEventPayload,
} from '@mfe-lab/contracts';

declare global {
  interface WindowEventMap {
    [LAB_EVENT_NAMES.cartUpdated]: CustomEvent<CartUpdatedEventPayload>;
    [LAB_EVENT_NAMES.profileUpdated]: CustomEvent<ProfileUpdatedEventPayload>;
  }
}

export {};
