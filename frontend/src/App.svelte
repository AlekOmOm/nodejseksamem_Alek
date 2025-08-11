<script>
  import Dashboard from '$lib/components/Dashboard.svelte';
  import LoginForm from '$lib/components/lib/ui/LoginForm.svelte';
  import RegisterForm from '$lib/components/lib/ui/RegisterForm.svelte';
  import LogoutButton from '$lib/components/lib/ui/LogoutButton.svelte';
  import './styles/styles.css';
  import { initializeStoresData } from '$lib/state/stores.state.svelte.js';
  import { initializedUIState, selectVM } from '$lib/state/ui.state.svelte.js';
  import { getVMStore } from '$lib/state/stores.state.svelte.js';
  import { getIsAuthenticated, initializeAuth } from '$lib/state/auth.state.svelte.js';
  import { onMount } from 'svelte';
  import { initializeAuthServices, initializeServices } from '$lib/core/ServiceContainer.js';

  let ready = $state(false);
  let showRegister = $state(false);

  let isAuthenticated = $derived(getIsAuthenticated());
  
  onMount(async () => {
    try {
      await initializeAuthServices();
      await initializeAuth();
      
      // If user is already authenticated after validation, initialize services
      if (getIsAuthenticated()) {
        console.log("🔄 [App.svelte] User already authenticated, initializing services...");
        await handleAuthSuccess();
      }
      
      ready = true;
    } catch (error) {
      console.error("❌ [App.svelte] Auth initialization failed:", error);
      ready = true; 
    }
  });
  async function handleAuthSuccess() {
    try {
      console.log("🎉 [App.svelte] Auth successful, initializing services...");
      
      await initializeServices();
      await initializeStoresData();
      
      const vmStore = getVMStore();
      if (vmStore && vmStore.isInitialized()) {
        const loadedVMs = vmStore.getVMs();
        console.log("📊 [App.svelte] Loaded VMs:", loadedVMs?.length || 0);
        
        if (loadedVMs && loadedVMs.length > 0) {
          await initializedUIState(loadedVMs);
          await selectVM(loadedVMs[0]);
          console.log("✅ [App.svelte] UI state initialized with VM:", loadedVMs[0]?.alias);
        } else {
          console.log("⚠️ [App.svelte] No VMs available after initialization");
        }
      } else {
        console.log("❌ [App.svelte] VMStore not initialized after data loading");
        
        // Force VM loading if store exists but not initialized
        if (vmStore) {
          console.log("🔄 [App.svelte] Force loading VMs...");
          try {
            const vms = await vmStore.loadVMs(true);
            if (vms && vms.length > 0) {
              await initializedUIState(vms);
              await selectVM(vms[0]);
              console.log("✅ [App.svelte] Force loaded VMs:", vms.length);
            }
          } catch (error) {
            console.error("❌ [App.svelte] Force VM loading failed:", error);
          }
        }
      }
    } catch (error) {
      console.error("❌ [App.svelte] Full initialization failed:", error);
    }
  }

</script>

<main class="min-h-screen bg-background text-foreground">
  {#if ready}
    {#if isAuthenticated}
      <div class="p-4">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold">VM Orchestrator</h1>
          <LogoutButton />
        </div>
        <Dashboard />
      </div>
    {:else}
      <div class="flex flex-col items-center justify-center min-h-screen gap-4">
        {#if showRegister}
          <RegisterForm onSuccess={handleAuthSuccess} />
          <button 
            class="text-sm text-blue-600 hover:underline"
            onclick={() => showRegister = false}
          >
            Already have an account? Login
          </button>
        {:else}
          <LoginForm onSuccess={handleAuthSuccess} />
          <button 
            class="text-sm text-blue-600 hover:underline"
            onclick={() => showRegister = true}
          >
            Don't have an account? Register
          </button>
        {/if}
      </div>
    {/if}
  {:else}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-lg">Loading...</div>
    </div>
  {/if}
</main>
