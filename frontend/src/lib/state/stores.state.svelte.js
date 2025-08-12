/* src/lib/state/stores.state.svelte.js */
import { getService } from "$lib/core/ServiceContainer.js";
import { createVMStore } from "$lib/features/vm/vmStore.js";
import { createCommandStore } from "$lib/features/command/commandStore.js";
import { createJobStore } from "$lib/features/job/jobStore.js";
import { createLogStore } from "$lib/features/log/logStore.js";
import { attachStores } from "$lib/state/ui.state.svelte.js";
import { refresh } from "$lib/state/ui.state.svelte.js";

/* ── private reactive fields ── */
let _vmStore = $state(null);
let _commandStore = $state(null);
let _jobStore = $state(null);
let _logStore = $state(null);

/* ── public read-only accessors ── */
export function getVMStore() {
  return _vmStore;
}
export function getCommandStore() {
  return _commandStore;
}
export function getJobStore() {
  return _jobStore;
}
export function getLogStore() {
  return _logStore;
}

// Add safe initialization that doesn't require services to be ready
let safeInitPromise = null;

export function initStoresSafe() {
  if (safeInitPromise) return safeInitPromise;

  safeInitPromise = (async () => {
    try {
      // Only initialize if services are available
      if (typeof window !== "undefined") {
        // Try to initialize, but don't fail if services aren't ready
        try {
          await initStores();
        } catch (error) {
          console.log(
            "🔄 [Stores] Services not ready yet, stores will initialize later"
          );
        }
      }
    } catch (error) {
      console.error("❌ [Stores] Safe initialization failed:", error);
    }
  })();

  return safeInitPromise;
}

let initPromise = null;
let dataInitPromise = null;

export function initStores() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    // Check if services are available before trying to use them
    try {
      const vmService = getService("vmService");
      const commandService = getService("commandService");
      const commandExecutor = getService("commandExecutor");
      const jobService = getService("jobService");
      const logService = getService("logService");

      _vmStore = createVMStore({ vmService });
      _commandStore = createCommandStore({
        commandService,
        vmService,
        commandExecutor,
      });
      _jobStore = createJobStore({
        jobService,
        vmStore: _vmStore,
        commandStore: _commandStore,
      });
      _logStore = createLogStore({ logService });
    } catch (error) {
      console.log("🔄 [Stores] Services not ready, will retry later");
      // Reset promise so it can be retried
      initPromise = null;
      throw error;
    }
  })();
  return initPromise;
}

// Separate data initialization from store creation
export async function initializeStoresData() {
  if (dataInitPromise) return dataInitPromise;

  dataInitPromise = (async () => {
    await initStores();

    // Attach stores to UI state for reactivity - ONLY ONCE
    attachStores({
      vmStoreRef: _vmStore,
      commandStoreRef: _commandStore,
      jobStoreRef: _jobStore,
      logStoreRef: _logStore,
    });

    console.log("🔄 Initializing store data...");

    // Load global data that all components need
    const loadPromises = [];

    // 1. Load VMs first with error handling
    if (_vmStore) {
      loadPromises.push(
        _vmStore.loadVMs().catch((err) => {
          console.error("Failed to load VMs:", err);
          return [];
        })
      );
    }

    if (_jobStore) {
      loadPromises.push(
        _jobStore
          .getJobs()
          .catch((err) => console.error("Failed to load jobs:", err))
      );
    }

    if (_commandStore?.loadAvailableCommandTemplates) {
      loadPromises.push(
        _commandStore
          .loadAvailableCommandTemplates()
          .catch((err) =>
            console.error("Failed to load command templates:", err)
          )
      );
    }

    const results = await Promise.allSettled(loadPromises);

    // 2. After VMs are loaded, preload commands for all VMs
    if (_vmStore && _commandStore) {
      const loadedVMs = _vmStore.getVMs();
      if (loadedVMs && loadedVMs.length > 0) {
        console.log("🔄 Preloading commands for", loadedVMs.length, "VMs...");
        try {
          await _commandStore.loadVMsCommands(
            loadedVMs,
            "initializeStoresData"
          );
          console.log("✅ Commands preloaded for all VMs");
        } catch (err) {
          console.error("Failed to preload VM commands:", err);
        }
      }
    }

    await refresh();
    console.log("✅ Store data initialized");
  })();
  return dataInitPromise;
}

// Remove the auto-initialization completely
// if (typeof window !== "undefined") initStoresSafe();
