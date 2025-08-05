<script>
  import { cn } from "$lib/utils.js";

  let { className, value = "", disabled = false, id, name, children, ...restProps } = $props();
</script>

<select
  {id}
  {name}
  {disabled}
  bind:value
  class={cn(
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...restProps}
>
  {@render children()}
</select>
