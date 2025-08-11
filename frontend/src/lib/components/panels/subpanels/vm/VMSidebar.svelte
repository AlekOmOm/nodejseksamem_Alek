<!--
  VM Sidebar - Pure UI Component
-->

<script>
  import VM from '$lib/features/vm/VM.svelte';
  import Grid from '$lib/components/lib/ui/Grid.svelte';
  import { getVMStore } from '$lib/state/stores.state.svelte.js';
  import { getRecentVMs, getSelectedVM } from '$lib/state/ui.state.svelte.js';

  const selectedVM = $derived(getSelectedVM());
  const vmStore = $derived(getVMStore());
  const vms = $derived(vmStore?.getVMs() || []);
  const loading = $derived(vmStore?.getLoading() || false);
  const initialized = $derived(vmStore?.isInitialized() || false);
  const error = $derived(vmStore?.getError());
  
  // Use $derived for reactive computation instead of $effect
  const recentVMs = $derived(getRecentVMs(vms));
  
  // Determine display state
  const showLoading = $derived(!initialized && loading);
  const showEmpty = $derived(initialized && !loading && vms.length === 0);
  const showVMs = $derived(initialized && !loading && vms.length > 0);
  
  // Debug logging
  $effect(() => {
    console.log("🖥️ [VMSidebar] State:", {
      vmCount: vms?.length || 0,
      loading,
      initialized,
      error,
      showLoading,
      showEmpty,
      showVMs
    });
  });
</script>

<aside class="w-full h-full bg-background border-r border-border overflow-y-auto">
  <div class="p-2 h-full">
    {#if showLoading}
      <div class="text-center py-4">
        <p class="text-xs text-muted-foreground">Loading VMs...</p>
      </div>
    {:else if error}
      <div class="text-center py-4">
        <p class="text-xs text-red-500">Error: {error}</p>
        <button 
          class="text-xs text-blue-500 hover:underline mt-2"
          onclick={() => vmStore?.loadVMs(true)}
        >
          Retry
        </button>
      </div>
    {:else if showEmpty}
      <div class="text-center py-4">
        <p class="text-xs text-muted-foreground">No VMs configured</p>
      </div>
    {:else if showVMs}
      <div class="space-y-1">
        <Grid minWidth="20vw">
          {#each (recentVMs.length > 0 ? recentVMs : vms) as vm (vm.alias)}
            <VM {vm} size="small"/>
          {/each}
        </Grid>
      </div>
    {:else}
      <div class="text-center py-4">
        <p class="text-xs text-muted-foreground">Initializing...</p>
      </div>
    {/if}
  </div>
</aside>
