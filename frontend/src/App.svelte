<script>
  import Dashboard from '$lib/components/Dashboard.svelte';
  import LoginForm from '$lib/components/lib/ui/LoginForm.svelte';
  import RegisterForm from '$lib/components/lib/ui/RegisterForm.svelte';
  import LogoutButton from '$lib/components/lib/ui/LogoutButton.svelte';
  import { Toaster } from 'svelte-sonner';
  import './styles/styles.css';
  import { initializeStoresData } from '$lib/state/stores.state.svelte.js';
  import { initializedUIState, selectVM, triggerRefresh } from '$lib/state/ui.state.svelte.js';
  import { getVMStore } from '$lib/state/stores.state.svelte.js';
  import { getIsAuthenticated, initializeAuth } from '$lib/state/auth.state.svelte.js';
  import { onMount } from 'svelte';
  import { initializeAuthServices, initializeServices } from '$lib/core/ServiceContainer.js';
  import Avatar from '$lib/features/auth/Avatar.svelte';
  let ready = $state(false);
  let showRegister = $state(false);

  let isAuthenticated = $derived(getIsAuthenticated());
  
  onMount(async () => {
    try {
      await initializeAuthServices();
      await initializeAuth();
      
      // If user is already authenticated after validation, initialize services
      if (getIsAuthenticated()) {
        await handleAuthSuccess();
      }
      
      ready = true;
      triggerRefresh(); // Notify components to refresh from cache
    } catch (error) {
      console.error("❌ [App.svelte] Auth initialization failed:", error);
      ready = true; 
      triggerRefresh(); // Notify components even on error
    }
  });
  async function handleAuthSuccess() {
    try {
      await initializeServices();
      await initializeStoresData();
      
      const vmStore = getVMStore();
      if (vmStore && vmStore.isInitialized()) {
        const loadedVMs = vmStore.getVMs();
        
        if (loadedVMs && loadedVMs.length > 0) {
          await initializedUIState(loadedVMs);
          await selectVM(loadedVMs[0]);
        } 
      } else {
        // Force VM loading if store exists but not initialized
        if (vmStore) {
          try {
            const vms = await vmStore.loadVMs(true);
            if (vms && vms.length > 0) {
              await initializedUIState(vms);
              await selectVM(vms[0]);
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
<main class="h-[90vh] bg-background text-foreground">
  {#if ready}
    {#if isAuthenticated}
      <div class="p-4 h-full w-full">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold">VM Orchestrator</h1>
          <div class="flex items-center gap-2">
            <Avatar />
            <LogoutButton />
          </div>
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

<!-- Centralized toast placement -->
<Toaster 
  richColors 
  position="top-right" 
  closeButton 
  duration={4000}
/>
