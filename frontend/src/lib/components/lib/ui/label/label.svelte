<script>
  import { cn } from "$lib/utils.js";

  let {
    class: className = undefined,
    htmlFor = undefined,
    fors = undefined,
    required = false,
    requiredIndicator = "*",
    children,
    ...restProps
  } = $props();

  // Determine the final 'for' value, prioritizing 'htmlFor' over deprecated 'fors'
  const forValue = $derived(htmlFor ?? fors);
</script>

<label
  for={forValue}
  class={cn(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className
  )}
  {...restProps}
>
  {@render children?.()}
  {#if required}
    <span class="ml-1 text-destructive" aria-label="required">
      {requiredIndicator}
    </span>
  {/if}
</label>
