/* src/lib/state/ui.state.svelte.js
 *
 * UI state singleton with private $state and public accessors
 */

import { getService } from "$lib/core/ServiceContainer";
import {
  getVMStore,
  getCommandStore,
  getJobStore,
  getLogStore,
} from "$lib/state/stores.state.svelte.js";
import { validateVMForm } from "$lib/features/vm/crud/vmUtils.js";

/* ── private reactive fields ── */

// vm selected - initialize from localStorage
function initSelectedVMId() {
  return localStorage.getItem("lastSelectedVMId");
}

function initSelectedVM() {
  try {
    const vmStr = localStorage.getItem("lastSelectedVM");
    if (!vmStr || vmStr === "null" || vmStr === "undefined") {
      return null;
    }
    return JSON.parse(vmStr);
  } catch (e) {
    console.warn("Failed to parse selectedVM from localStorage:", e);
    localStorage.removeItem("lastSelectedVM");
    return null;
  }
}

let _selectedVMId = $state(initSelectedVMId());
let _selectedVM = $state(initSelectedVM());
let _selectedVMCommands = $state([]);
let _selectedVMJobs = $state([]);
let _selectedTemplateCmd = $state(null);
let _logLines = $state([]);
let _currentJob = $state(null);
let _latestJob = $state(null);
let _sortedVMs = $state([]);

// vm being edited
let _editingVM = $state(null);

// modals
let _modalOpen = $state(false);
let _isEditingVMCommands = $state(false);

// command selected
let _selectedCommand = $state(null);
let _editingCommand = $state(null);

// Recent VMs state - simple array of VM aliases in recent order
let _recentVMs = $state([]); // Array of VM aliases in recent order

// Global refresh state
let _refreshTrigger = $state(0); // Increment to trigger refresh
let _isUIInitialized = $state(false); // Track UI initialization status

/* ── public read-only accessors ── */
// selectedVM

export function getSelectedVM() {
  return _selectedVM;
}

export function getIsUIInitialized() {
  return _isUIInitialized;
}
// selectedVMId
export function getSelectedVMId() {
  return _selectedVMId;
}
// selectedVMCommands
export function getSelectedVMCommands() {
  return _selectedVMCommands;
}

// selectedVMJobs
export function getSelectedVMJobs() {
  return _selectedVMJobs;
}
function setSelectedVM(vm, caller = "unknown") {
  _selectedVM = vm;

  // Persist to localStorage
  if (vm) {
    localStorage.setItem("lastSelectedVM", JSON.stringify(vm));
  } else {
    localStorage.removeItem("lastSelectedVM");
  }

  // Load jobs when component mounts or VM changes
  getJobStore()
    .getJobs(_selectedVMId)
    .then((jobs) => {
      _setSelectedVMJobs(jobs || []);
    });
}
// ---
// refresh jobs (used for historyTab refreshing)
export function refreshJobs() {
  _setSelectedVMJobs(
    getJobStore()
      .getJobs(_selectedVMId)
      .then((jobs) => {
        _setSelectedVMJobs(jobs || []);
      })
  );
}

// ----

export function getModalOpen() {
  return _modalOpen;
}
export function getEditingVM() {
  return _editingVM;
}
export function getIsEditingVMCommands() {
  return _isEditingVMCommands;
}
export function getSelectedTemplateCmd() {
  return _selectedTemplateCmd;
}
export function getSelectedCommand() {
  return _selectedCommand;
}

export function getEditingCommand() {
  return _editingCommand;
}
export function getLogLines() {
  return _logLines;
}
// currentJob state
export function getCurrentJob() {
  return _currentJob;
}
export function setCurrentJob(job) {
  _currentJob = job;
}

// Accessor for recent VMs
export function getRecentVMs() {
  return _recentVMs;
}

