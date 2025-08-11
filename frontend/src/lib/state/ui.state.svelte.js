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
import { debug } from "$lib/debug.js";
import { validateVMForm } from "$lib/features/vm/crud/vmUtils.js";

/* ── private reactive fields ── */
let _vms = $state([]);

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

// vm being edited
let _editingVM = $state(null);

// modals
let _modalOpen = $state(false);
let _isEditingVMCommands = $state(false);

// command selected
let _selectedCommand = $state(null);
let _editingCommand = $state(null);

/* ── public read-only accessors ── */
export function getVms() {
  return _vms;
}
export function setVms(vms) {
  _vms = vms;
}
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
    console.log(`🔄 [UI State] Selected VM saved to localStorage: ${vm.alias || vm.id}`);
  } else {
    localStorage.removeItem("lastSelectedVM");
    console.log("🔄 [UI State] Selected VM cleared from localStorage");
  }
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
  if (_selectedVM) addRecentVM(getSelectedVM().alias);

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
  _selectedVMJobs = jobs;
}
function _setSelectedVMCommands(commands) {
  _selectedVMCommands = commands;
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

      _jobStore.loadVMJobs?.(_selectedVMId).then(() => {
        _selectedVMJobs = _jobStore.getVMJobs(_selectedVMId);
      });
    }
  });
});

// --------------------- helper ------------------------
// recent VMs

export function initializeRecentVMs(vms, caller = "unknown") {
  const aliases = _getRecentVMAliases();
  if (!Array.isArray(vms)) return aliases;
  return _sortVMsByRecent(vms, aliases);
}

export function getRecentVMs(vms, caller = "unknown") {
  const aliases = _getRecentVMAliases();
  if (!Array.isArray(vms)) return aliases;
  return _sortVMsByRecent(vms, aliases);
}

function addRecentVM(vmAlias, caller = "unknown") {
  const aliases = _getRecentVMAliases();
  const idx = aliases.indexOf(vmAlias);
  if (idx !== -1) aliases.splice(idx, 1);
  aliases.unshift(vmAlias);
  localStorage.setItem("recentVMs", JSON.stringify(aliases));
}

function _getRecentVMAliases(caller = "unknown") {
  const json = localStorage.getItem("recentVMs");
  return json ? JSON.parse(json) : [];
}

function _sortVMsByRecent(vms, recentAliases, caller = "unknown") {
  const recentSet = new Set(recentAliases);
  const recentVMs = vms.filter((vm) => recentSet.has(vm.alias));
  const otherVMs = vms.filter((vm) => !recentSet.has(vm.alias));

  // Sort recent VMs by their position in recentIds array
  const sortedRecent = recentVMs.sort((a, b) => {
    return recentAliases.indexOf(a.alias) - recentAliases.indexOf(b.alias);
  });

  const result = [...sortedRecent, ...otherVMs];
  return result;
}

export async function initializedUIState(vms) {
  return new Promise(async (resolve) => {
    initializeRecentVMs(vms);
    
    // Try to restore the previously selected VM
    const savedVM = getSelectedVM();
    const savedVMId = getSelectedVMId();
    
    let vmToSelect = null;
    
    if (savedVM && savedVMId) {
      // Try to find the saved VM in the loaded VMs
      vmToSelect = vms.find(vm => vm.id === savedVMId || vm.alias === savedVM.alias);
      if (vmToSelect) {
        console.log(`🔄 [UI State] Restoring saved VM: ${vmToSelect.alias || vmToSelect.id}`);
      }
    }
    
    // If no saved VM or saved VM not found, use first recent VM
    if (!vmToSelect) {
      const recentVMs = getRecentVMs(vms);
      vmToSelect = recentVMs[0];
      console.log(`🔄 [UI State] Selecting first available VM: ${vmToSelect?.alias || "none"}`);
    }
    
    if (vmToSelect) {
      await selectVM(vmToSelect);
    }
    
    resolve();
  });
}
