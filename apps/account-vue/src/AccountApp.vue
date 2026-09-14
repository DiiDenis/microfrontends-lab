<script setup lang="ts">
import {
  LAB_EVENT_NAMES,
  type AccountRole,
  type ProfileUpdatedEventPayload,
} from '@mfe-lab/contracts';
import { DESIGN_TOKENS_VERSION } from '@mfe-lab/design-tokens';
import '@mfe-lab/design-tokens/tokens.css';
import {
  registerLabStatusChip,
  UI_WEB_VERSION,
} from '@mfe-lab/ui-web';
import { ref, watch } from 'vue';

import { ACCOUNT_REMOTE_VERSION } from './technicalInfo';

registerLabStatusChip();

const props = defineProps<{
  initialUserName: string;
  source: string;
}>();

const name = props.initialUserName;
const role = ref<AccountRole>('Administrador');

watch(
  role,
  (currentRole) => {
    window.dispatchEvent(
      new CustomEvent<ProfileUpdatedEventPayload>(
        LAB_EVENT_NAMES.profileUpdated,
        {
          detail: { name, role: currentRole },
        },
      ),
    );
  },
  { immediate: true },
);

function toggleRole() {
  role.value = role.value === 'Administrador' ? 'Operador' : 'Administrador';
}
</script>

<template>
  <main class="account" data-mfe-owner="account-vue">
    <div class="ownership">
      <span class="owner">ACCOUNT · VUE · STANDALONE</span>
      <small>Design tokens: {{ DESIGN_TOKENS_VERSION }}</small>
      <lab-status-chip
        :label="`UI Web: ${UI_WEB_VERSION}`"
        status="warning"
      />
    </div>
    <h1 class="title">Minha conta</h1>
    <p>Remote version: {{ ACCOUNT_REMOTE_VERSION }}</p>
    <p>Origem: {{ source }}</p>

    <dl class="details">
      <div>
        <dt>Nome</dt>
        <dd>{{ name }}</dd>
      </div>
      <div>
        <dt>Papel</dt>
        <dd>{{ role }}</dd>
      </div>
    </dl>

    <button type="button" @click="toggleRole">Alternar papel</button>
  </main>
</template>

<style scoped>
.account {
  color: var(--mfe-color-text);
  margin: 0 auto;
  max-width: 40rem;
  padding: var(--mfe-space-4);
}

.title {
  margin-bottom: var(--mfe-space-2);
}

.ownership {
  display: grid;
  gap: var(--mfe-space-1);
}

.owner {
  color: var(--mfe-color-accent);
  font-weight: 700;
}

.details {
  display: grid;
  gap: var(--mfe-space-3);
  margin: var(--mfe-space-4) 0;
}

.details div {
  background: var(--mfe-color-surface);
  border: 1px solid var(--mfe-color-border);
  border-radius: var(--mfe-radius-medium);
  padding: var(--mfe-space-3);
}

.details dd {
  margin: var(--mfe-space-1) 0 0;
}

button {
  background: var(--mfe-color-accent);
  border: 0;
  border-radius: var(--mfe-radius-small);
  color: var(--mfe-color-surface);
  padding: var(--mfe-space-2) var(--mfe-space-3);
}
</style>
