<!--
  Job Log Modal Component - Svelte 5 runes pattern
-->

<script>
import Log from '$lib/features/log/Log.svelte';
import { Button } from '$lib/components/lib/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/lib/ui/dialog';
import { X, Copy } from '@lucide/svelte';
import { copyToClipboard } from '$lib/utils.js';
import { 
  loadJobLogs, 
  getCurrentJobLogs, 
  getLogsLoading, 
  getLogsError,
  clearJobLogs
} from '$lib/state/ui.logs.state.svelte.js';

let { 
  job = null, 
  isOpen = $bindable(false),
} = $props();

// Reactive state using Svelte 5 runes and derived from state
const logLines = $derived(getCurrentJobLogs());
const loading = $derived(getLogsLoading());
const error = $derived(getLogsError());

// Load logs when modal opens
$effect(async () => {
  if (isOpen && job?.id) {
    await loadJobLogs(job.id);
  } 
});
</script>

<Dialog bind:open={isOpen}>
  <DialogContent class="sm:max-w-lg">
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-background border rounded-lg max-w-4xl max-h-[80vh] w-full mx-4 flex flex-col">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="text-lg font-semibold">
            Job Logs - {job?.commandName || job?.command?.slice(0, 50) || 'Unknown'}
          </h3>
          <div>
            {#if logLines.length > 0}
              <Button variant="ghost" size="sm" onclick={() => copyToClipboard(logLines.map(line => line.data).join('\n'), 'Log')}>
                <Copy class="w-3 h-3" />
              </Button>
            {/if}

              <Button variant="ghost" size="sm" onclick={() => isOpen = false}>
                <X class="w-4 h-4" />
              </Button>
          </div>
        </div>

        <div class="flex-1 h-full overflow-y-auto">
          {#if loading}
            <div class="p-4 text-center">Loading logs...</div>
          {:else if error}
            <div class="p-4 text-center text-red-600">
              <p>Error loading logs: {error}</p>
            </div>
          {:else if logLines.length === 0}
            <div class="p-4 text-center text-muted-foreground">
              <p>No logs available for this job.</p>
            </div>
          {:else}
            <Log {logLines} class="h-full " />
          {/if}
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
