<script>
import { Button } from '$lib/components/lib/ui/button';
import { Trash2 } from '@lucide/svelte';

// state - global state access
import { getCommandStore } from '$lib/state/stores.state.svelte.js';
import { startDeleteCommand } from '$lib/state/ui.command.state.svelte.js';

// crud components
import DeleteConfirmModal from '$lib/features/command/components/crud/DeleteConfirmModal.svelte';

// Props - ONLY identity data
let { command } = $props();

// State access
const commandStore = $derived(getCommandStore());

// Self-contained delete handler
function handleDelete(event) {
  event.stopPropagation(); // Prevent card click events
  startDeleteCommand(command.id);
}

// Self-contained confirm delete handler
async function handleConfirmDelete() {
  try {
    console.log('🗑️ DeleteButton: Deleting command:', command.name);
    console.log('🗑️ DeleteButton: CommandStore available methods:', Object.keys(commandStore));
    
    if (!commandStore.deleteCommand) {
      throw new Error('deleteCommand method not available on commandStore');
    }
    
    await commandStore.deleteCommand(command.id);
    console.log('✅ DeleteButton: Command deleted successfully');
  } catch (error) {
    console.error('❌ DeleteButton: Failed to delete command:', error);
    throw error;
  }
}
</script>

<Button variant="outline" size="sm" onclick={handleDelete}>
  <Trash2 class="w-3 h-3" />
</Button>

<!-- Self-contained CRUD modal -->
<DeleteConfirmModal
  {command}
  onConfirm={handleConfirmDelete}
/>
