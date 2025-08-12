/**
 * JobStore - Simple CRUD operations with cache-first pattern
 *
 * Jobs are read-only entities that expire naturally in the database.
 * Only getJob(), getJobs(), and createJob() are needed.
 */
import { createCRUDStore } from "$lib/core/stores/crudStore.js";

const initialState = {
  jobs: [],
  jobsByVM: {}, // Cache jobs organized by VM ID
  loading: false,
  error: null,
  initialized: false,
};

export function createJobStore(dependencies) {
  const { jobService, commandStore } = dependencies;
  const store = createCRUDStore(initialState);

  return {
    // Svelte store contract
    subscribe: store.subscribe,
    getState: store.getState,

    /**
     * Get single job by ID - cache first, API fallback
     */
    async getJob(jobId) {
      if (!jobId) return null;

      // 1. Check cache first
      const state = store.getState();
      const cachedJob = state.jobs.find((job) => job.id === jobId);
      if (cachedJob) {
        return this._enrichJobsWithCommandNames([cachedJob])[0];
      }

      // 2. Fetch from API
      try {
        const job = await jobService.getJob(jobId);
        if (!job) return null;
        const enrichedJob = this._enrichJobsWithCommandNames([job])[0];

        // Add to cache and return enriched
        this._addToCache(enrichedJob);
        return enrichedJob;
      } catch (error) {
        console.error(`Failed to get job ${jobId}:`, error);
        return null;
      }
    },

    /**
     * Get jobs for VM - cache first, API fallback
     */
    async getJobs(vmId, limit = 50) {
      console.log("[JobStore] getJobs:", vmId);
      if (!vmId) return [];

      // 1. Check cache first
      const state = store.getState();
      if (state.jobsByVM[vmId]) {
        return state.jobsByVM[vmId];
      }

      // 2. Fetch from API
      store.update((s) => ({ ...s, loading: true, error: null }));

      try {
        const jobs = await jobService.getJobsForVM(vmId, limit);
        const enrichedJobs = this._enrichJobsWithCommandNames(jobs);
        console.log("[JobStore] enrichedJobs:", enrichedJobs.length);

        // Update cache
        store.update((s) => ({
          ...s,
          jobsByVM: { ...s.jobsByVM, [vmId]: enrichedJobs },
          jobs: s.jobs.concat(
            enrichedJobs.filter(
              (job) => !s.jobs.find((existing) => existing.id === job.id)
            )
          ),
          loading: false,
          error: null,
        }));

        console.log("[JobStore] jobs:", enrichedJobs.length);

        return enrichedJobs;
      } catch (error) {
        console.error(`Failed to get jobs for VM ${vmId}:`, error);
        store.update((s) => ({
          ...s,
          loading: false,
          error: error.message,
        }));
        return [];
      }
    },

    // internal helpers
    /**
     * Enrich jobs with command names from commandStore
     */
    _enrichJobsWithCommandNames(jobs) {
      if (!Array.isArray(jobs)) return jobs;

      // check if already enriched
      if (jobs.every((job) => job.commandName)) return jobs;

      return jobs.map((job) => {
        if (!job.vmId || !job.command) {
          return job;
        }

        // Get commands for this VM from commandStore cache
        const vmCommands = commandStore.getCommandsForVMSync(job.vmId);

        // Find matching command by command text
        const matchingCommand = vmCommands.find(
          (cmd) => cmd.cmd === job.command
        );

        return {
          ...job,
          commandName: matchingCommand?.name || null,
        };
      });
    },

    /**
     * Internal method to add job to cache without API call
     */
    _addToCache(job) {
      if (!job || !job.id) return;

      store.update((state) => {
        const vmId = job.vmId;
        const updatedJobsByVM = { ...state.jobsByVM };

        // Add to jobs array if not exists
        const jobExists = state.jobs.find((j) => j.id === job.id);
        const updatedJobs = jobExists
          ? state.jobs.map((j) => (j.id === job.id ? job : j))
          : [job, ...state.jobs];

        // Add to jobsByVM if vmId exists
        if (vmId) {
          if (!updatedJobsByVM[vmId]) updatedJobsByVM[vmId] = [];
          const vmJobExists = updatedJobsByVM[vmId].find(
            (j) => j.id === job.id
          );
          if (!vmJobExists) {
            updatedJobsByVM[vmId] = [job, ...updatedJobsByVM[vmId]];
          } else {
            updatedJobsByVM[vmId] = updatedJobsByVM[vmId].map((j) =>
              j.id === job.id ? job : j
            );
          }
        }

        return { ...state, jobs: updatedJobs, jobsByVM: updatedJobsByVM };
      });
      console.log("[JobStore] jobs:", store.getState().jobs.length);
    },
  };
}
