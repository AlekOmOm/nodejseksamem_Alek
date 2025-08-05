/**
 * VM Store - Direct instance implementation
 *
 * This store is now managed through the ServiceContainer and accessed
 * via stores.state.svelte.js. This file provides the store factory
 * for the new dependency injection system.
 */

import { createCRUDStore } from "$lib/core/stores/crudStore.js";
import { getCommandStore } from "$lib/state/stores.state.svelte.js";

const initialState = {
  vms: [],
  loading: false,
  error: null,
};

export function createVMStore(dependencies) {
  const { vmService } = dependencies;
  const store = createCRUDStore(initialState);
  let initialized = false;

  return {
    subscribe: store.subscribe,
    getState: store.getState,

    async initialize() {
      if (initialized) {
        return store.getState().vms;
      }

      store.update((s) => ({ ...s, loading: true }));
      try {
        const vms = await vmService.initialize();
        store.set({ vms: vms || [], loading: false, error: null });
        initialized = true;
        return vms;
      } catch (error) {
        console.error("Failed to initialize VMStore:", error);
        store.update((s) => ({ ...s, loading: false, error: error.message }));
        throw error;
      }
    },

    // Direct state access for runes
    async getVMByAlias(alias, caller = "unknown") {
      if (!alias) return null;

      // First check if VM exists in loaded VMs
      let vm = store.getState().vms?.find((vm) => vm.alias === alias);
      if (vm && vm.id) {
        return vm;
      }

      // VM not in store, need to ensure registration
      vm = await vmService.getVMByAlias(alias, caller);
      this.updateVMs(vm);

      return vm;
    },

    /**
     * Get a VM by its UUID
     *
     * @param {string} uuid - The UUID of the VM
     * @param {string} caller (optional) - The caller of the function
     * @returns {Promise<Object>} The VM object
     */
    async getVMById(uuid, caller = "unknown") {
      if (!uuid) return null;
      let vm = store.getState().vms?.find((vm) => vm.id === uuid) || null;
      if (!vm) {
        vm = await vmService.getVM(uuid, caller);
        this.updateVMs(vm);
      }
      return vm;
    },

    /**
     * Resolve a VM from an identifier (alias or UUID)
     *
     * @param {string} identifier - The alias or UUID of the VM
     * @param {string} caller (optional) - The caller of the function
     * @returns {Promise<Object>} The resolved VM object
     */
    async resolveVM(identifier, caller = "unknown") {
      if (!identifier) return null;

      // First try to find in loaded VMs by alias
      let vm = store.getState().vms?.find((vm) => vm.alias === identifier);
      if (vm) {
        return vm;
      }

      // Try to find by ID if it looks like a UUID
      if (identifier.length > 10 && identifier.includes("-")) {
        vm = store.getState().vms?.find((vm) => vm.id === identifier);
        if (vm) {
          return vm;
        }
      }

      // Not found in store, fall back to service resolution
      vm = await this.getVMByAlias(identifier, caller);
      return vm;
    },
    getVMs() {
      return store.getState().vms;
    },
    getError() {
      return store.getState().error;
    },

    // Methods
    async loadVMs() {
      store.update((state) => ({ ...state, loading: true, error: null }));

      try {
        const vms = await vmService.getVMs();
        getCommandStore().loadVMsCommands(vms, "loadVMs");

        store.update((state) => ({
          vms,
          loading: false,
          error: null,
        }));

        return vms;
      } catch (error) {
        console.error("Failed to load VMs:", error);
        store.update((state) => ({
          ...state,
          loading: false,
          error: error.message,
        }));
        throw error;
      }
    },
    updateVMs(vm) {
      if (!vm) return;
      if (vm === null) return;
      store.update((state) => {
        const vms = state.vms.map((v) => (v.id === vm.id ? vm : v));
        return {
          ...state,
          vms,
        };
      });
    },
  };
}
