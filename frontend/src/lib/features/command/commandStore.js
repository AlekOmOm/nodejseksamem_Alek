/* src/lib/stores/commandStore.js */
import { createCRUDStore } from "$lib/core/stores/crudStore.js";
import { getVMStore } from "$lib/state/stores.state.svelte.js";

/* initial shape --------------------------------------------------- */
const initialState = {
  vmCommands: [],
  commandsByVM: {},
  availableCommandTemplates: {},
  loading: false,
  error: null,
};

/* store factory -------------------------------------------------- */
export function createCommandStore(dependencies) {
  const { commandService, commandExecutor } = dependencies;
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

      try {
        const vm = await getVMStore().getVMById(vmId);
        const newCommand = await commandService.createCommand(vm.id, data);

        store.update((s) => {
          const vmCmds = s.commandsByVM[vmId] ?? [];
          return {
            ...s,
            vmCommands: s.vmCommands.concat(newCommand),
            commandsByVM: {
              ...s.commandsByVM,
              [vmId]: vmCmds.concat(newCommand),
            },
          };
        });
        return newCommand;
      } catch (error) {
        console.error("Failed to create command:", error);
        throw error;
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
      } catch (error) {
        console.error("❌ CommandStore: Failed to delete command:", error);
        throw error;
      }
    },

    /* ───────── execution delegation to CommandExecutor ───────── */
    async executeCommand(selectedVM, command, options = {}) {
      if (!commandExecutor) {
        throw new Error("CommandExecutor not available");
      }
      return await commandExecutor.executeCommand(selectedVM, command, options);
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
  };
}
