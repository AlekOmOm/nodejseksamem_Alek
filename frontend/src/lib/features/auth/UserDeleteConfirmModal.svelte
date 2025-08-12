<script>
import { Button } from '$lib/components/lib/ui/button';
import * as Card from '$lib/components/lib/ui/card';
import { AlertTriangle, X } from '@lucide/svelte';
import { getService } from '$lib/core/ServiceContainer.js';
import { toastActions } from '$lib/stores/toast.store.svelte.js';

const authService = getService('authService');

// Props
let { isOpen = $bindable(false), onClose, deleteType } = $props();

// deleteType can be 'user' or 'all-data'
const deleteMessages = {
  'user': {
    title: 'Delete User Account',
    warning: 'Are you sure you want to delete your user account? This action cannot be undone.',
    buttonText: 'Delete User'
  },
  'all-data': {
    title: 'Delete All Data',
    warning: 'Are you sure you want to delete ALL data including your user account, VMs, and commands? This action cannot be undone.',
    buttonText: 'Delete All Data'
  }
};

const message = $derived(deleteMessages[deleteType] || deleteMessages['user']);

async function handleConfirm() {
  try {
    if (deleteType === 'all-data') {
      await authService.deleteAllUserData();
      toastActions.auth.allDataDeleted();
    } else {
      await authService.deleteUser();
      toastActions.auth.userDeleted();
    }
    onClose?.();
    // Redirect to login or home after successful deletion
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  } catch (error) {
    console.error('Deletion failed:', error);
    toastActions.auth.deletionError(error);
  }
}

function handleCancel() {
  onClose?.();
}
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <Card.Root class="w-full max-w-md mx-4">
      <Card.Header>
        <div class="flex items-center justify-between">
          <Card.Title class="flex items-center gap-2 text-red-600">
            <AlertTriangle class="w-5 h-5" />
            {message.title}
          </Card.Title>
          <Button variant="ghost" size="sm" onclick={handleCancel}>
            <X class="w-4 h-4" />
          </Button>
        </div>
      </Card.Header>

      <Card.Content class="space-y-4">
        <div class="space-y-2">
          <p class="text-sm text-gray-600">
            {message.warning}
          </p>
          
          {#if deleteType === 'all-data'}
            <div class="bg-red-50 p-3 rounded-lg border border-red-200">
              <p class="text-sm text-red-800 font-medium">
                This will permanently delete:
              </p>
              <ul class="text-xs text-red-700 mt-1 space-y-1">
                <li>• Your user account</li>
                <li>• All VM configurations</li>
                <li>• All command definitions</li>
                <li>• All job history and logs</li>
              </ul>
            </div>
          {/if}
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <Button variant="outline" onclick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onclick={handleConfirm}>
            {message.buttonText}
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
  </div>
{/if}