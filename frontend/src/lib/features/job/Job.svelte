<script>
import { Card, CardContent } from '$lib/components/lib/ui/card';
import { Button } from '$lib/components/lib/ui/button';
import StatusBadge from '$lib/components/lib/ui/StatusBadge.svelte';
import { Eye, Clock } from '@lucide/svelte';
import JobLogsView from '$lib/features/job/components/JobLogsView.svelte';
import { 
  formatDuration, 
  formatRelativeTime, 
  formatExitCode, 
  mapJobStatusToBadgeStatus,
  shouldShowFullCommand,
  isLongCommand 
} from './jobUtils.js';

let { job } = $props();

let showLogs = $state(false);

// Computed properties using utility functions
const duration = $derived(() => formatDuration(job?.startedAt, job?.finishedAt));
const formattedStartTime = $derived(() => formatRelativeTime(job?.startedAt));
const exitCodeDisplay = $derived(() => formatExitCode(job?.exitCode));
const statusVar = $derived(() => mapJobStatusToBadgeStatus(job?.status));

// event handlers
function handleViewLogs() {
  showLogs = true;
}
</script>

{#if job}
  <Card class="transition-all duration-200 w-full max-w-5xl">
    <CardContent class="p-4 w-full">
      <div class="flex items-start justify-between w-full">
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2 mb-2">
            {#if job.commandName}
              <span class="font-medium text-sm">{job.commandName}</span>
            {:else}
              <span class="font-medium text-sm text-muted-foreground">Unknown Command</span>
            {/if}

            <StatusBadge status={statusVar}>
                <span class="text-xs {job.exitCode === 0 ? 'text-green-600' : 'text-red-600'}">
                  {job.status}
                </span>
            </StatusBadge>
          </div>
          
          <div class="text-sm text-muted-foreground space-y-1">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-2">
                <!-- Start time -->
                <span>Started: {formattedStartTime()}</span>
                <!-- Duration -->
                {#if duration()}
                  <span class="text-xs text-muted-foreground bg-muted px-2 py-1 rounded flex items-center gap-1">
                    <Clock class="w-3 h-3" /> {duration()}
                  </span>
                {/if}
              </div>
              <!-- Type -->
              {#if job.type}
                <span class="text-xs bg-secondary px-2 py-1 rounded">
                  {job.type}
                </span>
              {/if}
            </div>
            {#if job.error}
              <div class="text-red-600">Error: {job.error}</div>
            {/if}
          </div>
          
          {#if shouldShowFullCommand(job.command, job.commandName)}
            {#if isLongCommand(job.command)}
              <details class="mt-2">
                <summary class="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  View full command
                </summary>
                <pre class="mt-1 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap">{job.command}</pre>
              </details>
            {:else}
              <pre class="mt-2 p-2 bg-muted rounded text-xs font-mono">{job.command}</pre>
            {/if}
          {/if}
        </div>
        
        <div class="flex gap-1 ml-4">
          <Button variant="outline" size="sm" onclick={handleViewLogs}>
            <Eye class="w-3 h-3" />
          </Button>

        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Self-contained CRUD modal -->
  <JobLogsView 
    {job} 
    bind:isOpen={showLogs} 
  />
{/if}
