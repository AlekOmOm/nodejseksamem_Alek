<!--
  Job Component - Self-sufficient model
  
  Displays a single job with full self-contained functionality.
  Only requires jobId prop, manages own data and interactions.

  jobs:
  {
    "id": "1",
    "command": "echo 'Hello, world!'",
    "commandName": "Hello World",
    "status": "completed",
  }
-->

<script>
import { onMount } from 'svelte';
import { Card, CardContent } from '$lib/components/lib/ui/card';
import { Badge } from '$lib/components/lib/ui/badge';
import { Button } from '$lib/components/lib/ui/button';
import StatusBadge from '$lib/components/lib/ui/StatusBadge.svelte';
import { Eye, RotateCcw, Clock, CheckCircle, XCircle, Timer, Play } from '@lucide/svelte';
import { getService } from '$lib/core/ServiceContainer.js';
import JobLogModal from '$lib/features/job/components/JobLogModal.svelte';

// Props - ONLY identity data (following VM.svelte pattern)
let { job } = $props();

// console.log("[Job.svelte] job obj:", $state.snapshot(job));

let showLogModal = $state(false);

// Computed properties
const duration = $derived(() => {
  if (!job?.startedAt) return null;
  const start = new Date(job.startedAt);
  const end = job.finishedAt ? new Date(job.finishedAt) : new Date();
  const seconds = Math.round((end - start) / 1000);
  
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
});

const formattedStartTime = $derived(() => {
  if (!job?.startedAt) return 'Unknown';
  const date = new Date(job.startedAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
});

const exitCodeDisplay = $derived(() => {
  if (job?.exitCode === undefined || job?.exitCode === null) return null;
  return job.exitCode === 0 ? 'Success (0)' : `Failed (${job.exitCode})`;
});


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

// console.log("[Job.svelte] status:", job.status, statusVar);

// Event handlers
function handleViewLogs() {
  showLogModal = true;
}
</script>

{#if job}
  <Card class="transition-all duration-200 w-full">
    <CardContent class="p-4 w-full">
      <div class="flex items-start justify-between w-full">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <StatusBadge status={statusVar}>
              {job.status}
            </StatusBadge>
            {#if job.commandName}
              <span class="font-medium text-sm">{job.commandName}</span>
            {:else}
              <span class="font-medium text-sm text-muted-foreground">Unknown Command</span>
            {/if}
            {#if duration()}
              <span class="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {duration()}
              </span>
            {/if}
          </div>
          
          <div class="text-sm text-muted-foreground space-y-1">
            <div class="flex items-center gap-4">
              <span>Started: {formattedStartTime()}</span>
              {#if exitCodeDisplay()}
                <span class="text-xs {job.exitCode === 0 ? 'text-green-600' : 'text-red-600'}">
                  {exitCodeDisplay()}
                </span>
              {/if}
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
          
          {#if job.command && job.commandName !== job.command}
            {#if job.command.length > 50}
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
  <JobLogModal 
    {job} 
    isOpen={showLogModal} 
    onClose={() => showLogModal = false} 
  />
{/if}
