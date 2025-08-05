<script>
  import { getSelectedVM, getSelectedVMCommands } from '$lib/state/ui.state.svelte.js';
  import VMCommands from '$lib/features/command/components/VMCommands.svelte';
  import AddCommandForm from '$lib/features/command/components/crud/AddCommandForm.svelte';
  import { Button } from '$lib/components/lib/ui/button';
  import Terminal from '$lib/components/panels/subpanels/execution/subExecutionTab/Terminal.svelte';

  // Direct state access
  const selectedVM = $derived(getSelectedVM());
  const commands = $derived(getSelectedVMCommands());
  let prevSelectedVM = null;
  let vmCommands = $derived(getSelectedVMCommands());

  // Local UI state
  let showAddForm = $state(false);

  $effect(() => {
    if (selectedVM !== prevSelectedVM) {
      prevSelectedVM = selectedVM;
      vmCommands = getSelectedVMCommands();
    }
  });

</script>

<div class="flex flex-col h-full">
  <div class="border-b flex-none min-h-[40vh]">
    {#if !selectedVM}
      <div class="p-8 text-center text-muted-foreground">
        <h3 class="text-lg font-medium mb-2">Select a VM</h3>
        <p>Choose a virtual machine from the sidebar to view and manage commands.</p>
      </div>
    {:else if commands.length > 0}
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">VM Commands</h3>
          <Button size="sm" onclick={() => showAddForm = true}>Add Command</Button>
        </div>
        <VMCommands/>
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

    <Terminal class="flex-1" />
</div>
<AddCommandForm bind:isOpen={showAddForm} onclose={() => showAddForm = false} />
