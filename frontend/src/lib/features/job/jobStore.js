/**
 * JobStore - CRUD caching layer for JobService (matches VM pattern)
 */
import { createCRUDStore } from "$lib/core/stores/crudStore.js";

const initialState = {
   jobs: null,
   currentJob: null,
   loading: false,
   error: null,
};

export function createJobStore(dependencies) {
   const { jobService, vmStore } = dependencies;
   const store = createCRUDStore(initialState);

   return {
      // Svelte store contract
      subscribe: store.subscribe,

      // ───────── business methods ─────────
      // CRUD Methods - Cache + API
      async loadJobs(limit = 50) {
         store.update((state) => ({ ...state, loading: true, error: null }));

         try {
            const jobs = await jobService.getJobs(limit);
            store.update((state) => ({
               ...state,
               jobs,
               loading: false,
               error: null,
            }));
            return jobs;
         } catch (error) {
            store.update((state) => ({
               ...state,
               loading: false,
               error: error.message,
            }));
            throw error;
         }
      },

      async loadVMJobs(vmIdentifier, limit = 50) {
         store.update((state) => ({ ...state, loading: true, error: null }));

         try {
            const vm = await vmStore.resolveVM(vmIdentifier);
            if (!vm || !vm.id) {
               throw new Error(`VM not registered: ${vmIdentifier}`);
            }
            
            // vm.id is guaranteed to be a UUID
            const jobs = await jobService.getJobsForVM(vm.id, limit);
            store.update((state) => ({
               ...state,
               jobs,
               loading: false,
               error: null,
            }));
            return jobs;
         } catch (error) {
            store.update((state) => ({
               ...state,
               loading: false,
               error: error.message,
            }));
            throw error;
         }
      },

      async createJob(jobData) {
         try {
            const newJob = await jobService.createJob(jobData);
            store.update((state) => ({
               ...state,
               jobs: state.jobs ? [...state.jobs, newJob] : [newJob],
            }));
            return newJob;
         } catch (error) {
            store.update((state) => ({ ...state, error: error.message }));
            throw error;
         }
      },

      async updateJob(jobId, updates) {
         try {
            const updatedJob = await jobService.updateJob(jobId, updates);
            store.update((state) => ({
               ...state,
               jobs:
                  state.jobs?.map((job) =>
                     job.id === jobId ? updatedJob : job
                  ) || null,
               currentJob:
                  state.currentJob?.id === jobId
                     ? updatedJob
                     : state.currentJob,
            }));
            return updatedJob;
         } catch (error) {
            store.update((state) => ({ ...state, error: error.message }));
            throw error;
         }
      },

      // Current job state management (for real-time execution)
      setCurrentJob(job) {
         store.update((state) => ({ ...state, currentJob: job }));
      },

      clearCurrentJob() {
         store.update((state) => ({ ...state, currentJob: null }));
      },

      // Utility methods
      async getJobsForVM(vmId) {
         const state = store.getState();
         let jobsForVM = state.jobs?.filter((job) => job.vmId === vmId) || [];
         if (jobsForVM.length === 0) {
            jobsForVM = await this.loadVMJobs(vmId);
         }
         return jobsForVM;
      },
   };
}
