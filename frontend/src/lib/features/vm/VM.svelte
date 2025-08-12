<!--
  VM Component
  
  Displays a single VM with its details and action buttons.
  Supports editing, deletion, and selection operations.
-->

<script>
  // ui
  import { Button } from '$lib/components/lib/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/lib/ui/card';
  import { Badge } from '$lib/components/lib/ui/badge';
  import { Server, Edit, Settings, CheckCircle2 } from '@lucide/svelte';
  
  // state - global state access
  import { getSelectedVMId, getSelectedVM, selectVM } from '$lib/state/ui.state.svelte.js';
  import { getCommandStore } from '$lib/state/stores.state.svelte.js';
  import { startEdit } from '$lib/state/ui.state.svelte.js';
  
  // crud components
  import VmForm from '$lib/features/vm/crud/VMForm.svelte';

  // Props - ONLY identity data
  let { vm, size = null} = $props();

  let sizeSet = $state(false);

  if (size !== null) {
    sizeSet = true;
  }
 
  // State access
  const selectedVM = $derived(getSelectedVM());
  const selectedVMId = $derived(getSelectedVMId());
  const commandStore = $derived(getCommandStore());
  
  // Get command count from store
  const commandCount = $derived(
    commandStore ? commandStore.getCommandCount(vm.id) : 0
  );
  
  // Local UI state
  let showVMForm = $state(false);
  let showCommandsModal = $state(false);

  // Computed
  let isSelected = $derived(vm.id === selectedVMId);

  const environmentVariant = $derived(
    vm.environment === 'production' ? 'destructive' : 
    vm.environment === 'staging' ? 'secondary' : 'default'
  );
  const environmentLabel = $derived(
    vm.environment === 'production' ? 'prod' :
    vm.environment === 'staging' ? 'staging' : 'dev'
  );

  // Event Handlers - self-contained
  function handleVMSelect() {
    selectVM(vm);
  }
  
  function handleEdit() {
    showVMForm = true;
  }

  function handleManageCommands(e) {
    e.stopPropagation();
    showCommandsModal = true;
  }

  async function handleDelete() {
    try {
      await vmStore.deleteVM(vm.id);
      toastActions.vm.deleted(vm.name);
    } catch (error) {
      toastActions.vm.error('delete', error);
    }
  }
</script>

<div onclick={handleVMSelect} onkeydown={e => (e.key === 'Enter' || e.key === ' ') && handleVMSelect()} role="button" tabindex="0" class="cursor-pointer">
  <Card class="transition-all duration-200  {!sizeSet ? '' : `p-${1}`} {isSelected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'}">
  <CardHeader class="pb-2">
    <div class="flex items-start justify-between">
      <div class="flex flex-col gap-2 pt-2">
        <div class="flex items-center gap-2">
          <div class="p-1 bg-primary/10 rounded-lg flex items-center justify-center">
            <Server class="w-4 h-4 text-primary" />
          </div>
          <div class="flex items-center gap-1">
            <Badge variant={environmentVariant} class="text-xs">
              {environmentLabel}
            </Badge>
          </div>
          <div class="ml-auto">
            {#if isSelected}
              <CheckCircle2 class="w-4 h-4 text-green-600" />
            {/if}
          </div>
        </div>
        <div>
          <CardTitle class="text-base flex items-center gap-2">
            {vm.name}
          </CardTitle>
          <p class="text-xs text-muted-foreground mt-1 break-all">
            <span>{vm.user}</span>
          </p>
          <p class="text-xs text-muted-foreground mt-1 break-all">
            <span>@{vm.host}</span> 
          </p>
        </div>
      </div>
    </div>
  </CardHeader>

  <CardContent class="pt-0">
    <div class="flex items-center justify-between">
      <div class="text-xs text-muted-foreground">
        {commandCount} command{commandCount !== 1 ? 's' : ''}
      </div>
      <div class="flex gap-1">
        <Button variant="ghost" size="sm" onclick={handleEdit}>
          <Edit class="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="sm" onclick={handleManageCommands}>
          <Settings class="w-3 h-3" />
        </Button>
      </div>
    </div>
  </CardContent>
  </Card>
</div>

<VmForm vm={vm} bind:isOpen={showVMForm} />
