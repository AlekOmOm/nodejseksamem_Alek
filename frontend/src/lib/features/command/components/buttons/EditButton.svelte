<script>
import { Button } from '$lib/components/lib/ui/button';
import { Edit } from '@lucide/svelte';

// crud components
import EditCommandModal from '$lib/features/command/components/crud/EditCommandModal.svelte';

// Props - ONLY identity data
let { command } = $props();

// Local state for modal
let showEditModal = $state(false);

// Self-contained edit handler
function handleEdit(event) {
  event.stopPropagation(); // Prevent card click events
  showEditModal = true;
}
</script>

<Button variant="outline" size="sm" onclick={handleEdit}>
  <Edit class="w-3 h-3" />
</Button>

<!-- Self-contained CRUD modal -->
<EditCommandModal 
  {command} 
  bind:isOpen={showEditModal}
/>
