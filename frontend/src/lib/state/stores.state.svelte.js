/* src/lib/state/stores.state.svelte.js */
import { getService } from "$lib/core/ServiceContainer.js";
import { createVMStore } from "$lib/features/vm/vmStore.js";
import { createCommandStore } from "$lib/features/command/commandStore.js";
import { createJobStore } from "$lib/features/job/jobStore.js";
import { createLogStore } from "$lib/features/log/logStore.js";
import { attachStores, setVms } from "$lib/state/ui.state.svelte.js";

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

let initPromise = null;
let dataInitPromise = null;

export function initStores() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const vmService = getService("vmService");
    const commandService = getService("commandService");
    const commandExecutor = getService("commandExecutor");
    const jobService = getService("jobService");

    _vmStore = createVMStore({ vmService });
    _commandStore = createCommandStore({
      commandService,
      vmService,
      commandExecutor,
    });
    _jobStore = createJobStore({ jobService, vmStore: _vmStore });
    _logStore = createLogStore();
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
        _vmStore
          .loadVMs()
          .then((vms) => {
            if (vms) setVms(vms);
            return vms;
          })
          .catch((err) => {
            console.error("Failed to load VMs:", err);
            // Continue with empty VMs instead of failing
            setVms([]);
            return [];
          })
      );
    }

    if (_jobStore) {
      loadPromises.push(
        _jobStore
          .loadJobs()
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

    console.log("✅ Store data initialized");
  })();
  return dataInitPromise;
}

/* auto-initialise in the browser */
if (typeof window !== "undefined") initStores();
