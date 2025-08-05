<script>
  import LoginForm from "$lib/components/lib/ui/LoginForm.svelte";
  import { getService } from "$lib/core/ServiceContainer.js";   
  const authService = getService("authService");

  function handleLoginSuccess() {
    authService.login();
  }
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
  <LoginForm onSuccess={handleLoginSuccess} />
</div>
