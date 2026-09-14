export const LAB_STATUS_CHIP_TAG = 'lab-status-chip';

export type LabStatus = 'neutral' | 'success' | 'warning';

const styles = `
  :host {
    display: inline-block;
    font-family: var(--mfe-font-family, system-ui, sans-serif);
  }

  .chip {
    align-items: center;
    background: var(--mfe-color-surface-muted, #f8fafc);
    border: 1px solid var(--mfe-color-border, #cbd5e1);
    border-radius: var(--mfe-radius-medium, 0.5rem);
    color: var(--mfe-color-text, #0f172a);
    display: inline-flex;
    font-size: 0.75rem;
    font-weight: 700;
    gap: var(--mfe-space-1, 0.25rem);
    padding: var(--mfe-space-1, 0.25rem) var(--mfe-space-2, 0.5rem);
  }

  .chip::before {
    background: var(--mfe-color-border, #cbd5e1);
    border-radius: 50%;
    content: '';
    height: 0.5rem;
    width: 0.5rem;
  }

  .chip[data-status='success'] {
    border-color: var(--mfe-color-accent, #2563eb);
  }

  .chip[data-status='success']::before {
    background: var(--mfe-color-accent, #2563eb);
  }

  .chip[data-status='warning'] {
    border-color: var(--mfe-color-warning, #d97706);
  }

  .chip[data-status='warning']::before {
    background: var(--mfe-color-warning, #d97706);
  }
`;

function isLabStatus(value: string | null): value is LabStatus {
  return value === 'neutral' || value === 'success' || value === 'warning';
}

function normalizeStatus(value: string | null): LabStatus {
  return isLabStatus(value) ? value : 'neutral';
}

export class LabStatusChipElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['label', 'status'];
  }

  readonly #labelElement: HTMLSpanElement;

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });
    const styleElement = document.createElement('style');
    this.#labelElement = document.createElement('span');

    styleElement.textContent = styles;
    this.#labelElement.className = 'chip';
    shadowRoot.append(styleElement, this.#labelElement);
  }

  get label(): string {
    return this.getAttribute('label') ?? '';
  }

  set label(value: string) {
    this.setAttribute('label', value);
  }

  get status(): LabStatus {
    return normalizeStatus(this.getAttribute('status'));
  }

  set status(value: LabStatus) {
    this.setAttribute('status', value);
  }

  connectedCallback(): void {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'status');
    }

    this.#render();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  #render(): void {
    this.#labelElement.dataset.status = this.status;
    this.#labelElement.textContent = this.label;
  }
}

export function registerLabStatusChip(): void {
  if (!customElements.get(LAB_STATUS_CHIP_TAG)) {
    customElements.define(LAB_STATUS_CHIP_TAG, LabStatusChipElement);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lab-status-chip': LabStatusChipElement;
  }
}
