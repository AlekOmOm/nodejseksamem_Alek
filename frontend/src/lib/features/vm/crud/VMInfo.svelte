<script>
  import { getSelectedVM } from '$lib/state/ui.state.svelte.js';
  
  const vm = $derived(getSelectedVM());
</script>

<!-- Selected VM Info -->
{#if vm}
  <div class="p-4 border-t border-border bg-muted">
    <div class="text-sm space-y-1">
      <div class="font-medium text-foreground">Selected VM</div>
      <div class="text-muted-foreground">{vm.name}</div>
      <div class="text-xs text-muted-foreground font-mono">
        {vm.user}@{vm.host}
      </div>
      {#if vm.cloudProvider}
        <div class="text-xs text-primary">
          {vm.cloudProvider}
        </div>
      {/if}
      <div class="text-xs text-muted-foreground">
        SSH Alias: {vm.alias}
      </div>
    </div>
  </div>
{/if}
