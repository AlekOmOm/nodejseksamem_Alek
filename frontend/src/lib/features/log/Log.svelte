<script>
  let { logLines = [], className = '' } = $props();
  let logContainer;

  $effect(() => {
    if (logLines && logLines.length > 0 && logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });
</script>

<div bind:this={logContainer} class="log-container {className}">
  {#if logLines}
    {#each logLines as line}
      <div class="whitespace-pre-wrap {line.stream === 'stderr' ? 'text-red-600' : ''}">
        {line.data}
      </div>
    {/each}
  {/if}
</div>

<style>
  .log-container {
    background: #f9f9f9;
    font-family: monospace;
    font-size: 12px;
    overflow-y: auto;
    padding: 4vh;
  }
</style> 