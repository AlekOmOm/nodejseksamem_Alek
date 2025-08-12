<!--
  Job Component - Self-sufficient model
  
  Displays a single job with full self-contained functionality.
  Only requires jobId prop, manages own data and interactions.
-->

<script>
import { Card, CardContent } from '$lib/components/lib/ui/card';
import { Badge } from '$lib/components/lib/ui/badge';
import { Button } from '$lib/components/lib/ui/button';
import StatusBadge from '$lib/components/lib/ui/StatusBadge.svelte';
import { Eye, RotateCcw, Clock, CheckCircle, XCircle } from '@lucide/svelte';
import { getJobStore, getLogStore } from '$lib/state/stores.state.svelte.js';
import { getService } from '$lib/core/ServiceContainer.js';
import JobLogModal from '$lib/features/job/components/JobLogModal.svelte';

let { job } = $props();

// Store access
const jobStore = $derived(getJobStore());
const logStore = $derived(getLogStore());
const jobService = getService('jobService');

// Self-contained job data
//const job = $derived(jobStore.jobs?.find(j => j.id === jobId));

// Local modal state
let showLogModal = $state(false);

// Computed properties
const duration = $derived(() => {
  if (!job?.started_at) return null;
  const start = new Date(job.started_at);
  const end = job.finished_at ? new Date(job.finished_at) : new Date();
  const seconds = Math.round((end - start) / 1000);
  
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
});

const displayCommand = $derived(() => {
  if (!job?.command) return 'No command';
  const maxLength = 60;
  return job.command.length > maxLength
    ? job.command.substring(0, maxLength) + '...'
    : job.command;
});

const canRetry = $derived(['failed', 'error', 'canceled', 'cancelled'].includes(job?.status));

const StatusIcon = $derived(() => {
  switch (job?.status) {
    case 'completed': return CheckCircle;
    case 'failed': return XCircle;
    default: return Clock;
  }
});

const statusVariant = $derived(() => {
  switch (job?.status) {
    case 'completed': return 'default';
    case 'failed': return 'destructive';
    default: 'secondary';
  }
});

// Event handlers
function handleViewLogs() {
  showLogModal = true;
}

// TODO: retry logic should not use jobService.createJob, but rather jobService.retryJob, which should call commandService.executeCommand
async function handleRetry() {
  if (!job) return;
  try {
    await jobService.createJob({
      command: job.command,
      vmId: job.vmId,
      type: job.type
    });
  } catch (error) {
    console.error('Failed to retry job:', error);
  }
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp).toLocaleString();
}
</script>

{#if job}
  <Card class="transition-all duration-200">
    <CardContent class="p-4">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <StatusIcon
              class="w-4 h-4 {job.status === 'completed' ? 'text-green-600' : job.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}"
            />
            <span class="font-medium truncate">{displayCommand}</span>
            <StatusBadge status={statusVariant}>
              {job.status}
            </StatusBadge>
            {#if job.type}
              <Badge variant="outline" class="text-xs">
                {job.type}
              </Badge>
            {/if}
          </div>
          
          <div class="text-sm text-muted-foreground space-y-1">
            <div>Started: {formatTimestamp(job.started_at)}</div>
            {#if duration}
              <div>Duration: {duration}</div>
            {/if}
            {#if job.error}
              <div class="text-red-600">Error: {job.error}</div>
            {/if}
          </div>
          
          {#if job.command && job.command.length > 50}
            <details class="mt-2">
              <summary class="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                View command
              </summary>
              <pre class="mt-1 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap">{job.command}</pre>
            </details>
          {:else if job.command}
            <pre class="mt-2 p-2 bg-muted rounded text-xs font-mono">{job.command}</pre>
          {/if}
        </div>
        
        <div class="flex gap-1 ml-4">
          <Button variant="outline" size="sm" onclick={handleViewLogs}>
            <Eye class="w-3 h-3" />
          </Button>
          {#if canRetry}
            <Button variant="outline" size="sm" onclick={handleRetry}>
              <RotateCcw class="w-3 h-3" />
            </Button>
          {/if}
        </div>
      </div>
    </CardContent>
  </Card>

  <JobLogModal 
    {job} 
    isOpen={showLogModal} 
    onClose={() => showLogModal = false} 
  />
{/if}
