/**
 * LogStore - Cache-first with backend sync pattern (matches vmStore/commandStore/jobStore)
 * 
 * CRUD Pattern:
 * - READ: Cache-first, API fallback (cache → API if not found)
 * - CREATE/UPDATE/DELETE: API-first, then update cache (API → cache sync)
 */
import { createCRUDStore } from "$lib/core/stores/crudStore.js";

const initialState = {
  logs: [], // All logs
  logsByJob: {}, // Cache logs organized by job ID  
  loading: false,
  error: null,
  initialized: false,
};

export function createLogStore(dependencies) {
  const { logService } = dependencies;
  const store = createCRUDStore(initialState);

  return {
    // Svelte store contract
    subscribe: store.subscribe,
    getState: store.getState,

    // initialization
    async loadLogs(force = false, limit = 1000) {
      const state = store.getState();

      // Skip if already loaded and not forced
      if (state.initialized && !force && state.logs.length > 0) {
        return state.logs;
      }

      // Skip if currently loading
      if (state.loading) {
        return state.logs;
      }

      store.update((s) => ({ ...s, loading: true, error: null }));

      try {
        const logs = await logService.getLogs(limit);

        // Organize logs by job
        const logsByJob = {};
        logs.forEach((log) => {
          if (log.jobId) {
            if (!logsByJob[log.jobId]) logsByJob[log.jobId] = [];
            logsByJob[log.jobId].push(log);
          }
        });

        store.set({
          logs: logs || [],
          logsByJob,
          loading: false,
          error: null,
          initialized: true,
        });

        return logs;
      } catch (error) {
        console.error("Failed to load logs:", error);
        store.update((s) => ({
          ...s,
          loading: false,
          error: error.message,
        }));
        throw error;
      }
    },

    // Read operations (cache-first, then API fallback)

    /**
     * Get all logs from cache
     */
    getLogs() {
      return store.getState().logs;
    },

    /**
     * Get logs for a job - cache first, API fallback
     */
    async loadJobLogs(jobId, caller = "unknown", limit = 1000) {
      if (!jobId) return [];

      // 1. Try cache first
      const state = store.getState();

      // Check cache first
      if (state.logsByJob[jobId]) {
        return state.logsByJob[jobId];
      }

      // 2. Not in cache - fetch from API
      store.update((s) => ({ ...s, loading: true, error: null }));

      try {
        const logs = await logService.getJobLogs(jobId, limit);

        // Update cache
        store.update((s) => ({
          ...s,
          logsByJob: { ...s.logsByJob, [jobId]: logs },
          logs: s.logs.concat(
            logs.filter(
              (log) => !s.logs.find((existing) => existing.id === log.id)
            )
          ),
          loading: false,
          error: null,
        }));

        return logs;
      } catch (error) {
        console.error(`Failed to load logs for job ${jobId}:`, error);
        store.update((s) => ({
          ...s,
          loading: false,
          error: error.message,
        }));
        throw error;
      }
    },

    /**
     * Get logs for a job (synchronous - cache only)
     */
    getJobLogs(jobId) {
      if (!jobId) return [];
      const state = store.getState();
      return state.logsByJob[jobId] || [];
    },

    // ═══════════════════════════════════════════════════════════
    // STATE ACCESSORS (for Svelte 5 runes)
    // ═══════════════════════════════════════════════════════════

    getError() {
      return store.getState().error;
    },

    getLoading() {
      return store.getState().loading;
    },

    isInitialized() {
      return store.getState().initialized;
    },

    // ═══════════════════════════════════════════════════════════
    // INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════

    /**
     * Internal method to add logs to cache without API call
     */
    _addToCache(logs) {
      if (!Array.isArray(logs) || logs.length === 0) return;

      store.update((state) => {
        const updatedLogsByJob = { ...state.logsByJob };
        
        logs.forEach((log) => {
          if (log.jobId) {
            if (!updatedLogsByJob[log.jobId]) updatedLogsByJob[log.jobId] = [];
            
            // Avoid duplicates
            const exists = updatedLogsByJob[log.jobId].find((l) => l.id === log.id);
            if (!exists) {
              updatedLogsByJob[log.jobId].push(log);
            }
          }
        });

        return {
          ...state,
          logs: [...state.logs, ...logs.filter(log => !state.logs.find(l => l.id === log.id))],
          logsByJob: updatedLogsByJob,
        };
      });
    },

    /**
     * Get logs for a job by ID - cache first, API fallback
     */
    async getLogs(jobId, limit = 1000) {
      return this.loadJobLogs(jobId, "getLogs", limit);
    },
  };
}
