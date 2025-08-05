<!--
  Connection Status Component
  
  Displays the current connection status with a visual indicator.
  Provides a reusable way to show connection state across the application.
-->

<script>
  import { get } from 'svelte/store';
  
  import StatusBadge from './StatusBadge.svelte';

  let { connectionStatus = null, size = 'default', showText = true, className = '' } = $props();

  let status = 'disconnected';
  let badgeStatus = 'default';
  let statusText = 'Unknown';

  $effect(() => {
    const currentStatus = (connectionStatus && typeof connectionStatus.subscribe === 'function')
      ? get(connectionStatus)
      : (connectionStatus?.value ?? connectionStatus ?? 'disconnected');

    status = currentStatus;
    badgeStatus = currentStatus === 'connected' ? 'success'
      : currentStatus === 'connecting' ? 'loading'
      : currentStatus === 'disconnected' ? 'error'
      : 'default';

    statusText = currentStatus === 'connected' ? 'Connected'
      : currentStatus === 'connecting' ? 'Connecting...'
      : currentStatus === 'disconnected' ? 'Disconnected'
      : 'Unknown';
  });
</script>

<StatusBadge
  status={badgeStatus}
  {size}
  showIcon={true}
  class={className}
  
>
  {#if showText}
    {statusText}
  {/if}
</StatusBadge>

<!--

  let {
    status = 'default', // 'success' | 'error' | 'warning' | 'info' | 'pending' | 'loading' | 'default'
    size = 'default', // 'sm' | 'default' | 'lg'
    showIcon = true,
    class: className = '',
    children,
    ...restProps
  } = $props();
-->