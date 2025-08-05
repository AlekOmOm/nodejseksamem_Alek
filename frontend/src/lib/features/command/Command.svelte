<script>
  /**
   * Command Component
   * 
   * data structure, ex:
   * - cmd: "docker ps"
   * - description: "List running Docker containers"
   * - hostAlias: "<host-alias>"
   * - type: "ssh"
  */
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/lib/ui/card';
import { Badge } from '$lib/components/lib/ui/badge';
import { Loader2 } from '@lucide/svelte';

import { typeConfig } from '$lib/features/command/commandConfig.js';
import { getService } from '$lib/core/ServiceContainer.js';

// button components - self-sufficient
import ExecuteButton from '$lib/features/command/components/buttons/ExecuteButton.svelte';
import EditButton from '$lib/features/command/components/buttons/EditButton.svelte';
import DeleteButton from '$lib/features/command/components/buttons/DeleteButton.svelte';

// Props - ONLY identity data
let { command } = $props();

// Minimal state access for display only
const commandExecutor = getService('commandExecutor');
const currentCommand = $derived(commandExecutor.getCurrentCommand());
const isCurrentCommand = $derived(currentCommand?.cmd === command.cmd);
</script>

<Card class="w-full max-w-[320px] transition-all duration-200 {isCurrentCommand ? 'ring-2 ring-orange-500 border-orange-500' : 'hover:shadow-md'}">
  <CardHeader class="pb-2 w-full">
    <div class="flex items-start justify-between w-full max-w-full overflow-hidden">
      <div class="flex items-center gap-3">
        <div class="min-w-0 flex-1">
          <CardTitle class="text-base flex flex-wrap items-center gap-2">
            <span class="break-all">{command.name}</span>
            {#if isCurrentCommand}
              <Loader2 class="w-3 h-3 animate-spin text-orange-600" />
            {/if}
          </CardTitle>
        </div>
      </div>
      <Badge variant={typeConfig[command.type]?.variant || 'default'} class="text-xs">
        {command.type}
      </Badge>
    </div>
  </CardHeader>

  <CardContent class="space-y-2">
    {#if command.description}
      <p class="text-sm text-muted-foreground">{command.description}</p>
    {/if}

    {#if command.cmd.length > 50}
      <details class="text-xs">
        <summary class="cursor-pointer text-muted-foreground hover:text-foreground">View full command</summary>
        <pre class="mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap break-all">{command.cmd}</pre>
      </details>
    {/if}

    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <div class="flex items-center gap-2">
        <span>Created: {command.createdAt || 'Unknown'}</span>
        <span class="capitalize">{typeConfig[command.type]?.label || command.type}</span>
      </div>
    </div>

    <div class="flex gap-2 pt-2 border-t">
      <ExecuteButton {command} />
      <EditButton {command} />
      <DeleteButton {command} />
    </div>
  </CardContent>
</Card>