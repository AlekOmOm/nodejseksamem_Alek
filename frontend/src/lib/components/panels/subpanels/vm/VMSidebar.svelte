<!--
  VM Sidebar - Pure UI Component
-->

<script>
  import VM from '$lib/features/vm/VM.svelte';
  import { getSortedVMs, getIsUIInitialized } from '$lib/state/ui.state.svelte.js';

  const isUIInitialized = $derived(getIsUIInitialized());
  const sortedVMs = $derived(getSortedVMs());
  
</script>

<aside class="w-full h-full bg-background border-r border-border overflow-y-auto">
  {#if isUIInitialized}
    <div class="p-2 h-full">
        <div class="space-y-2 px-2">
          {#each sortedVMs as vm (vm.alias)}
            <VM {vm} size="small"/>
          {/each}
        </div>
    </div>
  {:else}
    <div class="flex items-center justify-center h-full text-muted-foreground text-sm">Loading VMs...</div>
  {/if}
</aside>
