<!--
  Add Command Form Component
  
  Shows available command templates as suggestions when creating new commands.
  Uses Svelte 5 syntax with $props(), $state(), and $derived().
-->

<script>
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/lib/ui/dialog';
  import { Button } from '$lib/components/lib/ui/button';
  import { Terminal, Plus, Loader2 } from '@lucide/svelte';
  import CommandTemplate from '$lib/features/command/components/CommandTemplate.svelte';
  import { Input } from '$lib/components/lib/ui/input';
  import { Textarea } from '$lib/components/lib/ui/textarea';
  import { Label as FormLabel } from '$lib/components/lib/ui/label';
  import { getSelectedVM, getSelectedTemplateCmd } from '$lib/state/ui.state.svelte.js';
  import { getCommandStore } from '$lib/state/stores.state.svelte.js';

  // Props
  let { 
    isOpen = $bindable(false), 
    onclose = () => {} 
  } = $props();

  // State access
  const selectedVM = $derived(getSelectedVM());
  const commandStore = $derived(getCommandStore());
  const selectedTemplateCmd = $derived(getSelectedTemplateCmd());

  // Available templates from command store
  let availableTemplatesArray = $state([]);
  
  $effect(() => {
    if (commandStore) {
      const unsubscribe = commandStore.subscribe((state) => {
        availableTemplatesArray = Object.entries(state.availableCommandTemplates || {}).map(([key, config]) => ({
          id: key,
          name: key,
          cmd: config.cmd,
          type: config.type,
          description: config.description,
          hostAlias: config.hostAlias,
          timeout: config.timeout || 30000,
        }));
      });
      return unsubscribe;
    }
  });

  // Local state
  let formData = $state({
    name: '',
    cmd: '',
    type: 'ssh',
    description: '',
    timeout: 30000
  });
  let isSubmitting = $state(false);
  let errorMessage = $state('');

  function sanitizeCommand(cmd) {
    return cmd.split(/\r?\n/).map(line => line.trim()).filter(Boolean).join(' ').trim();
  }

  $effect(() => {
    if (selectedTemplateCmd) {
      formData = {
        name: selectedTemplateCmd.name,
        cmd: selectedTemplateCmd.cmd,
        type: selectedTemplateCmd.type,
        description: selectedTemplateCmd.description,
        timeout: selectedTemplateCmd.timeout || 30000
      };
    }
  });

  const isFormValid = $derived(
    formData.name.trim().length > 0 && 
    formData.cmd.trim().length > 0
  );

  function resetForm() {
    formData = {
      name: '',
      cmd: '',
      type: 'ssh',
      description: '',
      timeout: 30000
    };
    errorMessage = '';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isFormValid) {
      errorMessage = 'Name and command are required';
      return;
    }

    isSubmitting = true;
    errorMessage = '';

    try {
      const commandData = {
        name: formData.name.trim(),
        cmd: sanitizeCommand(formData.cmd),
        type: formData.type,
        description: formData.description.trim(),
        timeout: formData.timeout
      };

      await commandStore.createCommand(selectedVM.id, commandData);

      resetForm();
      onclose();
    } catch (error) {
      console.error('Failed to create command:', error);
      
      if (error.message.includes('409') || error.message.includes('Conflict')) {
        errorMessage = 'A command with this name already exists. Please choose a different name.';
      } else {
        errorMessage = error.message || 'Failed to create command';
      }
    } finally {
      isSubmitting = false;
    }
  }

  function handleClose() {
    resetForm();
    onclose();
  }
</script>

<Dialog bind:open={isOpen} class="overflow-y-auto max-w-[90vw]" >
  <DialogContent class="sm:max-w-4xl max-h-[80vh] max-w-[90vw]">
    <DialogHeader>
      <DialogTitle>Add New Command</DialogTitle>
    </DialogHeader>
    
    <div class="flex h-[60vh] gap-4 overflow-y-auto">
      <!-- Available Templates -->
      <div class="w-1/2 border-r pr-4 overflow-y-auto">
        <h3 class="text-lg font-medium mb-4">Available Templates</h3>
        
        {#if availableTemplatesArray.length > 0}
          <div class="space-y-3">
            {#each availableTemplatesArray as template (template.id)}
              <CommandTemplate {template} />
            {/each}
          </div>
        {:else}
          <div class="text-center text-muted-foreground py-8">
            <Terminal class="w-12 h-12 mx-auto mb-4" />
            <p>No command templates available</p>
          </div>
        {/if}
      </div>

      <!-- Command Form -->
      <div class="w-1/2 pl-4">
        <form onsubmit={handleSubmit} class="space-y-4">
          <div class="input-group">
            <FormLabel for="name">Command Name *</FormLabel>
            <Input
              id="name"
              bind:value={formData.name}
              placeholder="e.g., Check System Status"
              required
            />
          </div>

          <div class="input-group"dd>
            <FormLabel for="cmd">Command *</FormLabel>
            <Textarea
              id="cmd"
              bind:value={formData.cmd}
              placeholder="e.g., ps aux | head -10"
              rows="4"
              required
            />
          </div>

          <div class="input-group">
            <FormLabel for="type">Execution Type</FormLabel>
            <select
              id="type"
              bind:value={formData.type}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="ssh">SSH (Remote)</option>
              <option value="local">Local</option>
            </select>
          </div>

          <div class="input-group">
            <FormLabel for="description">Description</FormLabel>
            <Textarea
              id="description"
              bind:value={formData.description}
              placeholder="Optional description"
              rows="2"
            />
          </div>

          <div class="input-group">
            <FormLabel for="timeout">Timeout (ms)</FormLabel>
            <Input
              id="timeout"
              type="number"
              bind:value={formData.timeout}
              min="1000"
              max="300000"
              step="1000"
            />
          </div>

          {#if errorMessage}
            <div class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {errorMessage}
            </div>
          {/if}

          <div class="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onclick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isFormValid}>
              {#if isSubmitting}
                <Loader2 class="w-4 h-4 animate-spin mr-2" />
              {:else}
                <Plus class="w-4 h-4 mr-2" />
              {/if}
              Create Command
            </Button>
          </div>
        </form>
      </div>
    </div>
  </DialogContent>
</Dialog>

<style>
  .input-group {
  }
</style>