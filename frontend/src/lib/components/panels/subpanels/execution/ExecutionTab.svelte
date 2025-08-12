<script>
  import { getSelectedVM, getSelectedVMCommands } from '$lib/state/ui.state.svelte.js';
  import VMCommands from '$lib/features/command/components/VMCommands.svelte';
  import AddCommandForm from '$lib/features/command/components/crud/AddCommandForm.svelte';
  import { Button } from '$lib/components/lib/ui/button';
  import Terminal from '$lib/components/panels/subpanels/execution/subExecutionTab/Terminal.svelte';

  // Direct state access
  const selectedVM = $derived(getSelectedVM());
  const commands = $derived(getSelectedVMCommands());
  let vmCommands = $derived(getSelectedVMCommands());

  // Local UI state
  let showAddForm = $state(false);

  $effect(() => {
    if (selectedVM) {
      vmCommands = getSelectedVMCommands();
    }
  });

</script>

<div class="h-full w-full flex flex-col overflow-y-auto">
  <div class="h-full w-full border-b flex-1 overflow-y-auto pb-0">
    {#if !selectedVM}
      <div class="p-8 text-center text-muted-foreground">
        <h3 class="text-lg font-medium mb-2">Select a VM</h3>
        <p>Choose a virtual machine from the sidebar to view and manage commands.</p>
      </div>
    {:else if commands.length > 0}
      <div class="h-full flex flex-col">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="text-lg font-semibold">VM Commands</h3>
          <Button size="sm" onclick={() => showAddForm = true}>Add Command</Button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <VMCommands/>
        </div>
      </div>
    {:else}
      <div class="p-8 text-center space-y-4">
        <div class="text-muted-foreground">
          <h3 class="text-lg font-medium mb-2">No Commands Configured</h3>
          <p>No commands have been set up for <strong>{selectedVM.name}</strong>.</p>
        </div>
        <Button onclick={() => showAddForm = true}>Add First Command</Button>
      </div>
    {/if}
  </div>
  <Terminal />
</div>
<AddCommandForm bind:isOpen={showAddForm} onclose={() => showAddForm = false} />
