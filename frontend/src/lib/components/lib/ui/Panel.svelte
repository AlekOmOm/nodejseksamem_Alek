<!--
  Panel Component - Simplified with shadcn-svelte patterns
-->

<script>
  import { cn } from '$lib/utils.js';
  import { tv } from 'tailwind-variants';

  const panelVariants = tv({
    base: "bg-card text-card-foreground border border-border",
    variants: {
      variant: {
        sidebar: "h-full min-w-[25vw] max-w-[35vw] flex-shrink-0 border-r border-l-0 border-t-0 border-b-0 rounded-none",
        main: "h-full w-full min-w-[60vw] max-w-[75vw] flex-1 min-h-0 bg-background border-0",
        card: "rounded-lg shadow-sm",
        default: "rounded-lg"
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6", 
        lg: "p-8"
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "md"
    }
  });

  let {
    variant = 'default',
    padding = 'md',
    class: className = '',
    children
  } = $props();
</script>

<div class={cn(panelVariants({ variant, padding }), className)}>
  {@render children?.()}
</div>
