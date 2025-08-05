<script>
  import JobSimple from '$lib/features/job/components/JobSimple.svelte';
  let { jobs = [] } = $props();
</script>

<div class="job-list">
{#each jobs as job (job.id)}
    <JobSimple {job} />
{/each}
</div> 

<style>
 
</style>