// Get sorted VMs based on recency - reactive (pure getter)
export function getSortedVMs() {
  // Always try to get fresh VMs from store for fallback computation
  const allVMs = _vmStore?.getVMs() || [];

  console.log(
    "[getSortedVMs] Called - _vmStore:",
    !!_vmStore,
    "_sortedVMs.length:",
    _sortedVMs?.length || 0,
    "allVMs.length:",
    allVMs.length,
    "_storesAttached:",
    _storesAttached
  );

  // If we have cached sorted VMs and they match the current VM count, return them
  if (
    _sortedVMs &&
    _sortedVMs.length > 0 &&
    _sortedVMs.length === allVMs.length
  ) {
    console.log("[getSortedVMs] Returning cached _sortedVMs");
    return _sortedVMs;
  }

  // Fallback: compute on-the-fly without mutating state
  if (allVMs.length > 0) {
    console.log("[getSortedVMs] Computing fallback sorted VMs");
    const sorted = getSortedVMsByRecency(allVMs);
    console.log(
      "[getSortedVMs] Computed fallback result length:",
      sorted.length
    );
    return sorted;
  }

  console.log(
    "[getSortedVMs] Returning empty array - _vmStore exists:",
    !!_vmStore,
    "stores attached:",
    _storesAttached
  );
  return [];
}

// Global refresh trigger accessor
export function getRefreshTrigger() {
  return _refreshTrigger;
}

// Trigger refresh for all components
export function triggerRefresh() {
  _refreshTrigger += 1;
}

// Update sorted VMs (called internally by effects)
function updateSortedVMs() {
  if (!_vmStore) {
    console.log("[updateSortedVMs] No _vmStore available");
    return;
  }

  const allVMs = _vmStore.getVMs() || [];
  console.log("[updateSortedVMs] Got VMs from store:", allVMs.length);

  if (allVMs.length > 0) {
    const sorted = getSortedVMsByRecency(allVMs);
    _sortedVMs = sorted;
    console.log(
      "[updateSortedVMs] Set _sortedVMs to length:",
      _sortedVMs.length
    );
  } else {
    console.log("[updateSortedVMs] No VMs to sort");
  }
}

/* ── public actions that mutate state ── */
// select functions

// ---
// selectVM
export async function selectVM(vmPrm) {
  if (!vmPrm) return;

  // Check if stores are ready
  const vmStore = getVMStore();
  const commandStore = getCommandStore();

  if (!vmStore || !commandStore) {
    console.warn("[selectVM] Stores not ready yet, skipping selection");
    return;
  }

  let vm = vmPrm;
  if (!validateVMForm(vmPrm, "selectVM").isValid) {
    vm = await vmStore.resolveVM(vmPrm.id || vmPrm.alias || vmPrm, "selectVM");
  }

  _setSelectedVMId(vm.id, vm, "selectVM");
  setSelectedVM(vm, "selectVM end");

  // Update recent VMs list
  if (_selectedVM) {
    updateRecentVMs(_selectedVM.alias);
  }

  _selectedVMCommands = await commandStore.getCommandsForVM(
    _selectedVMId,
    "selectVM"
  );
  _setSelectedVMCommands(_selectedVMCommands);
}

async function _setSelectedVMId(id, vm = null, caller = "unknown") {
  if (!id && !vm) return;
  if (!id && vm) {
    const vmStore = getVMStore();
    if (!vmStore) {
      console.warn("[_setSelectedVMId] VM store not ready");
      return;
    }
    id = await vmStore.resolveVM(vm.id || vm.alias, "_setSelectedVMId");
    if (!id) return;
  }

  if (id) localStorage.setItem("lastSelectedVMId", id);
  else localStorage.removeItem("lastSelectedVMId");

  _selectedVMId = id;
}
function _setSelectedVMJobs(jobs) {
  console.log("[UI State] _setSelectedVMJobs:", jobs?.length || 0);
  _selectedVMJobs = jobs || [];
  console.log("[UI State] _setSelectedVMJobs set:", _selectedVMJobs.length);
}
function _setSelectedVMCommands(commands) {
  _selectedVMCommands = commands;
}

