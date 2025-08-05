<script>
  import { logStore } from '$lib/state/stores.state.svelte.js';
  import { getService } from '$lib/core/ServiceContainer.js';
  import Log from '$lib/features/log/components/Log.svelte';

  let { job } = $props();

  let showLogs = $state(false);
  let loading = $state(false);
  let lines = $state([]);

  async function toggleLogs() {
    showLogs = !showLogs;
    if (showLogs && lines.length === 0) {
      loading = true;
      try {
        const jobService = getService('jobService');
        lines = await jobService.fetchJobLogs(job.id);
        logStore.setLogsForJob(job.id, lines);
      } catch (e) {
        console.error('Failed to fetch logs', e);
      } finally {
        loading = false;
      }
    }
  }
</script>

<div class="job-simple">
  <div>
    <div class="title">{job.title || job.command?.slice(0, 50)}</div>
    <div class="command">{job.command}</div>
  </div>
  <button onclick={toggleLogs}>{showLogs ? 'Hide' : 'View'} logs</button>
</div>

{#if showLogs}
  {#if loading}
    <div>Loading...</div>
  {:else}
    <Log logLines={lines} />
  {/if}
{/if}

<style>
  .job-simple {
    border: 1px solid #aaa;
    margin: 6px 0;
    padding: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .command {
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
  }
</style>
