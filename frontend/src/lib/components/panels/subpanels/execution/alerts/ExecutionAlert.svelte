<script>
import { Alert, AlertDescription } from '$lib/components/lib/ui/alert';
import { Button } from '$lib/components/lib/ui/button';
import { AlertCircle, CheckCircle, Info } from '@lucide/svelte';
let { alert, ondismiss } = $props();
function dismiss() { ondismiss?.(alert); }
</script>

{#if alert}
  <div class="p-4">
    <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
      {#if alert.type === 'error'}
        <AlertCircle class="h-4 w-4" />
      {:else if alert.type === 'success'}
        <CheckCircle class="h-4 w-4" />
      {:else}
        <Info class="h-4 w-4" />
      {/if}
      <AlertDescription class="flex items-center">
        <span class="flex-1">{alert.message}</span>
        {#if alert.domain}
          <span class="text-xs opacity-70 mr-2">[{alert.domain}]</span>
        {/if}
        <Button variant="outline" size="sm" onclick={dismiss} class="ml-2">Dismiss</Button>
      </AlertDescription>
    </Alert>
  </div>
{/if} 