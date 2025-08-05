<script>
  import { serviceHealth } from '$lib/core/ServiceContainer.js';
  import { Badge } from '$lib/components/lib/ui/badge';
  import { CheckCircle, AlertCircle, Loader2 } from '@lucide/svelte';

  let health = $derived($serviceHealth);
  
  function getStatusIcon(status) {
    switch (status) {
      case 'connected': return CheckCircle;
      case 'connecting': return Loader2;
      default: return AlertCircle;
    }
  }
</script>

<div class="flex gap-2">
  {#each Object.entries(health) as [service, status]}
    {@const Icon = getStatusIcon(status)}
    <Badge variant={status === 'connected' ? 'default' : 'secondary'}>
      <Icon class="w-3 h-3 mr-1" />
      {service}
    </Badge>
  {/each}
</div>