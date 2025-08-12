<script>
  let { logLines = [], className = '' } = $props();
  let logContainer;

  $effect(() => {
    if (logLines && logLines.length > 0 && logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });
</script>

<div bind:this={logContainer} class="log-container {className} h-full text-terminal-text bg-terminal-background">
  {#if logLines}
    {#each logLines as line}
      <div class="whitespace-pre-wrap {line.stream === 'stderr' ? 'error' : ''}">
        {line.data}
      </div>
    {/each}
  {/if}
</div>

<style>
  .log-container {
    background: var(--terminal-background);
    color: var(--terminal-text);
    font-family: monospace;
    font-size: 16px;
    overflow-y: auto;
    padding-top: 1vh;
    padding-left: 2vh;
    padding-right: 2vh;
    padding-bottom: 4vh;
  }
  .log-container .error {
    color: var(--terminal-text-error);
  }
</style> 