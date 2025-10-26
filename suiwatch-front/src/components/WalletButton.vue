<template>
  <button @click="handleConnect" class="px-4 py-2 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition">
    Connect Wallet
  </button>
</template>

<script setup lang="ts">
import { getUniversalConnector } from '../walletConfig'

async function handleConnect() {
  const connector = await getUniversalConnector();
  if (!connector) return;
  await connector.connect();
}
</script>
