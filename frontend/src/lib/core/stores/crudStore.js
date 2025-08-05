/**
 * Minimal CRUD Store Pattern
 * 
 * Provides basic store functionality without complexity
 */

import { writable } from "svelte/store";

/**
 * Create a simple CRUD store
 * @param {Object} initialState - Initial state
 * @param {Object} apiService - Optional API service
 */
export function createCRUDStore(initialState, apiService = null) {
   const { subscribe, set, update } = writable(initialState);

   return {
      subscribe,
      set,
      update,
      
      // Simple state access
      getState() {
         let state;
         subscribe(s => state = s)();
         return state;
      },

      // Optional API integration
      async create(item) {
         if (!apiService?.create) return item;
         return await apiService.create(item);
      },

      async get(id) {
         if (!apiService?.get) return null;
         return await apiService.get(id);
      },

      async updateItem(id, updates) {
         if (!apiService?.update) return updates;
         return await apiService.update(id, updates);
      },

      async delete(id) {
         if (!apiService?.delete) return true;
         return await apiService.delete(id);
      }
   };
}
