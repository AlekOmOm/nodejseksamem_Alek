<script>
    let { errorMessage } = $props();
</script>

{#if errorMessage}
    <div class="messageContainer">
        <p>{errorMessage}</p>
    </div>
{/if}

<style>
    .messageContainer {
        padding: 1vh 1vh;
        border-top: 1px solid var(--border);
        background-color: var(--destructive);
    }
    .messageContainer p {
        color: var(--destructive-foreground);
    }
</style>