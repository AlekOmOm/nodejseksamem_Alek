<!--
  VM Sidebar - Pure UI Component
-->

<script>
  import VM from '$lib/features/vm/VM.svelte';
  import { getVMStore } from '$lib/state/stores.state.svelte.js';
  import { getRecentVMs, getSelectedVM, getRecentVMOrder, getRefreshTrigger } from '$lib/state/ui.state.svelte.js';

  const selectedVM = $derived(getSelectedVM());
  const vmStore = $derived(getVMStore());
  const refreshTrigger = $derived(getRefreshTrigger()); // Listen to refresh
  
  // Reactive data that refreshes when refreshTrigger changes
  const vms = $derived(vmStore?.getVMs() || []);
  const loading = $derived(vmStore?.getLoading() || false);
  const initialized = $derived(vmStore?.isInitialized() || false);
  const error = $derived(vmStore?.getError());
  
  // Track recent order reactively
  const recentOrder = $derived(getRecentVMOrder());
  
  // Log when refresh triggers (for debugging)
  $effect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 [VMSidebar] Refresh triggered, VMs:', vms.length);
    }
  });
  
  // Sort VMs based on recent order - will update when recentOrder changes
  const sortedVMs = $derived(
    vms.length === 0 ? [] : (() => {
      const vmMap = new Map(vms.map(vm => [vm.alias, vm]));
      
      // Get VMs in recent order
      const recentVMs = recentOrder
        .map(alias => vmMap.get(alias))
        .filter(vm => vm !== undefined);
      
      // Get remaining VMs
      const recentSet = new Set(recentOrder);
      const otherVMs = vms.filter(vm => !recentSet.has(vm.alias));
      
      return [...recentVMs, ...otherVMs];
    })()
  );
  
  // Determine display state
  const showLoading = $derived(!initialized && loading);
  const showEmpty = $derived(initialized && !loading && vms.length === 0);
  const showVMs = $derived(initialized && !loading && vms.length > 0);
  
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
      <div class="space-y-2 px-2">
        {#each sortedVMs as vm (vm.alias)}
          <VM {vm} size="small"/>
        {/each}
      </div>
    {:else}
      <div class="text-center py-4">
        <p class="text-xs text-muted-foreground">Initializing...</p>
      </div>
    {/if}
  </div>
</aside>
