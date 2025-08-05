<script>
import { Button } from '$lib/components/lib/ui/button';
import { Edit } from '@lucide/svelte';

// state - global state access
import { getCommandStore } from '$lib/state/stores.state.svelte.js';
import { startEditCommand } from '$lib/state/ui.command.state.svelte.js';
import { getService } from '$lib/core/ServiceContainer.js';

// crud components
import EditCommandModal from '$lib/features/command/components/crud/EditCommandModal.svelte';

// Props - ONLY identity data
let { command } = $props();

// State access
const commandStore = $derived(getCommandStore());

// Self-contained edit handler
function handleEdit(event) {
  event.stopPropagation(); // Prevent card click events
  console.log('🔧 EditButton: Starting edit for command:', command.name);
  startEditCommand(command.id);
}

// Self-contained save handler
async function handleSaveEdit(updateData) {
  try {
    console.log('💾 EditButton: Saving command update:', updateData);
    console.log('💾 EditButton: CommandStore available methods:', Object.keys(commandStore));
    
    if (!commandStore.updateCommand) {
      throw new Error('updateCommand method not available on commandStore');
    }
    
    await commandStore.updateCommand(command.id, updateData);
    console.log('✅ EditButton: Command updated successfully');
  } catch (error) {
    console.error('❌ EditButton: Failed to update command:', error);
    throw error; // Re-throw so modal can handle the error display
  }
}
</script>

<Button variant="outline" size="sm" onclick={handleEdit}>
  <Edit class="w-3 h-3" />
</Button>

<!-- Self-contained CRUD modal -->
<EditCommandModal 
  {command} 
  onSave={handleSaveEdit}
/>
