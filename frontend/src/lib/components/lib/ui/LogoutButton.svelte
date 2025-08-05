<script>
  import { Button } from "$lib/components/lib/ui/button/index.js";
  import { getService } from "$lib/core/ServiceContainer.js";
  const authService = getService("authService");
  import { getIsAuthenticated } from "$lib/state/auth.state.svelte.js";

  let isAuthenticated = $derived(getIsAuthenticated());
  let loading = $state(false);

  async function handleLogout() {
    loading = true;
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      loading = false;
    }
  }
</script>

{#if isAuthenticated}
  <Button 
    variant="outline" 
    onclick={handleLogout}
    disabled={loading}
  >
    {loading ? 'Logging out...' : 'Logout'}
  </Button>
{:else}
  <Button variant="outline" disabled>
    Not logged in
  </Button>
{/if}
