<!--
  VM View Component
  
  Displays VM configuration details in a read-only modal with copy functionality.
-->

<script>
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/lib/ui/dialog';
  import { Button } from '$lib/components/lib/ui/button';
  import { Badge } from '$lib/components/lib/ui/badge';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/lib/ui/card';
  import { Server, Copy, Eye } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';

  let { 
    vm = null, 
    isOpen = $bindable(false)
  } = $props();

  // Generate SSH config text
  const sshConfig = $derived(() => {
    if (!vm) return '';
    
    return `Host ${vm.name}
    HostName ${vm.host}
    User ${vm.user}
    Port ${vm.port || 22}
    ${vm.description ? `# ${vm.description}` : ''}`;
  });

  async function copyToClipboard(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  }

  function copyFullConfig() {
    copyToClipboard(sshConfig, 'SSH Config');
  }

  function copyHost() {
    copyToClipboard(vm.host, 'Host');
  }

  function copyUser() {
    copyToClipboard(vm.user, 'User');
  }
</script>

<Dialog bind:open={isOpen}>
  <DialogContent class="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle class="flex items-center gap-2">
        <Eye class="w-4 h-4" />
        View VM Configuration
      </DialogTitle>
    </DialogHeader>

    {#if vm}
      <div class="space-y-4 py-4">
        <!-- VM Header -->
        <Card>
          <CardHeader class="pb-3">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary/10 rounded-lg">
                <Server class="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle class="text-lg">{vm.name}</CardTitle>
                {#if vm.description}
                  <p class="text-sm text-muted-foreground mt-1">{vm.description}</p>
                {/if}
              </div>
            </div>
          </CardHeader>
        </Card>

        <!-- Connection Details -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base">Connection Details</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-medium text-muted-foreground">HOST</label>
                <div class="flex items-center gap-2 mt-1">
                  <code class="text-sm bg-muted px-2 py-1 rounded flex-1">{vm.host}</code>
                  <Button variant="ghost" size="sm" onclick={copyHost}>
                    <Copy class="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div>
                <label class="text-xs font-medium text-muted-foreground">PORT</label>
                <div class="flex items-center gap-2 mt-1">
                  <code class="text-sm bg-muted px-2 py-1 rounded flex-1">{vm.port || 22}</code>
                </div>
              </div>
            </div>
            <div>
              <label class="text-xs font-medium text-muted-foreground">USER</label>
              <div class="flex items-center gap-2 mt-1">
                <code class="text-sm bg-muted px-2 py-1 rounded flex-1">{vm.user}</code>
                <Button variant="ghost" size="sm" onclick={copyUser}>
                  <Copy class="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Tags -->
        {#if vm.tags && vm.tags.length > 0}
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="flex flex-wrap gap-1">
                {#each vm.tags as tag}
                  <Badge variant="secondary">{tag}</Badge>
                {/each}
              </div>
            </CardContent>
          </Card>
        {/if}

        <!-- SSH Config -->
        <Card>
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <CardTitle class="text-base">SSH Config</CardTitle>
              <Button variant="outline" size="sm" onclick={copyFullConfig}>
                <Copy class="w-3 h-3 mr-2" />
                Copy Config
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre class="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap">{sshConfig}</pre>
          </CardContent>
        </Card>
      </div>
    {/if}

    <div class="flex justify-end">
      <Button variant="outline" onclick={() => isOpen = false}>Close</Button>
    </div>
  </DialogContent>
</Dialog>