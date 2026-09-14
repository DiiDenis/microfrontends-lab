import { describe, expect, it } from 'vitest';

import {
  LAB_EVENT_NAMES,
  type CartUpdatedEventPayload,
  type ProfileUpdatedEventPayload,
} from '../../packages/contracts/src/index';

describe('contratos runtime entre micro frontends', () => {
  it('mantém nomes de eventos públicos e distintos', () => {
    expect(LAB_EVENT_NAMES).toEqual({
      cartUpdated: 'mfe-lab:cart-updated',
      profileUpdated: 'mfe-lab:profile-updated',
    });
    expect(new Set(Object.values(LAB_EVENT_NAMES)).size).toBe(2);
  });

  it('transporta os payloads públicos em CustomEvent', () => {
    const cartPayload = { totalItems: 2 } satisfies CartUpdatedEventPayload;
    const profilePayload = {
      name: 'Denis',
      role: 'Operador',
    } satisfies ProfileUpdatedEventPayload;

    const cartEvent = new CustomEvent(LAB_EVENT_NAMES.cartUpdated, {
      detail: cartPayload,
    });
    const profileEvent = new CustomEvent(LAB_EVENT_NAMES.profileUpdated, {
      detail: profilePayload,
    });

    expect(cartEvent.detail).toEqual({ totalItems: 2 });
    expect(profileEvent.detail).toEqual({
      name: 'Denis',
      role: 'Operador',
    });
  });
});
