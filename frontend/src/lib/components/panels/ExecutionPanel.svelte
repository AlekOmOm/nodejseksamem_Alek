<script>
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/lib/ui/tabs/index.js';
  import Panel from '$lib/components/lib/ui/Panel.svelte';
  import ExecutionTab from '$lib/components/panels/subpanels/execution/ExecutionTab.svelte';
  import HistoryTab from '$lib/components/panels/subpanels/execution/HistoryTab.svelte';
  import { getJobStore } from '$lib/state/stores.state.svelte.js';

  let activeTab = $state('execute');

  const currentJob = $derived(getJobStore().currentJob);

</script>

<div class="h-full flex flex-col">
  <Tabs bind:value={activeTab} class="flex-1 flex flex-col h-full">
    <TabsList class="grid w-full grid-cols-2 flex-none">
      <TabsTrigger value="execute">Execute</TabsTrigger>
      <TabsTrigger value="history">History</TabsTrigger>
    </TabsList>
    
    <TabsContent value="execute" class="flex-1 h-100 w-full mt-0 pb-0">
      <ExecutionTab />
    </TabsContent>
    
    <TabsContent value="history" class="flex-1 h-90 w-full mt-0">
      <HistoryTab />
    </TabsContent>
  </Tabs>

  {#if currentJob}
    <div class="border-t bg-muted px-6 py-3 text-sm flex-none">
      Running: <code class="bg-muted-foreground/10 px-1 rounded">{currentJob.command}</code>
    </div>
  {/if}

</div>