<!--
  Status Badge Component
  
  Reusable status badge component with consistent styling.
  Uses design system tokens for colors and follows Tailwind patterns.

  usage:
  <StatusBadge status="success">Success</StatusBadge>

  error:
StatusBadge.svelte?t=1753604073077:85 Uncaught TypeError: Cannot read properties of undefined (reading 'icon')

	in <unknown>
	in ConnectionStatus.svelte
	in Dashboard.svelte
	in App.svelte

    at StatusBadge (StatusBadge.svelte?t=1753604073077:85:31)

    means:
    - the icon is not defined

    the icon is not defined in the statusConfig object
-->

<script>

  import { 
    CheckCircle, 
    XCircle, 
    AlertCircle, 
    Clock, 
    Loader2,
    Info
  } from '@lucide/svelte';
  import { get } from 'svelte/store';

  let {
    status = 'default', // 'success' | 'error' | 'warning' | 'info' | 'pending' | 'loading' | 'default'
    size = 'default', // 'sm' | 'default' | 'lg'
    showIcon = true,
    className = '',
    children,
    ...restProps
  } = $props();


  // Status configuration
  const statusConfig = {

    success: {
      variant: 'default',
      icon: CheckCircle,
      classes: 'bg-green-100 text-green-800 border-green-200'
    },
    error: {
      variant: 'destructive',
      icon: XCircle,
      classes: 'bg-red-100 text-red-800 border-red-200'
    },
    warning: {
      variant: 'secondary',
      icon: AlertCircle,
      classes: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    info: {
      variant: 'secondary',
      icon: Info,
      classes: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    pending: {
      variant: 'outline',
      icon: Clock,
      classes: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    loading: {
      variant: 'outline',
      icon: Loader2,
      classes: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    default: {
      variant: 'outline',
      icon: null,
      classes: ''
    }
  };

  // Size configuration
  const sizeConfig = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  let config = $state(statusConfig['default']);
  let IconComponent = $state(null);
  let isLoading = $state(false);

  const iconSize = {
    sm: 'w-3 h-3',
    default: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  let combinedClasses = $derived(`inline-flex items-center gap-1 font-medium rounded-full border ${config.classes} ${sizeConfig[size]} ${className}`.trim());

  $effect(() => {
    const s = (status && typeof status.subscribe === 'function') ? get(status) : status;
    config = statusConfig[s] ?? statusConfig['default'];
    IconComponent = config.icon;
    isLoading = s === 'loading';
  });
</script>

<span class={combinedClasses} {...restProps}>
  {#if showIcon && IconComponent}
    <IconComponent 
      class="{iconSize[size]} {isLoading ? 'animate-spin' : ''}" 
    />
  {/if}
  
  {#if children}
    {@render children()}
  {/if}
</span>
