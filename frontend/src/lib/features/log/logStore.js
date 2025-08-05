/**
 * LogStore - Pure store for log history (REST API data only)
 * NO WebSocket dependencies
 */
import { writable } from "svelte/store";
import { getService } from "$lib/core/ServiceContainer.js";

export function createLogStore() {
   const logs = writable([]);
   const loading = writable(false);
   const error = writable(null);

   return {
      // State
      logs: { subscribe: logs.subscribe },
      loading: { subscribe: loading.subscribe },
      error: { subscribe: error.subscribe },

      // Actions - REST API only
      async loadLogsForJob(jobId) {
         if (!jobId) return [];
         
         loading.set(true);
         error.set(null);
         try {
            const { LogService } = await import("$lib/features/log/logService.js");
            const logService = new LogService(getService("apiClient"));
            
            const jobLogs = await logService.getJobLogs(jobId);
            
            // Update logs, replacing any existing logs for this job
            logs.update(list => {
               const filtered = list.filter(log => log.jobId !== jobId);
               return [...filtered, ...jobLogs];
            });
            
            console.log(`✅ Logs loaded for job ${jobId}:`, jobLogs.length);
            return jobLogs;
         } catch (err) {
            console.error(`❌ Failed to load logs for job ${jobId}:`, err);
            error.set(err.message);
            return [];
         } finally {
            loading.set(false);
         }
      },

      async refreshLogs() {
         // Called by CommandExecutor after persistence
         console.log("🔄 Refreshing logs...");
      },

      // Synchronous getters for UI state
      getLogsForJob(jobId) {
         let currentLogs = [];
         logs.subscribe(list => { currentLogs = list; })();
         return currentLogs.filter(log => log.jobId === jobId);
      }
   };
}
