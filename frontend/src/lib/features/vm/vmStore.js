/**
 * VM Store - Cache-first with backend sync pattern
 *
 * CRUD Pattern:
 * - READ: Cache-first, API fallback (cache → API if not found)
 * - CREATE/UPDATE/DELETE: API-first, then update cache (API → cache sync)
 * 
 * Follows store-loading.md pattern for global data initialization.
 */

import { createCRUDStore } from "$lib/core/stores/crudStore.js";

const initialState = {
  vms: [],
  loading: false,
  error: null,
  initialized: false,
};

export function createVMStore(dependencies) {
  const { vmService } = dependencies;
  const store = createCRUDStore(initialState);

  return {
    subscribe: store.subscribe,
    getState: store.getState,

    // ═══════════════════════════════════════════════════════════
    // GLOBAL DATA LOADING (called by initializeStoresData)
    // ═══════════════════════════════════════════════════════════

    async loadVMs(force = false) {
      const state = store.getState();
      
      // Skip if already loaded and not forced
      if (state.initialized && !force && state.vms.length > 0) {
        return state.vms;
      }

      // Skip if currently loading
      if (state.loading) {
        return state.vms;
      }

      store.update((s) => ({ ...s, loading: true, error: null }));
      
      try {
        const vms = await vmService.getVMs();
        
        store.set({ 
          vms: vms || [], 
          loading: false, 
          error: null,
          initialized: true 
        });
        
        return vms;
      } catch (error) {
        console.error("Failed to load VMs:", error);
        store.update((s) => ({ 
          ...s, 
          loading: false, 
          error: error.message 
        }));
        throw error;
      }
    },

    // ═══════════════════════════════════════════════════════════
    // READ OPERATIONS (Cache-first, API fallback)
    // ═══════════════════════════════════════════════════════════

    /**
     * Get all VMs from cache (synchronous)
     */
    getVMs() {
      return store.getState().vms;
    },

    /**
     * Get VM by ID - cache first, API fallback
     */
    async getVMById(vmId, caller = "unknown") {
      if (!vmId) return null;
      
      // 1. Check cache first
      const cachedVM = store.getState().vms.find(vm => vm.id === vmId);
      if (cachedVM) {
        return cachedVM;
      }
      
      // 2. Not in cache - fetch from API
      try {
        const vm = await vmService.getVM(vmId, caller);
        if (vm) {
          // Add to cache for next time
          this._addToCache(vm);
        }
        return vm;
      } catch (error) {
        console.error(`Failed to get VM by ID ${vmId}:`, error);
        return null;
      }
    },

    /**
     * Get VM by alias - cache first, API fallback
     */
    async getVMByAlias(alias, caller = "unknown") {
      if (!alias) return null;

      // 1. Check cache first
      const cachedVM = store.getState().vms.find(vm => vm.alias === alias);
      if (cachedVM) {
        return cachedVM;
      }

      // 2. Not in cache - fetch from API
      try {
        const vm = await vmService.getVMByAlias(alias, caller);
        if (vm) {
          // Add to cache for next time
          this._addToCache(vm);
        }
        return vm;
      } catch (error) {
        console.error(`Failed to get VM by alias ${alias}:`, error);
        return null;
      }
    },

    /**
     * Resolve VM by identifier (alias or UUID) - cache first, API fallback
     */
    async resolveVM(identifier, caller = "unknown") {
      if (!identifier) return null;

      // 1. Try cache by alias
      let vm = store.getState().vms.find(vm => vm.alias === identifier);
      if (vm) return vm;

      // 2. Try cache by ID (if looks like UUID)
      if (identifier.length > 10 && identifier.includes("-")) {
        vm = store.getState().vms.find(vm => vm.id === identifier);
        if (vm) return vm;
      }

      // 3. Not found in cache - try API by alias
      return await this.getVMByAlias(identifier, caller);
    },

    // ═══════════════════════════════════════════════════════════
    // CREATE/UPDATE/DELETE OPERATIONS (API-first, cache sync)
    // ═══════════════════════════════════════════════════════════

    /**
     * Create VM - API first, then add to cache
     */
    async createVM(vmData) {
      try {
        // 1. Create via API
        const newVM = await vmService.createVM(vmData);
        
        // 2. Add to local cache
        store.update((state) => ({
          ...state,
          vms: [...state.vms, newVM],
          error: null
        }));
        
        return newVM;
      } catch (error) {
        console.error('Failed to create VM:', error);
        store.update((state) => ({
          ...state,
          error: error.message
        }));
        throw error;
      }
    },

    /**
     * Update VM - API first, then update cache
     */
    async updateVM(vmId, vmData) {
      try {
        // 1. Update via API
        const updatedVM = await vmService.updateVM(vmId, vmData);
        
        // 2. Update local cache
        store.update((state) => ({
          ...state,
          vms: state.vms.map(vm => vm.id === vmId ? updatedVM : vm),
          error: null
        }));
        
        return updatedVM;
      } catch (error) {
        console.error('Failed to update VM:', error);
        store.update((state) => ({
          ...state,
          error: error.message
        }));
        throw error;
      }
    },

    /**
     * Delete VM - API first, then remove from cache
     */
    async deleteVM(vmId) {
      try {
        // 1. Delete via API
        await vmService.deleteVM(vmId);
        
        // 2. Remove from local cache
        store.update((state) => ({
          ...state,
          vms: state.vms.filter(vm => vm.id !== vmId),
          error: null
        }));
        
        return true;
      } catch (error) {
        console.error('Failed to delete VM:', error);
        store.update((state) => ({
          ...state,
          error: error.message
        }));
        throw error;
      }
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
     * Internal method to add VM to cache without API call
     */
    _addToCache(vm) {
      if (!vm || !vm.id) return;
      
      store.update((state) => {
        const exists = state.vms.find(v => v.id === vm.id);
        if (exists) {
          // Update existing
          const vms = state.vms.map(v => v.id === vm.id ? vm : v);
          return { ...state, vms };
        } else {
          // Add new
          return { ...state, vms: [...state.vms, vm] };
        }
      });
    },

    /**
     * Internal method to remove VM from cache without API call
     */
    _removeFromCache(vmId) {
      if (!vmId) return;
      
      store.update((state) => ({
        ...state,
        vms: state.vms.filter(v => v.id !== vmId)
      }));
    }
  };
}