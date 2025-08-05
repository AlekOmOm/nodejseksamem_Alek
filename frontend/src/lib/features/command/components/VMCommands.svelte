<script>
  /**
   * VM Commands Panel Component
   * 
   * Displays a list of commands for the selected VM and provides actions to execute them.
  */
  import { Button } from '$lib/components/lib/ui/button';
  import { Terminal, Play, Loader2, Plus } from '@lucide/svelte';
  import { getService } from '$lib/core/ServiceContainer.js';
  import { getSelectedVM, getSelectedVMCommands } from '$lib/state/ui.state.svelte.js';
  import { getJobStore } from '$lib/state/stores.state.svelte.js';
  import { getCommandStore } from '$lib/state/stores.state.svelte.js';
  import Command from '$lib/features/command/Command.svelte';
  import Grid from '$lib/components/lib/ui/Grid.svelte';

  // ---------------------------
  // stores
  const jobStore = $derived(getJobStore());

  // ---------------------------
  // services
  const commandExecutor = getService('commandExecutor');
  const jobService = getService('jobService');

  // ---------------------------
  // derived state
  const selectedVM = $derived(getSelectedVM());
  const vmCommands = $derived(getSelectedVMCommands());
  const isExecutingStore = commandExecutor.getIsExecuting();
  const isExecuting = $derived($isExecutingStore);
  const isConnected = $derived(jobService.isConnected);

  // ---------------------------
  // functions
  async function executeCommand(command) {
    console.log('Executing command:', command);
    if (isExecuting || !isConnected || !selectedVM) return;

    try {
      await commandExecutor.executeCommand(selectedVM, command);
      onexecute({ command, vm: selectedVM });
    } catch (error) {
      console.error('Execution failed:', error);
    }
  }

</script>

<div class="h-full overflow-y-auto p-4 space-y-4">
  {#if !selectedVM}
    <div class="text-center text-muted-foreground py-8">
      Select a VM to view commands
    </div>
  {:else if vmCommands.length === 0}
    <div class="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-4">
      <p>No commands for {selectedVM.name} yet.</p>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" onclick={onaddcommand}>
          <Plus class="w-3 h-3 mr-1" /> Add Command
        </Button>
      </div>
    </div>
  {:else}

    <div class="space-y-3">
      <h3 class="font-semibold">Commands for {selectedVM.name}</h3>
      <Grid>
        {#each vmCommands as command}
          <Command {command} />
        {/each}
      </Grid>

       <!--
      {#each vmCommands as command}
        <Button
          variant="outline"
          size="sm"
          class="w-full justify-start h-auto p-3"
          disabled={isExecuting}
          onclick={() => executeCommand(command)}
        >
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              {#if isExecuting && jobService.currentJob?.command === command.cmd}
                <Loader2 class="w-4 h-4 animate-spin" />
              {:else}
                <Play class="w-4 h-4" />
              {/if}
              <span class="font-medium">{command.name}</span>
            </div>
            {#if command.description}
              <span class="text-xs text-muted-foreground">{command.description}</span>
            {/if}
          </div>
        </Button>
      {/each}
      -->

    </div>
  {/if}
</div>
