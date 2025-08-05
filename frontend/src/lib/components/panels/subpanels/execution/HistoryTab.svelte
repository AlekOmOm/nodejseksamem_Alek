<!--
  History Tab 
  - history of executions using jobStore integration
-->

<script>
import { Card, CardContent } from '$lib/components/lib/ui/card';
import { Clock } from '@lucide/svelte';
import { getJobStore } from '$lib/state/stores.state.svelte.js';
import { getSelectedVM } from '$lib/state/ui.state.svelte.js';
import Job from '$lib/features/job/Job.svelte';

const jobStore = $derived(getJobStore());
const selectedVM = $derived(getSelectedVM());
const jobs = $derived(jobStore?.jobs || []);

// Load jobs when component mounts or VM changes
$effect(() => {
  if (jobStore && selectedVM?.id) {
    jobStore.loadVMJobs(selectedVM.id);
  } else if (jobStore) {
    jobStore.loadJobs();
  }
});
</script>

<div class="p-4 space-y-4">
  {#if jobs.length === 0}
    <Card>
      <CardContent class="p-8 text-center text-muted-foreground">
        <Clock class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h3 class="text-lg font-medium mb-2">No Execution History</h3>
        <p>Command executions will appear here once you start running commands.</p>
        {#if selectedVM}
          <p class="text-sm mt-2">Showing history for: {selectedVM.name}</p>
        {/if}
      </CardContent>
    </Card>
  {:else}
    <div class="space-y-3">
      <div class="text-sm text-muted-foreground">
        {jobs.length} job{jobs.length === 1 ? '' : 's'}
        {#if selectedVM}
          for {selectedVM.name}
        {/if}
      </div>
      {#each jobs as job (job.id)}
        <Job jobId={job.id} />
      {/each}
    </div>
  {/if}
</div>
