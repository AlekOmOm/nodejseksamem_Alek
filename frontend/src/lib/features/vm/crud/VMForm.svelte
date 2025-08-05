<!--
  VM Form Component
  
  Form for creating and editing VM configurations.
  Supports validation and different modes (create/edit).
-->

<script>
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/lib/ui/dialog';
  import { Button } from '$lib/components/lib/ui/button';
  import { Input } from '$lib/components/lib/ui/input';
  import { Label } from '$lib/components/lib/ui/label';
  import { Textarea } from '$lib/components/lib/ui/textarea';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/lib/ui/select';
  import { Card, CardContent } from '$lib/components/lib/ui/card';
  import { Badge } from '$lib/components/lib/ui/badge';
  import { Server, Plus } from '@lucide/svelte';
  import { VM_ENVIRONMENTS } from '$lib/features/vm/crud/vmUtils.js';

  let { 
    vm = null, 
    isOpen = $bindable(false),
    onSave, 
    onCancel 
  } = $props();

  let formData = $state({
    name: vm?.name || '',
    host: vm?.host || '',
    user: vm?.user || '',
    port: vm?.port || 22,
    description: vm?.description || '',
    tags: vm?.tags || []
  });

  let loading = $state(false);
  let newTag = $state('');

  function addTag() {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      formData.tags = [...formData.tags, newTag.trim()];
      newTag = '';
    }
  }

  function removeTag(tag) {
    formData.tags = formData.tags.filter(t => t !== tag);
  }

  async function handleSave() {
    if (!formData.name || !formData.host) return;
    
    loading = true;
    try {
      await onSave(formData);
      isOpen = false;
    } finally {
      loading = false;
    }
  }
</script>

<Dialog bind:open={isOpen}>
  <DialogContent class="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle class="flex items-center gap-2">
        <Server class="w-4 h-4" />
        {vm ? 'Edit VM' : 'Add New VM'}
      </DialogTitle>
    </DialogHeader>

    <div class="space-y-4 py-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <Label for="vm-name">VM Name</Label>
          <Input id="vm-name" bind:value={formData.name} placeholder="web-server-01" />
        </div>
        <div class="grid gap-2">
          <Label for="vm-host">Host</Label>
          <Input id="vm-host" bind:value={formData.host} placeholder="192.168.1.100" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <Label for="vm-user">User</Label>
          <Input id="vm-user" bind:value={formData.user} placeholder="ubuntu" />
        </div>
        <div class="grid gap-2">
          <Label for="vm-port">Port</Label>
          <Input id="vm-port" type="number" bind:value={formData.port} />
        </div>
      </div>

      <div class="grid gap-2">
        <Label for="vm-desc">Description</Label>
        <Textarea id="vm-desc" bind:value={formData.description} placeholder="Production web server" rows={2} />
      </div>

      <div class="grid gap-2">
        <Label>Tags</Label>
        <div class="flex gap-2">
          <Input bind:value={newTag} placeholder="Add tag..." onkeydown={(e) => e.key === 'Enter' && addTag()} />
          <Button type="button" variant="outline" size="sm" onclick={addTag}>
            <Plus class="w-3 h-3" />
          </Button>
        </div>
        {#if formData.tags.length > 0}
          <div class="flex flex-wrap gap-1 mt-2">
            {#each formData.tags as tag}
              <Badge variant="secondary" class="cursor-pointer" onclick={() => removeTag(tag)}>
                {tag} ×
              </Badge>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="flex justify-end gap-2">
      <Button variant="outline" onclick={() => { onCancel?.(); isOpen = false; }}>Cancel</Button>
      <Button onclick={handleSave} disabled={loading || !formData.name || !formData.host}>
        {loading ? 'Saving...' : vm ? 'Update VM' : 'Create VM'}
      </Button>
    </div>
  </DialogContent>
</Dialog>
