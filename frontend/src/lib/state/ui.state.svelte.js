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

// vm being edited
let _editingVM = $state(null);

// modals
let _modalOpen = $state(false);
let _isEditingVMCommands = $state(false);

// command selected
let _selectedCommand = $state(null);
let _editingCommand = $state(null);

// Add this new reactive state for recent VMs
let _recentVMOrder = $state([]); // Array of VM aliases in recent order

// Global refresh state
let _refreshTrigger = $state(0); // Increment to trigger refresh

/* ── public read-only accessors ── */
// selectedVM

export function getSelectedVM() {
  return _selectedVM;
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

// Add new accessor for recent VM order
export function getRecentVMOrder() {
  return _recentVMOrder;
}

// Global refresh trigger accessor
export function getRefreshTrigger() {
  return _refreshTrigger;
}

// Trigger refresh for all components
export function triggerRefresh() {
  _refreshTrigger += 1;
}

/* ── public actions that mutate state ── */
// select functions

// ---
// selectVM
export async function selectVM(vmPrm) {
  if (!vmPrm) return;

  let vm = vmPrm;
  if (!validateVMForm(vmPrm, "selectVM").isValid) {
    vm = await getVMStore().resolveVM(
      vmPrm.id || vmPrm.alias || vmPrm,
      "selectVM"
    );
  }

  _setSelectedVMId(vm.id, vm, "selectVM");
  setSelectedVM(vm, "selectVM end");

  // Update recent VM order
  if (_selectedVM) {
    updateRecentVMOrder(_selectedVM.alias);
  }

  _selectedVMCommands = await getCommandStore().getCommandsForVM(
    _selectedVMId,
    "selectVM"
  );
  _setSelectedVMCommands(_selectedVMCommands);
}

async function _setSelectedVMId(id, vm = null, caller = "unknown") {
  if (!id && !vm) return;
  if (!id && vm) {
    id = await getVMStore().resolveVM(vm.id || vm.alias, "_setSelectedVMId");
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

export async function refresh() {
  selectVM(getSelectedVM());
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
  if (_storesAttached) return;

  _vmStore = vmStoreRef;
  _commandStore = commandStoreRef;
  _jobStore = jobStoreRef;
  _logStore = logStoreRef;

  // Initialize recent VM order
  initRecentVMOrder();

  _storesAttached = true;
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
});

// --------------------- helper ------------------------
// recent VMs

// New function to update recent order reactively
function updateRecentVMOrder(vmAlias) {
  if (!vmAlias) return;

  // Remove if already exists
  _recentVMOrder = _recentVMOrder.filter((alias) => alias !== vmAlias);

  // Add to front
  _recentVMOrder = [vmAlias, ..._recentVMOrder];

  // Also update localStorage for persistence
  localStorage.setItem("recentVMs", JSON.stringify(_recentVMOrder));
}

// Initialize recent order from localStorage
function initRecentVMOrder() {
  try {
    const json = localStorage.getItem("recentVMs");
    _recentVMOrder = json ? JSON.parse(json) : [];
  } catch (e) {
    _recentVMOrder = [];
  }
}

export function getRecentVMs(vms) {
  if (!Array.isArray(vms)) return [];

  const recentOrder = _recentVMOrder;
  const vmMap = new Map(vms.map((vm) => [vm.alias, vm]));

  // Get VMs in recent order
  const recentVMs = recentOrder
    .map((alias) => vmMap.get(alias))
    .filter((vm) => vm !== undefined);

  // Get remaining VMs not in recent list
  const recentSet = new Set(recentOrder);
  const otherVMs = vms.filter((vm) => !recentSet.has(vm.alias));

  return [...recentVMs, ...otherVMs];
}

export async function initializedUIState(vms) {
  return new Promise(async (resolve) => {
    initRecentVMOrder();

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
      const recentVMs = getRecentVMs(vms);
      vmToSelect = recentVMs[0];
      console.log(
        `🔄 [UI State] Selecting first available VM: ${
          vmToSelect?.alias || "none"
        }`
      );
    }

    if (vmToSelect) {
      await selectVM(vmToSelect);
    }

    resolve();
  });
}
