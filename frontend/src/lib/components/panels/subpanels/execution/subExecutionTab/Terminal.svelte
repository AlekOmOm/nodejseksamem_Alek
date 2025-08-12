<script>
  import { onMount, onDestroy } from 'svelte';
  import { getService } from '$lib/core/ServiceContainer.js';
  import { getSelectedVM } from '$lib/state/ui.state.svelte.js';
  import Log from '$lib/features/log/Log.svelte';

  let { class: className = '' } = $props();

  let logLines = $state([]);
  let currentJob = $state(null);
  let isExecuting = $state(false);

  let jobWebSocketService;

  onMount(() => {
    console.log("🖥️ Terminal: Setting up direct WebSocket listeners");
    
    jobWebSocketService = getService("jobWebSocketService");
    
    // Listen for job started
    jobWebSocketService.onJobStarted((job) => {
      console.log("🖥️ Terminal: Job started:", job);
      currentJob = job;
      isExecuting = true;
      logLines = []; // Clear previous logs
    });

    // Listen for job logs - this is the key one!
    jobWebSocketService.onJobLog((logEntry) => {
      logLines = [...logLines, {
        stream: logEntry.stream,
        data: logEntry.data,
        timestamp: logEntry.timestamp
      }];
    });

    // Listen for job completion
    jobWebSocketService.onJobCompleted((job) => {
      isExecuting = false;
    });

    // Listen for job errors
    jobWebSocketService.onJobError((error) => {
      isExecuting = false;
    });
  });

  onDestroy(() => {
    if (jobWebSocketService) {
      jobWebSocketService.offJobStarted();
      jobWebSocketService.offJobLog();
      jobWebSocketService.offJobCompleted();
      jobWebSocketService.offJobError();
    }
  });

  const selectedVM = $derived(getSelectedVM());
  let prevSelectedVM = null;

  $effect(() => {
    if (selectedVM !== prevSelectedVM) {
      logLines = [];
      prevSelectedVM = selectedVM;
    }
  });

  function clearLogs() {
    logLines = [];
  }

</script>

<div class="terminal-container ">
  {#if logLines.length > 0}
    <!-- button right side -->
    <button onclick={clearLogs} >
      <div class="broom-icon">
        🧹
      </div>
    </button>
  {/if}

  {#if isExecuting}
    <div class="text-sm text-muted-foreground mt-2">
      Executing: {currentJob?.command}...
    </div>
  {/if}

  <div class="scroll-box w-full h-full bg-background overflow-y-auto">
    <Log {logLines} {className} class="w-full h-full"/>
  </div>
</div>

<style>
  .terminal-container {
    min-height: 20vh;
  }
  .broom-icon {
    padding: 0.5rem;
    font-size: 2rem;    /* or 2rem, 3em, etc. */
    display: inline-block;
    line-height: 1;     /* avoids vertical alignment issues */
  }
</style>