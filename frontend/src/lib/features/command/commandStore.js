/* src/lib/stores/commandStore.js */
import { createCRUDStore } from "$lib/core/stores/crudStore.js";
import { getVMStore } from "$lib/state/stores.state.svelte.js";
import { refresh } from "$lib/state/ui.state.svelte.js";

/* initial shape --------------------------------------------------- */
const initialState = {
  vmCommands: [],
  commandsByVM: {},
  commandCounts: {}, // Add this
  availableCommandTemplates: {},
  loading: false,
  error: null,
};

/* store factory -------------------------------------------------- */
export function createCommandStore(dependencies) {
  const { commandService } = dependencies;
  const store = createCRUDStore(initialState);

  return {
    /* Svelte store contract */
    subscribe: store.subscribe,
    getState: store.getState,
    getValue: store.getState, // legacy alias

    /* ───────── business methods ───────── */
    /**
     * Load commands for a VM
     * @param {string} vmId - The ID of the VM
     * @param {string} caller (optional) - The caller of the function
     * @returns {Promise<Array>} The commands for the VM
     */
    async loadVMCommands(vmId, caller = "unknown") {
      if (!vmId) return [];

      // Check if commands already loaded
      if (store.getState().commandsByVM[vmId]) {
        return store.getState().commandsByVM[vmId];
      }

      try {
        const vm = await getVMStore().getVMById(vmId);
        const vmCommands = await commandService.listVMCommands(vm.id);

        const state = store.getState();
        store.set({
          ...state,
          vmCommands,
          commandsByVM: { ...state.commandsByVM, [vmId]: vmCommands },
          commandCounts: { ...state.commandCounts, [vmId]: vmCommands.length }, // Add this
        });

        return vmCommands;
      } catch (error) {
        console.error("❌ [CommandStore] Failed to load VM commands:", error);
        throw error;
      }
    },
    /**
     * Load commands for multiple VMs
     * @param {Array} vms - The VMs to load commands for
     * @param {string} caller (optional) - The caller of the function
     * @returns {Promise<Array>} The commands for the VMs
     */
    async loadVMsCommands(vms, caller = "unknown") {
      if (!vms || !Array.isArray(vms)) return;

      // load in parallel
      const loadPromises = vms.map((vm) =>
        this.loadVMCommands(vm.id, caller).catch((err) => {
          console.error(`Failed to load commands for VM ${vm.alias}:`, err);
          return [];
        })
      );

      const results = await Promise.all(loadPromises);
      const totalCommands = results.reduce(
        (sum, commands) => sum + commands.length,
        0
      );

      return results;
    },

    async loadAvailableCommandTemplates() {
      try {
        const commandTemplates = await commandService.getCommandTemplates();
        store.update((s) => ({
          ...s,
          availableCommandTemplates: commandTemplates,
        }));
        return commandTemplates;
      } catch (error) {
        console.error("Failed to load command templates:", error);
        throw error;
      }
    },

    async createCommand(vmId, data) {
      if (!vmId) throw new Error("VM id required");

      console.log("Creating command:", data.name, data.cmd);

      try {
        const vm = await getVMStore().getVMById(vmId);
        const newCommand = await commandService.createCommand(vm.id, data);

        store.update((s) => {
          const vmCmds = s.commandsByVM[vmId] ?? [];
          const newCmds = vmCmds.concat(newCommand);
          return {
            ...s,
            vmCommands: s.vmCommands.concat(newCommand),
            commandsByVM: {
              ...s.commandsByVM,
              [vmId]: newCmds,
            },
            commandCounts: {
              ...s.commandCounts,
              [vmId]: newCmds.length,
            },
          };
        });
        await refresh();
        return newCommand;
      } catch (error) {
        console.error("Failed to create command:", error);

        // Re-throw with preserved error message for toast handling
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Unknown error occurred";
        const enhancedError = new Error(errorMessage);
        enhancedError.status = error.response?.status;
        throw enhancedError;
      }
    },

    async updateCommand(commandId, updateData) {
      try {
        const updatedCommand = await commandService.updateCommand(
          commandId,
          updateData
        );

        store.update((s) => {
          // Update in vmCommands array
          const vmCommandsUpdated = s.vmCommands.map((cmd) =>
            cmd.id === commandId ? updatedCommand : cmd
          );

          // Update in commandsByVM object
          const commandsByVMUpdated = { ...s.commandsByVM };
          Object.keys(commandsByVMUpdated).forEach((vmId) => {
            commandsByVMUpdated[vmId] = commandsByVMUpdated[vmId].map((cmd) =>
              cmd.id === commandId ? updatedCommand : cmd
            );
          });

          return {
            ...s,
            vmCommands: vmCommandsUpdated,
            commandsByVM: commandsByVMUpdated,
          };
        });
        await refresh();

        return updatedCommand;
      } catch (error) {
        console.error("❌ CommandStore: Failed to update command:", error);
        throw error;
      }
    },

    async deleteCommand(commandId) {
      try {
        await commandService.deleteCommand(commandId);

        store.update((s) => {
          // Remove from vmCommands array
          const vmCommandsUpdated = s.vmCommands.filter(
            (cmd) => cmd.id !== commandId
          );

          // Remove from commandsByVM object
          const commandsByVMUpdated = { ...s.commandsByVM };
          Object.keys(commandsByVMUpdated).forEach((vmId) => {
            commandsByVMUpdated[vmId] = commandsByVMUpdated[vmId].filter(
              (cmd) => cmd.id !== commandId
            );
          });

          return {
            ...s,
            vmCommands: vmCommandsUpdated,
            commandsByVM: commandsByVMUpdated,
          };
        });
        await refresh();
      } catch (error) {
        console.error("❌ CommandStore: Failed to delete command:", error);
        throw error;
      }
    },

    /**
     * Get commands for a VM (synchronous - cache only)
     * @param {string} vmId - The VM ID
     * @returns {Array} The commands for the VM from cache
     */
    getCommandsForVMSync(vmId) {
      if (!vmId) return [];
      const state = store.getState();
      return state.commandsByVM[vmId] || [];
    },

    /**
     * Get commands for a VM
     * @param {string|Object} vmIdentifier - The VM identifier (ID or alias)
     * @param {string} caller (optional) - The caller of the function
     * @returns {Array} The commands for the VM
     */
    getCommandsForVM(vmIdentifier, caller = "unknown") {
      if (!vmIdentifier) return [];

      const state = store.getState();
      if (state.commandsByVM[vmIdentifier]) {
        return state.commandsByVM[vmIdentifier];
      }

      // This returns a promise - problematic for $derived
      return this.loadVMCommands(vmIdentifier, caller);
    },

    clearCommands() {
      store.set({
        ...initialState,
        availableCommandTemplates: {},
      });
    },

    getAvailableCommandTemplates() {
      return store.getState().availableCommandTemplates;
    },

    getCommandCount(vmId) {
      if (!vmId) return 0;
      return store.getState().commandCounts[vmId] || 0;
    },
  };
}
