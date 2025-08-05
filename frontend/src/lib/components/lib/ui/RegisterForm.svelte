<script>
  import { Button } from "$lib/components/lib/ui/button/index.js";
  import * as Card from "$lib/components/lib/ui/card/index.js";
  import { Label } from "$lib/components/lib/ui/label/index.js";
  import { getService } from "$lib/core/ServiceContainer.js";
  const authService = getService("authService");

  let { onSuccess = () => {} } = $props();

  let formData = $state({
    email: 'test@example.com',
    password: 'Test1234',
    role: 'dev'
  });

  let loading = $state(false);
  let error = $state('');

  async function handleSubmit(event) {
    event.preventDefault();
    
    if (loading) return;
    
    loading = true;
    error = '';

    console.log("🔍 [RegisterForm] Form submission:");
    console.log("  - Email:", formData.email);
    console.log("  - Password length:", formData.password.length);
    console.log("  - Role:", formData.role);

    const userData = { 
      email: formData.email, 
      password: formData.password, 
      role: formData.role 
    };
    console.log("🔍 [RegisterForm] Sending userData:", userData);

    try {
      const result = await authService.register(userData);
      console.log("✅ [RegisterForm] Registration successful:", result);
      onSuccess();
    } catch (err) {
      console.error("❌ [RegisterForm] Registration failed:", err);
      error = err.message || 'Registration failed';
    } finally {
      loading = false;
    }
  }
</script>

<Card.Root class="mx-auto w-full max-w-sm">
  <Card.Header>
    <Card.Title class="text-2xl">Register</Card.Title>
    <Card.Description>Create a new account</Card.Description>
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
          <input 
            id="email" 
            type="email" 
            placeholder="m@example.com" 
            bind:value={formData.email}
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
            required 
          />
          <div class="text-xs text-gray-500">Current: {formData.email}</div>
        </div>
        <div class="grid gap-2">
          <Label for="password">Password</Label>
          <input 
            id="password" 
            type="password" 
            bind:value={formData.password}
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
            required 
          />
          <div class="text-xs text-gray-500">Length: {formData.password.length}</div>
        </div>
        <div class="grid gap-2">
          <Label for="role">Role</Label>
          <select 
            id="role" 
            bind:value={formData.role}
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
          >
            <option value="dev">Developer</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <Button type="submit" class="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </Button>
      </div>
    </Card.Content>
  </form>
</Card.Root>
