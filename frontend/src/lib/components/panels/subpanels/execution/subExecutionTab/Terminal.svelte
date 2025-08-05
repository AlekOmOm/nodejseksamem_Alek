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
      console.log("🖥️ Terminal: Log received:", logEntry);
      logLines = [...logLines, {
        stream: logEntry.stream,
        data: logEntry.data,
        timestamp: logEntry.timestamp
      }];
      console.log("🖥️ Terminal: Total logLines:", logLines.length);
    });

    // Listen for job completion
    jobWebSocketService.onJobCompleted((job) => {
      console.log("🖥️ Terminal: Job completed:", job);
      isExecuting = false;
    });

    // Listen for job errors
    jobWebSocketService.onJobError((error) => {
      console.log("🖥️ Terminal: Job error:", error);
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

<div class="terminal-container">
  {#if logLines.length > 0}
    <!-- button right side -->
    <button onclick={clearLogs} style="font-size: small; align:right;">clear logs</button>

  {/if}
  <Log {logLines} {className} class="min-h-[30vh]"/>

  {#if isExecuting}
    <div class="text-sm text-gray-500 mt-2">
      Executing: {currentJob?.command}...
    </div>
  {/if}
</div>
