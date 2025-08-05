<script>
import { Button } from '$lib/components/lib/ui/button';
import { Play, Loader2 } from '@lucide/svelte';

// state - global state access
import { getSelectedVM } from '$lib/state/ui.state.svelte.js';
import { getService } from '$lib/core/ServiceContainer.js';

// Props - ONLY identity data
let { command } = $props();

// State access
const selectedVM = $derived(getSelectedVM());
const commandExecutor = getService('commandExecutor');

// Execution state
const isExecuting = $derived(commandExecutor.getIsExecuting());
const currentCommand = $derived(commandExecutor.getCurrentCommand());
const isCurrentCommand = $derived(currentCommand?.cmd === command.cmd);

// Self-contained execution handler
async function handleExecute() {
  if (!selectedVM || isExecuting) return;
  
  try {
    await commandExecutor.executeCommand(selectedVM, command);
  } catch (error) {
    console.error('Command execution failed:', error);
    // Could emit custom event or use toast notification here
  }
}
</script>

<Button 
  variant={isCurrentCommand ? 'secondary' : 'default'} 
  size="sm" 
  onclick={handleExecute} 
  class="flex-1"
>
  {#if isCurrentCommand}
    <Loader2 class="w-3 h-3 mr-1 animate-spin" /> Running
  {:else}
    <Play class="w-3 h-3 mr-1" /> Execute
  {/if}
</Button>
