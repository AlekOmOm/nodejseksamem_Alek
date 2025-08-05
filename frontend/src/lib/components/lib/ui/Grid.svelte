<!--
  Grid Component
  
  Reusable grid component with responsive patterns.
  Uses Tailwind utility classes for consistent grid layouts.
-->

<script>
  let {
    variant = 'auto-fit', // 'auto-fit' | 'auto-fill' | 'responsive' | 'fixed'
    cols = 4, // For fixed variant
    minWidth = '280px', // Minimum column width for auto variants
    gap = '1rem',
    class: className = '',
    children,
    ...restProps
  } = $props();

  // Variant classes using Tailwind utilities and custom CSS
  const variantClasses = {
    'auto-fit': 'grid-auto-fit',
    'auto-fill': 'grid-auto-fill', 
    'responsive': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    'fixed': `grid grid-cols-${cols}`
  };

  const combinedClasses = `${variantClasses[variant]} ${className}`.trim();
  
  // Custom style for gap if different from default
  const customStyle = gap !== '1rem' ? `gap: ${gap};` : '';
</script>

<div 
  class={combinedClasses} 
  style={customStyle}
  {...restProps}
>
  {@render children()}
</div>
