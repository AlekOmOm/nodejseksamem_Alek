<script>
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/lib/ui/card';
  import { Badge } from '$lib/components/lib/ui/badge';
  import { setSelectedTemplateCmd } from '$lib/state/ui.state.svelte.js';
  import { typeConfig } from '$lib/features/command/commandConfig.js';

  let { template } = $props();

  function handleSelect() {
    setSelectedTemplateCmd(template);
  }
</script>

<Card class="cursor-pointer hover:shadow-md transition-shadow" onclick={handleSelect}>
  <CardHeader class="pb-2">
    <div class="flex items-center justify-between">
      <CardTitle class="text-base">{template.name}</CardTitle>
      <Badge variant={typeConfig[template.type]?.variant || 'outline'}>
        {typeConfig[template.type]?.label || template.type}
      </Badge>
    </div>
  </CardHeader>
  <CardContent class="pt-0">
    {#if template.description}
      <p class="text-sm text-muted-foreground mb-2">{template.description}</p>
    {/if}

    <code class="text-xs text-sm text-muted-foreground px-2 py-1 rounded block truncate border border-gray-200">
      {template.cmd}
    </code>
  </CardContent>
</Card> 