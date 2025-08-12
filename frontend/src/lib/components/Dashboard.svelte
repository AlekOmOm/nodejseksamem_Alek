<script>
  // ui
  import Panel from '$lib/components/lib/ui/Panel.svelte';
  import ThemeToggle from '$lib/components/lib/ui/ThemeToggle.svelte';

  // components
  import VMManagementPanel from '$lib/components/panels/VMManagementPanel.svelte';
  import ExecutionPanel from '$lib/components/panels/ExecutionPanel.svelte';

</script>

<div class="h-full w-full">
  <header class="border-b bg-card px-6 py-4 flex justify-between items-center">
    <h1 class="text-2xl font-bold">VM Orchestrator</h1>
    <ThemeToggle />
  </header>

  <div class="h-full w-full bg-background flex">
    <Panel variant="sidebar">
      <VMManagementPanel/>
    </Panel>
    <Panel variant="main">
      <ExecutionPanel />
    </Panel>
  </div>

</div>
