<script>
  import { Button } from "$lib/components/lib/ui/button/index.js";
  import * as Card from "$lib/components/lib/ui/card/index.js";
  import { Input } from "$lib/components/lib/ui/input/index.js";
  import { Label } from "$lib/components/lib/ui/label/index.js";
  import { getService } from "$lib/core/ServiceContainer.js";
  const authService = getService("authService");

  let { onSuccess = () => {} } = $props();

  let email = $state('admin@test.com');
  let password = $state('test1234');
  let loading = $state(false);
  let error = $state('');

  async function handleSubmit(event) {
    event.preventDefault();
    loading = true;
    error = '';

    try {
      await authService.login(email, password);
      onSuccess();
    } catch (err) {
      error = err.message || 'Login failed';
    } finally {
      loading = false;
    }
  }
</script>

<Card.Root class="mx-auto w-full max-w-sm">
  <Card.Header>
    <Card.Title class="text-2xl">Login</Card.Title>
    <Card.Description>Enter your email below to login to your account</Card.Description>
  </Card.Header>
  <form onsubmit={handleSubmit}>
    <Card.Content>
      <div class="grid gap-4">
        {#if error}
          <div class="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        {/if}
        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com" 
            bind:value={email}
            required 
          />
        </div>
        <div class="grid gap-2">
          <Label for="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            bind:value={password}
            required 
          />
        </div>
        <Button type="submit" class="w-full" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </div>
    </Card.Content>
  </form>
</Card.Root>