// ---

// ---

export async function refresh() {
  const selectedVM = getSelectedVM();
  if (selectedVM && getVMStore() && getCommandStore()) {
    await selectVM(selectedVM);
  } else {
    console.warn(
      "[refresh] Cannot refresh - either no selected VM or stores not ready"
    );
  }
}
// ---

export function selectCommand(commandId) {
  _selectedCommand = commandId;
}

export function setSelectedTemplateCmd(template) {
  _selectedTemplateCmd = template;
}
export function setLogLines(lines) {
  _logLines = lines;
}
export function addLogLine(line) {
  _logLines = [..._logLines, ...line];
}

// -------
// modal state change
export function openModal() {
  _modalOpen = true;
}

export function closeModal() {
  _modalOpen = false;
}

// VM edit state change
export function startEdit(vm, type = "vm") {
  if (type === "vm") {
    _editingVM = vm;
    _isEditingVMCommands = false;
  }

  _editingVM = null;
  _isEditingVMCommands = true;

  _modalOpen = true;
}

export function stopEdit() {
  _editingVM = null;
  _isEditingVMCommands = false;
  _modalOpen = false;
}

// Command edit state change
export function startEditCommand(command) {
  _editingCommand = command;
}

export function stopEditCommand() {
  _editingCommand = null;
}

/* ── internal APIs for store integration ── */

/* ── store injection (called once) ── */
let _vmStore, _commandStore, _jobStore, _logStore;
let _storesAttached = false;

export function attachStores({
  vmStoreRef,
  commandStoreRef,
  jobStoreRef,
  logStoreRef,
}) {
  if (_storesAttached) {
    console.log("[attachStores] Already attached, skipping");
    return;
  }

  console.log("[attachStores] Attaching stores...");
  _vmStore = vmStoreRef;
  _commandStore = commandStoreRef;
  _jobStore = jobStoreRef;
  _logStore = logStoreRef;

  console.log("[attachStores] VM Store attached:", !!_vmStore);
  if (_vmStore) {
    console.log(
      "[attachStores] VM Store VMs count:",
      _vmStore.getVMs()?.length || 0
    );
  }

  // Initialize recent VMs
  initRecentVMs();

  _storesAttached = true;
  console.log("[attachStores] Stores attached successfully");

  // Immediately try to update sorted VMs if VMs are available
  if (_vmStore) {
    const vms = _vmStore.getVMs() || [];
    if (vms.length > 0) {
      console.log(
        "[attachStores] Immediately updating sorted VMs with",
        vms.length,
        "VMs"
      );
      updateSortedVMs();
    } else {
      console.log(
        "[attachStores] No VMs available yet - will update when VMs are loaded"
      );
    }
  }
}

/* ── derive the rest whenever id changes ── */
let lastId = null;
$effect.root(() => {
  $effect(() => {
    if (!_vmStore || !_commandStore || !_jobStore || !_selectedVMId) return;

    if (_selectedVMId !== lastId) {
      lastId = _selectedVMId;

      /* 1. synchronous data that might be cached */
      _selectedVM = _vmStore.getVMById(_selectedVMId);

      _selectedVMCommands = _commandStore.getCommandsForVM(_selectedVMId);
      _selectedVMJobs = _jobStore.getVMJobs?.(_selectedVMId) ?? [];
      _logLines = _jobStore.getLogLines?.(_selectedVMId) ?? [];

      /* 2. async refreshes (fire-and-forget, update when done) */
      _commandStore.loadVMCommands(_selectedVMId).then(() => {
        _selectedVMCommands = _commandStore.getCommandsForVM(_selectedVMId);
      });

      _jobStore.getJobs?.(_selectedVMId).then((jobs) => {
        _selectedVMJobs = jobs || [];
        // console.log("[UI State] Reactive update selectedVMJobs:", _selectedVMJobs.length, "jobs");
      });
    }
  });

  // Keep sorted VMs updated when VMs or recent VMs change
  $effect(() => {
    if (!_vmStore) {
      console.log("[UI State] Effect: _vmStore not available");
      return;
    }

    const vms = _vmStore.getVMs() || [];
    // Access _recentVMs to make this effect reactive to changes
    const recentVMs = _recentVMs;

    console.log(
      "[UI State] Effect triggered: VMs count:",
      vms.length,
      "Recent VMs:",
      recentVMs.length
    );

    if (vms.length > 0) {
      updateSortedVMs();
      console.log("[UI State] Updated _sortedVMs:", _sortedVMs.length, "VMs");
    } else {
      console.log("[UI State] No VMs available to sort");
    }
  });
});

