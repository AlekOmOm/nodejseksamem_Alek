<!--
  Job Log Modal Component - Enhanced with logStore integration
-->

<script>
import { getLogStore } from '$lib/state/stores.state.svelte.js';
import Log from '$lib/features/log/Log.svelte';
import { Button } from '$lib/components/lib/ui/button';
import { X } from '@lucide/svelte';

let { job = null, isOpen = false, onClose = () => {} } = $props();

const logStore = $derived(getLogStore());
const logLines = $derived(logStore.logs || []);
const loading = $derived(logStore.loading);

$effect(async () => {
  if (isOpen && job?.id) {
    await logStore.loadLogs(job.id);
  }
});
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-background border rounded-lg max-w-4xl max-h-[80vh] w-full mx-4 flex flex-col">
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-lg font-semibold">Job Logs - {job?.command?.slice(0, 50) || 'Unknown'}</h3>
        <Button variant="ghost" size="sm" onclick={onClose}>
          <X class="w-4 h-4" />
        </Button>
      </div>
      
      <div class="flex-1 overflow-hidden">
        {#if loading}
          <div class="p-4 text-center">Loading logs...</div>
        {:else}
          <Log {logLines} class="h-full" />
        {/if}
      </div>
    </div>
  </div>
{/if}
