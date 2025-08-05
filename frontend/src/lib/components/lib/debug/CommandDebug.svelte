<script>
  import { getVMStore } from '$lib/state/stores.state.svelte.js';
  import { getSelectedVM } from '$lib/state/ui.state.svelte.js';

  const vmStore = $derived(getVMStore());
  const selectedVM = $derived(getSelectedVM());

  let vmState = $state(null);

  // Subscribe to VM store state
  $effect(() => {
    if (vmStore) {
      const unsubscribe = vmStore.subscribe((state) => {
        vmState = state;
      });
      return unsubscribe;
    }
  });
</script>

<div class="debug-panel">
  <h3>VM Store Debug</h3>
  <pre>{JSON.stringify(vmState, null, 2)}</pre>
  
  <h3>Selected VM</h3>
  <pre>{JSON.stringify(selectedVM, null, 2)}</pre>
</div>
