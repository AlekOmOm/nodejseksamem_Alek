<!--
  VM Management Panel - Simplified
-->

<script>
  import { getVMStore } from '$lib/state/stores.state.svelte.js';
  import VMSidebar from '$lib/components/panels/subpanels/vm/VMSidebar.svelte';

  const vmStore = $derived(getVMStore());

  // Only handle manual refresh, not initial loading
  async function handleRefreshVMs() {

    await vmStore?.loadVMs(true);
  }
</script>

<div class="h-full flex flex-col">
  <header class="p-4 border-b">
    <h2 class="text-lg font-semibold">Virtual Machines</h2>
    <button onclick={handleRefreshVMs}>Refresh</button>
  </header>

  <div class="flex-1 overflow-hidden">
    <VMSidebar/>
  </div>
</div>
