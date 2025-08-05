<script>
  import RegisterForm from "$lib/components/lib/ui/RegisterForm.svelte";
  
  function handleRegisterSuccess() {
    console.log('Registration successful!');
    // Could navigate or emit event here
  }
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
  <RegisterForm onSuccess={handleRegisterSuccess} />
</div>