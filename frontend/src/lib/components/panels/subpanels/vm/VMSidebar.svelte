<!--
  VM Sidebar - Pure UI Component
-->

<script>
  import VM from '$lib/features/vm/VM.svelte';
  import Grid from '$lib/components/lib/ui/Grid.svelte';
  import { getVMStore } from '$lib/state/stores.state.svelte.js';
  import { getRecentVMs, getSelectedVM } from '$lib/state/ui.state.svelte.js';
  import { debug } from '$lib/debug.js';

  const selectedVM = $derived(getSelectedVM());
  const vmStore = $derived(getVMStore());
  const vms = $derived(vmStore.getVMs());
  let prevSelectedVM = null;

  $effect(() => {
    if (selectedVM !== prevSelectedVM) {
      prevSelectedVM = selectedVM;
      recentVMs = getRecentVMs(vms);
      debug("VMSidebar", "$effect", "selectedVM", selectedVM);
    }
  });

  debug("VMSidebar", "vms", "sidebar", vms.length);

  let recentVMs = $derived(getRecentVMs(vms));

</script>

<aside class="w-full h-full bg-background border-r border-border overflow-y-auto">
  <div class="p-2 h-full">
    {#if !vms}
      <div class="text-center py-4">
        <p class="text-xs text-muted-foreground">Loading VMs...</p>
      </div>
    {:else if vms.length === 0}
      <div class="text-center py-4">
        <p class="text-xs text-muted-foreground">No VMs configured</p>
      </div>
    {:else}
      <div class="space-y-1">
        <Grid minWidth="20vw">
          {#if recentVMs.length === 0}
            {#each vms as vm (vm.alias) }
              <VM {vm} size="small"/>
            {/each}
          {:else}
            {#each recentVMs as vm (vm.alias)}
              <VM {vm} size="small"/>
            {/each}
          {/if}
        </Grid>
      </div>
    {/if}
  </div>
</aside>
