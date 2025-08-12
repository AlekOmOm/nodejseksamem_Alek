<!--
  Job Component - Self-sufficient model
  
  Displays a single job with full self-contained functionality.
  Only requires jobId prop, manages own data and interactions.

  jobs:
  {
    "id": "1",
    "command": "echo 'Hello, world!'",
    "command_name": "Hello World",
    "status": "completed",
  }
-->

<script>
import { onMount } from 'svelte';
import { Card, CardContent } from '$lib/components/lib/ui/card';
import { Badge } from '$lib/components/lib/ui/badge';
import { Button } from '$lib/components/lib/ui/button';
import StatusBadge from '$lib/components/lib/ui/StatusBadge.svelte';
import { Eye, RotateCcw, Clock, CheckCircle, XCircle } from '@lucide/svelte';
import { getService } from '$lib/core/ServiceContainer.js';
import JobLogModal from '$lib/features/job/components/JobLogModal.svelte';

// Props - ONLY identity data (following VM.svelte pattern)
let { job } = $props();

console.log("[Job.svelte] job:", job.command_name, job.command, job.status);

//const jobService = getService('jobService');

// Local modal state
let showLogModal = $state(false);

// Computed properties
// const duration = $derived(() => {
//   if (!job?.started_at) return null;
//   const start = new Date(job.started_at);
//   const end = job.finished_at ? new Date(job.finished_at) : new Date();
//   const seconds = Math.round((end - start) / 1000);
  
//   if (seconds < 60) return `${seconds}s`;
//   if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
//   return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
// });

const displayCommand = $derived(() => {
  if (!job?.command) return 'No command';
  const maxLength = 10;
  const cmdStr = job.command.split(' ').slice(0, maxLength).join(' ');

  return cmdStr;
});

// const StatusIcon = $derived(() => {

//   switch (job?.status) {
//     case 'completed': return CheckCircle;
//     case 'failed': return XCircle;
//     default: return Clock;

//   }
// });
// onMount(() => {
//   status = getStatus();
// });

let used = false;
function getStatus() {
  if (used) return;
  used = true;
  switch (job?.status) {
    case 'completed': return 'success';
    case 'failed': return 'error';
    case 'running': return 'loading';
    case 'pending': return 'pending';
    default: return 'info';
  }
}
let statusVar = getStatus();

console.log("[Job.svelte] status:", job.status, statusVar);

// Event handlers
function handleViewLogs() {
  showLogModal = true;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp).toLocaleString();
}
</script>

{#if job}
  <Card class="transition-all duration-200 w-full">
    <CardContent class="p-4 w-full">
      <div class="flex items-start justify-between w-full">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <!-- <StatusIcon
              class="w-4 h-4 {job.status === 'completed' ? 'text-green-600' : job.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}"
            />
            -->
            <!-- <span class="font-medium truncate">{displayCommand}</span> -->
            <StatusBadge status={statusVar}>
              {job.status}
            </StatusBadge>
            <!--
            {#if job.type}
              <Badge variant="outline" class="text-xs">
                {job.type}
              </Badge>
            {/if} -->
          </div>
          
          <div class="text-sm text-muted-foreground space-y-1">
            <div>Started: {formatTimestamp(job.started_at)}</div>
            <!-- {#if duration}
              <div>Duration: {duration}</div>
            {/if} -->
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
          <!-- {#if canRetry}
            <Button variant="outline" size="sm" onclick={handleRetry}>
              <RotateCcw class="w-3 h-3" />
            </Button>
          {/if} -->
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Self-contained CRUD modal -->
  <JobLogModal 
    {job} 
    isOpen={showLogModal} 
    onClose={() => showLogModal = false} 
  />
{/if}
