<script>
import { getTheme, toggleTheme } from '$lib/state/theme.state.svelte.js';
import { Sun, Moon } from '@lucide/svelte';

const theme = $derived(getTheme());
</script>

<button class="w-10 h-10 flex items-center justify-center rounded-full border bg-card text-card-foreground" onclick={toggleTheme}>
  {#if theme === 'dark'}
    <Sun class="w-5 h-5" />
  {:else}
    <Moon class="w-5 h-5" />
  {/if}
</button> 
