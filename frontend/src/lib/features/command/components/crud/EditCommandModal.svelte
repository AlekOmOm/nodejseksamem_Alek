<script>
import { Button } from '$lib/components/lib/ui/button';
import { Input } from '$lib/components/lib/ui/input';
import { Label } from '$lib/components/lib/ui/label';
import { Textarea } from '$lib/components/lib/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/lib/ui/card';
import { X, Terminal, Loader2 } from '@lucide/svelte';

// state - centralized command UI state
import { 
  getEditingCommandId, 
  stopEditCommand, 
  isEditingCommand 
} from '$lib/state/ui.command.state.svelte.js';

// Props - standardized interface
let { command, onSave  } = $props();

// Centralized state access
const editingCommandId = $derived(getEditingCommandId());
const isOpen = $derived(isEditingCommand(command.id));

// Form state
let formData = $state({
  name: command?.name || '',
  cmd: command?.cmd || '',
  type: command?.type || 'ssh',
  description: command?.description || '',
  timeout: command?.timeout || 30000
});

// Local UI state
let loading = $state(false);
let error = $state('');

// Reset form when modal opens
$effect(() => {
  if (isOpen) {
    formData = {
      name: command?.name || '',
      cmd: command?.cmd || '',
      type: command?.type || 'ssh',
      description: command?.description || '',
      timeout: command?.timeout || 30000
    };
    error = ''; // Clear any previous errors
    loading = false;
  }
});

async function handleSubmit() {
  if (loading) return;
  
  loading = true;
  error = '';
  
  try {
    await onSave(formData);
    stopEditCommand();
  } catch (err) {
    console.error('Failed to update command:', err);
    error = err.message || 'Failed to update command';
  } finally {
    loading = false;
  }
}

function handleCancel() {
  stopEditCommand();
}
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <Card class="w-full max-w-2xl mx-4">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="flex items-center gap-2">
            <Terminal class="w-5 h-5" />
            Edit Command
          </CardTitle>
          <Button variant="ghost" size="sm" onclick={handleCancel}>
            <X class="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="name">Command Name *</Label>
          <Input
            id="name"
            bind:value={formData.name}
            placeholder="e.g., Check System Status"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="cmd">Command *</Label>
          <Textarea
            id="cmd"
            bind:value={formData.cmd}
            placeholder="e.g., ps aux | head -10"
            rows="3"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="type">Execution Type</Label>
          <select
            id="type"
            bind:value={formData.type}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="ssh">SSH (Remote)</option>
            <option value="local">Local</option>
          </select>
        </div>

        <div class="space-y-2">
          <Label for="description">Description</Label>
          <Textarea
            id="description"
            bind:value={formData.description}
            placeholder="Optional description of what this command does"
            rows="2"
          />
        </div>

        <div class="space-y-2">
          <Label for="timeout">Timeout (ms)</Label>
          <Input
            id="timeout"
            type="number"
            bind:value={formData.timeout}
            min="1000"
            max="300000"
            step="1000"
          />
        </div>

        {#if error}
          <div class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        {/if}

        <div class="flex justify-end gap-3 pt-4">
          <Button variant="outline" onclick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onclick={handleSubmit} disabled={loading}>
            {#if loading}
              <Loader2 class="w-4 h-4 animate-spin mr-2" />
            {/if}
            Update Command
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
{/if}
