<script>
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/lib/ui/tabs/index.js';
  import Panel from '$lib/components/lib/ui/Panel.svelte';
  import ExecutionTab from '$lib/components/panels/subpanels/execution/ExecutionTab.svelte';
  import JobHistory from '$lib/components/panels/subpanels/execution/HistoryTab.svelte';
  import { getJobStore } from '$lib/state/stores.state.svelte.js';

  let activeTab = $state('execute');

  const currentJob = $derived(getJobStore().currentJob);

</script>

<Panel variant="main" class="h-full flex flex-col">
  <Tabs bind:value={activeTab} class="flex-1 flex flex-col h-full">
    <TabsList class="grid w-full grid-cols-2 flex-none">
      <TabsTrigger value="execute">Execute</TabsTrigger>
      <TabsTrigger value="history">History</TabsTrigger>
    </TabsList>
    
    <TabsContent value="execute" class="flex-1 flex flex-col h-full mt-0">
      <ExecutionTab />
    </TabsContent>
    
    <TabsContent value="history" class="flex-1 h-full mt-0">
      <JobHistory />
    </TabsContent>
  </Tabs>

  {#if currentJob}
    <div class="border-t bg-muted px-6 py-3 text-sm flex-none">
      Running: <code class="bg-muted-foreground/10 px-1 rounded">{currentJob.command}</code>
    </div>
  {/if}
</Panel>
