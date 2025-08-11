Excellent analysis! You've identified a systemic architecture issue. Let me analyze each store's loading requirements and provide a consistent solution.

## Store Loading Analysis

Looking at the store factories:

1. **vmStore**: Needs `loadVMs()` - essential for app functionality
2. **commandStore**: Has `loadVMCommands(vmId)` - VM-specific, triggered by selection
3. **jobStore**: Has `loadJobs()` and `loadVMJobs(vmId)` - mixed global/VM-specific
4. **logStore**: Likely has similar patterns

## Recommended Architecture

### 1. **Centralized Store Data Initialization**

````javascript path=frontend/src/lib/state/stores.state.svelte.js mode=EDIT
let initPromise = null;
let dataInitPromise = null;

export function initStores() {
   if (initPromise) return initPromise;
   initPromise = (async () => {
      const vmService = getService("vmService");
      const commandService = getService("commandService");

      _vmStore = createVMStore({ vmService });
      _commandStore = createCommandStore({ commandService, vmService });
      _jobStore = createJobStore();
      _logStore = createLogStore();
   })();
   return initPromise;
}

// Separate data initialization from store creation
export async function initializeStoresData() {
   if (dataInitPromise) return dataInitPromise;
   
   dataInitPromise = (async () => {
      // Ensure stores are created first
      await initStores();
      
      console.log('🔄 Initializing store data...');
      
      // Load global data that all components need
      const loadPromises = [];
      
      if (_vmStore) {
         loadPromises.push(_vmStore.loadVMs().catch(err => 
            console.error('Failed to load VMs:', err)
         ));
      }
      
      if (_jobStore?.loadJobs) {
         loadPromises.push(_jobStore.loadJobs().catch(err => 
            console.error('Failed to load jobs:', err)
         ));
      }
      
      if (_commandStore?.loadAvailableCommandTemplates) {
         loadPromises.push(_commandStore.loadAvailableCommandTemplates().catch(err => 
            console.error('Failed to load command templates:', err)
         ));
      }
      
      await Promise.all(loadPromises);
      console.log('✅ Store data initialized');
   })();
   
   return dataInitPromise;
}
````

### 2. **Application-Level Integration**

````javascript path=frontend/src/App.svelte mode=EDIT
import Dashboard from './lib/components/Dashboard.svelte';
import './styles/styles.css';
import { initializeStoresData } from '$lib/state/stores.state.svelte.js';
import { onMount } from 'svelte';

let ready = $state(false);
onMount(async () => {
  await initializeStoresData();   // Single call handles everything
  ready = true;
});
````

### 3. **Clean Component Implementation**

````svelte path=frontend/src/lib/components/VMManagementPanel.svelte mode=EDIT
<script>
  import { getVMStore } from '$lib/state/stores.state.svelte.js';
  import VMSidebar from './subpanels/vm/VMSidebar.svelte';

  const vmStore = $derived(getVMStore());

  // Only handle manual refresh, not initial loading
  async function handleRefreshVMs() {
    await vmStore?.loadVMs(true);
  }

  console.log('vmmanagement loaded');
</script>
````

### 4. **Store Factory Pattern Consistency**

For stores that need global data loading, expose the loading methods:

````javascript path=frontend/src/lib/stores/jobStore.js mode=EDIT
export function createJobStore() {
   const store = createCRUDStore(initialState);

   return {
      subscribe: store.subscribe,
      
      // Global data loading (called by initializeStoresData)
      async loadJobs() {
         // Implementation
      },
      
      // Context-specific loading (called by components)
      async loadVMJobs(vmId) {
         // Implementation  
      }
   };
}
````

## **Architecture Benefits**

1. **Consistent Startup**: All global data loads before any component renders
2. **Clear Separation**: Store creation vs. data loading are separate concerns
3. **Error Handling**: Centralized error handling for initial data loading
4. **Performance**: Parallel loading of all global data
5. **Maintainability**: Single place to manage application startup sequence

This pattern ensures all stores have their essential data loaded before components try to access it, while maintaining clean separation of concerns.
