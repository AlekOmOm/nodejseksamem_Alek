<script>
import { Button } from '$lib/components/lib/ui/button';
import { Play, History } from '@lucide/svelte';

let { activeTab, onchange } = $props();
function setTab(t) { onchange?.({ tab: t }); }
</script>

<div class="flex items-center space-x-1">
  <Button variant={activeTab === 'execute' ? 'default' : 'ghost'} size="sm" onclick={() => setTab('execute')} class="flex items-center gap-2">
    <Play class="w-4 h-4" /> Execute
  </Button>
  <Button variant={activeTab === 'history' ? 'default' : 'ghost'} size="sm" onclick={() => setTab('history')} class="flex items-center gap-2">
    <History class="w-4 h-4" /> History
  </Button>
</div> 