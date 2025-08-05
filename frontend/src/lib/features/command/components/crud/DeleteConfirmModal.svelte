<script>
import { Button } from '$lib/components/lib/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/lib/ui/card';
import { AlertTriangle, X } from '@lucide/svelte';

// state - centralized command UI state
import { 
  getDeletingCommandId, 
  stopDeleteCommand, 
  isDeletingCommand 
} from '$lib/state/ui.command.state.svelte.js';

// Props - standardized interface
let { command, onConfirm } = $props();

// Centralized state access
const deletingCommandId = $derived(getDeletingCommandId());
const isOpen = $derived(isDeletingCommand(command.id));

async function handleConfirm() {
  await onConfirm();
  stopDeleteCommand();
}

function handleCancel() {
  stopDeleteCommand();
}
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <Card class="w-full max-w-md mx-4">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="flex items-center gap-2 text-red-600">
            <AlertTriangle class="w-5 h-5" />
            Delete Command
          </CardTitle>
          <Button variant="ghost" size="sm" onclick={handleCancel}>
            <X class="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <div class="space-y-2">
          <p class="text-sm text-gray-600">
            Are you sure you want to delete this command? This action cannot be undone.
          </p>
          
          <div class="bg-gray-50 p-3 rounded-lg">
            <h4 class="font-medium text-sm">{command.name}</h4>
            <code class="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
              {command.cmd}
            </code>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <Button variant="outline" onclick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onclick={handleConfirm}>
            Delete Command
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
{/if}
