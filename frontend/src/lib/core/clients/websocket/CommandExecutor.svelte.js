import { writable, derived } from "svelte/store";

/**
 * CommandExecutor - WebSocket coordinator following established pattern
 */

import { getService } from "$lib/core/ServiceContainer.js";
import { getVMStore, getJobStore } from "$lib/state/stores.state.svelte.js";
import { refreshJobs } from "$lib/state/ui.state.svelte.js";

export class CommandExecutor {
  constructor() {
    this.logLines = $state([]);
    this._isExecuting = $state(false);
    this._command = $state(null);
    this.jobId = $state(null);
    // Set up WebSocket event handlers
    this.setupWebSocketHandlers();
  }

  setupWebSocketHandlers() {
    const jobWebSocketService = getService("jobWebSocketService");

    jobWebSocketService.onJobStarted((job) => {
      console.log("🎯 CommandExecutor: Job started:", job);
      this.setIsExecuting(true);
      this.setCurrentCommand(job);
    });

    jobWebSocketService.onJobLog((logEntry) => {
      console.log("🎯 CommandExecutor: Job log received:", logEntry);
      this.jobId = logEntry.jobId;
      this.logLines.push({
        stream: logEntry.stream,
        data: logEntry.data,
        timestamp: logEntry.timestamp,
      });
      console.log(
        "🎯 CommandExecutor: Current logLines count:",
        this.logLines.length
      );
    });

    jobWebSocketService.onJobCompleted(async (job) => {
      console.log("🎯 CommandExecutor: Job completed:", job);
      this.setIsExecuting(false);
      this.setCurrentCommand(null);

      // Refresh the specific job to trigger HistoryTab reactivity
      // jobId comes from WebSocket event, not nested in job object
      if (this.jobId) {
        console.log(
          "🔄 CommandExecutor: Refreshing completed job:",
          this.jobId
        );
        try {
          const jobStore = getJobStore();
          if (jobStore) {
            await jobStore.getJob(this.jobId);
            refreshJobs();
          }
        } catch (error) {
          console.error("Failed to refresh job after completion:", error);
        }
      }
    });

    jobWebSocketService.onJobError((error) => {
      console.log("🎯 CommandExecutor: Job error:", error);
      this.setIsExecuting(false);
      this.setCurrentCommand(null);
    });
  }

  async executeCommand(selectedVM, command) {
    console.log("🎯 CommandExecutor: Clearing previous logs");
    this.logLines = []; // Clear previous logs

    const vm = await getVMStore().getVMByAlias(selectedVM.alias);

    const commandPayload = {
      command: command.cmd,
      vmId: vm.id,
      type: command.type || "ssh",
      hostAlias: selectedVM.alias,
    };

    console.log("[CommandExecutor.svelte.js] executeCommand");
    console.log("🔴 Executing command:", command);
    console.log("🔴 Executing command:", commandPayload);

    getService("jobWebSocketService").executeCommand(commandPayload);
  }

  // Expose store state via runes
  getIsExecuting() {
    return this._isExecuting;
  }
  setIsExecuting(isExecuting) {
    this._isExecuting = isExecuting;
  }
  getCurrentCommand() {
    return this._command;
  }
  setCurrentCommand(command) {
    this._command = command;
  }

  // Expose logLines as getter
  getLogLines() {
    return this.logLines;
  }
}
