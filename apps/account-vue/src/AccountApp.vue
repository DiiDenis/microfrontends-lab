<script setup lang="ts">
import { ref } from 'vue';

type AccountRole = 'Administrador' | 'Operador';

const name = 'Denis';
const role = ref<AccountRole>('Administrador');

function toggleRole() {
  role.value = role.value === 'Administrador' ? 'Operador' : 'Administrador';
}
</script>

<template>
  <main class="account">
    <span class="owner">ACCOUNT · VUE · STANDALONE</span>
    <h1>Minha conta</h1>

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
  font-family: system-ui, sans-serif;
  margin: 0 auto;
  max-width: 40rem;
  padding: 1.5rem;
}

.owner {
  font-weight: 700;
}

.details {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
}

.details div {
  border: 1px solid #cbd5e1;
  padding: 1rem;
}

.details dd {
  margin: 0.25rem 0 0;
}
</style>