// --------------------- helper ------------------------
// recent VMs

// Update recent VMs list - ensures vmAlias is a string, not an array
function updateRecentVMs(vmAlias) {
  if (!vmAlias || typeof vmAlias !== "string") return;

  // Remove if already exists
  _recentVMs = _recentVMs.filter((alias) => alias !== vmAlias);

  // Add to front
  _recentVMs = [vmAlias, ..._recentVMs];

  // Keep only last 10 recent VMs
  if (_recentVMs.length > 10) {
    _recentVMs = _recentVMs.slice(0, 10);
  }

  // Persist to localStorage
  localStorage.setItem("recentVMs", JSON.stringify(_recentVMs));
}

// Initialize recent VMs from localStorage
function initRecentVMs() {
  try {
    const json = localStorage.getItem("recentVMs");
    if (json) {
      const parsed = JSON.parse(json);
      // Ensure we have a flat array of strings
      if (Array.isArray(parsed)) {
        _recentVMs = parsed.filter((item) => typeof item === "string");
      } else {
        _recentVMs = [];
      }
    } else {
      _recentVMs = [];
    }
  } catch (e) {
    _recentVMs = [];
    localStorage.removeItem("recentVMs"); // Clean corrupted data
  }
}

export function getSortedVMsByRecency(vms) {
  if (!Array.isArray(vms)) return [];

  // If no recent VMs, just return all VMs
  if (!_recentVMs || _recentVMs.length === 0) {
    return vms;
  }

  const vmMap = new Map(vms.map((vm) => [vm.alias, vm]));

  // Get VMs in recent order
  const recentVMs = _recentVMs
    .map((alias) => vmMap.get(alias))
    .filter((vm) => vm !== undefined);

  // Get remaining VMs not in recent list
  const recentSet = new Set(_recentVMs);
  const otherVMs = vms.filter((vm) => !recentSet.has(vm.alias));

  return [...recentVMs, ...otherVMs];
}

export async function initializedUIState(vms) {
  return new Promise(async (resolve) => {
    initRecentVMs();

    // Try to restore the previously selected VM
    const savedVM = getSelectedVM();
    const savedVMId = getSelectedVMId();

    let vmToSelect = null;

    if (savedVM && savedVMId) {
      // Try to find the saved VM in the loaded VMs
      vmToSelect = vms.find(
        (vm) => vm.id === savedVMId || vm.alias === savedVM.alias
      );
      if (vmToSelect) {
        console.log(
          `🔄 [UI State] Restoring saved VM: ${
            vmToSelect.alias || vmToSelect.id
          }`
        );
      }
    }

    // If no saved VM or saved VM not found, use first recent VM
    if (!vmToSelect) {
      const sortedVMs = getSortedVMsByRecency(vms);
      vmToSelect = sortedVMs[0];
      console.log(
        `🔄 [UI State] Selecting first available VM: ${
          vmToSelect?.alias || "none"
        }`
      );
    }

    if (vmToSelect) {
      await selectVM(vmToSelect);
    }

    await refresh();

    _isUIInitialized = true; // Mark UI as initialized
    resolve();
  });
}
