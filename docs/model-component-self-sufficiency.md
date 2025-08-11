Excellent insight! You're absolutely right. Let's establish a **Component Self-Sufficiency Standard** where components handle their own CRUD operations through state stores rather than relying on parent callbacks.

## Standard: Component Self-Sufficiency Pattern

### ✅ New Standard Pattern

````javascript path=frontend/src/lib/components/lib/models/vm/VM.svelte mode=EDIT
<script>
  // ui
  import { Button } from '$lib/components/lib/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/lib/ui/card';
  import { Badge } from '$lib/components/lib/ui/badge';
  import { Server, Edit, Settings, CheckCircle2 } from '@lucide/svelte';
  
  // state - global state access
  import { getSelectedVMId, selectVM } from '$lib/state/ui.state.svelte.js';
  import { getCommandStore } from '$lib/state/stores.state.svelte.js';
  import { startEdit } from '$lib/state/ui.state.svelte.js';
  
  // crud components
  import VmForm from './crud/VMForm.svelte';

  // Props - ONLY identity data
  let { vm } = $props();
 
  // State access
  const selectedVMId = $derived(getSelectedVMId());
  const commandStore = $derived(getCommandStore());
  let commandCount = $derived(commandStore.commandsByVM[vm.id]?.length || 0);
  
  // Local UI state
  let showVMForm = $state(false);
  let showCommandsModal = $state(false);

  // Computed
  const isSelected = $derived(vm.id === selectedVMId);
  const environmentVariant = $derived(
    vm.environment === 'production' ? 'destructive' : 
    vm.environment === 'staging' ? 'secondary' : 'default'
  );

  // Event Handlers - self-contained
  function handleVMSelect() {
    selectVM(vm.id);
  }
  
  function handleEdit() {
    showVMForm = true;
  }

  function handleManageCommands(e) {
    e.stopPropagation();
    showCommandsModal = true;
  }
</script>

<div onclick={handleVMSelect} role="button" tabindex="0" class="cursor-pointer">
  <!-- Card content unchanged -->
</div>

<!-- Self-contained CRUD modals -->
<VmForm vm={vm} bind:isOpen={showVMForm} />
<!-- Commands modal would go here when implemented -->
````

### Standard Benefits

1. **Reduced Props**: Only pass identity data (`vm`, `command`, etc.)
2. **Self-Contained**: Components manage their own CRUD operations
3. **Consistent State**: All components use same state access pattern
4. **Simplified Parents**: Parent components become pure layout containers

### Parent Component Simplification

````javascript path=frontend/src/lib/components/subpanels/vm/VMSidebar.svelte mode=EDIT
<script>
  import VM from '$lib/components/lib/models/vm/VM.svelte';
  import { getVMStore } from '$lib/state/stores.state.svelte.js';

  const vmStore = $derived(getVMStore());
  let vms = $derived(vmStore.vms);
</script>

<aside class="w-full h-full bg-background border-r border-border overflow-y-auto">
  <div class="p-2">
    {#if vms.length === 0}
      <div class="text-center py-4">
        <p class="text-xs text-muted-foreground">No VMs configured</p>
      </div>
    {:else}
      <div class="space-y-1">
        {#each vms as vm}
          <VM {vm} />
        {/each}
      </div>
    {/if}
  </div>
</aside>
````

## Implementation Standards

### 1. Props Standard
```javascript
// ✅ ONLY identity/data props
let { vm } = $props();
let { command } = $props();
let { job } = $props();

// ❌ NO callback props
// let { onedit, ondelete, onmanagecommands } = $props();
```

### 2. State Access Standard
```javascript
// ✅ Consistent state access pattern
const selectedVMId = $derived(getSelectedVMId());
const vmStore = $derived(getVMStore());
const commandStore = $derived(getCommandStore());
```

### 3. Event Handler Standard
```javascript
// ✅ Self-contained handlers
function handleEdit() {
  showEditForm = true;
}

function handleDelete() {
  showDeleteConfirm = true;
}

// ✅ Global state mutations
function handleSelect() {
  selectVM(vm.id);
}
```

### 4. CRUD Modal Standard
```javascript
// ✅ Co-located CRUD components
import EditForm from './crud/EditForm.svelte';
import DeleteConfirm from './crud/DeleteConfirm.svelte';

// ✅ Local modal state
let showEditForm = $state(false);
let showDeleteConfirm = $state(false);
```

This pattern makes components **truly reusable** and **self-sufficient**, eliminating the need for complex prop drilling and callback management.
