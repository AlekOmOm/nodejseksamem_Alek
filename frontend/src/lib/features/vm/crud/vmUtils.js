/**
 * VM Component Utilities and Shared Logic
 *
 * Aggregates VM-related JavaScript logic, utilities, and constants
 * for better code organization and reusability across VM components.
 */

import { debug } from "$lib/debug.js";

/**
 * Handles VM command management orchestration
 * Components should use this instead of calling store methods directly
 * @param {Object} vm - VM object
 * @param {Object} vmStore - VM store instance
 * @param {Object} commandStore - Command store instance
 */
export async function handleVMManageCommands(vm, vmStore, commandStore) {
  if (!vm || !vmStore || !commandStore) return;

  // 1. Select VM (pure CRUD)
  vmStore.selectVM(vm);

  // 2. Load commands (pure CRUD)
  await commandStore.loadVMCommands(vm.id);
}

/**
 * VM Environment options for forms and displays
 */
export const VM_ENVIRONMENTS = [
  { value: "development", label: "Development", color: "blue" },
  { value: "staging", label: "Staging", color: "yellow" },
  { value: "production", label: "Production", color: "red" },
  { value: "testing", label: "Testing", color: "purple" },
];

/**
 * VM Status types and their display properties
 */
export const VM_STATUS = {
  ONLINE: { label: "Online", color: "green", icon: "CheckCircle" },
  OFFLINE: { label: "Offline", color: "red", icon: "XCircle" },
  UNKNOWN: { label: "Unknown", color: "gray", icon: "HelpCircle" },
  CONNECTING: { label: "Connecting", color: "yellow", icon: "Loader2" },
};

/**
 * Default VM form data structure
 */
export const DEFAULT_VM_FORM = {
  name: "",
  host: "",
  user: "",
  environment: "development",
  port: 22,
  description: "",
  sshHost: "",
};

/**
 * VM form validation rules
 */
export const VM_VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9-_]+$/,
    message:
      "Name must be 2-50 characters, alphanumeric with dashes/underscores only",
  },
  host: {
    required: true,
    pattern: /^[a-zA-Z0-9.-]+$/,
    message: "Host must be a valid hostname or IP address",
  },
  user: {
    required: true,
    minLength: 1,
    maxLength: 32,
    pattern: /^[a-zA-Z0-9_-]+$/,
    message:
      "User must be 1-32 characters, alphanumeric with dashes/underscores only",
  },
  port: {
    required: true,
    min: 1,
    max: 65535,
    message: "Port must be between 1 and 65535",
  },
  environment: {
    required: true,
    options: VM_ENVIRONMENTS.map((env) => env.value),
    message: "Environment must be one of the predefined options",
  },
};

/**
 * Validates VM form data against validation rules
 * - can be used to validate form data or VM object
 * @param {Object} formData - The form data to validate
 * @returns {Object} Object with isValid boolean and errors object
 */
export function validateVMForm(formData, caller = "unknown") {
  const errors = {};

  // Validate name
  if (!formData.name?.trim()) {
    errors.name = "Name is required";
  } else if (formData.name.length < VM_VALIDATION_RULES.name.minLength) {
    errors.name = `Name must be at least ${VM_VALIDATION_RULES.name.minLength} characters`;
  } else if (formData.name.length > VM_VALIDATION_RULES.name.maxLength) {
    errors.name = `Name must be no more than ${VM_VALIDATION_RULES.name.maxLength} characters`;
  } else if (!VM_VALIDATION_RULES.name.pattern.test(formData.name)) {
    errors.name = VM_VALIDATION_RULES.name.message;
  }

  // Validate host
  if (!formData.host?.trim()) {
    errors.host = "Host is required";
  } else if (!VM_VALIDATION_RULES.host.pattern.test(formData.host)) {
    errors.host = VM_VALIDATION_RULES.host.message;
  }

  // Validate user
  if (!formData.user?.trim()) {
    errors.user = "User is required";
  } else if (formData.user.length < VM_VALIDATION_RULES.user.minLength) {
    errors.user = `User must be at least ${VM_VALIDATION_RULES.user.minLength} character`;
  } else if (formData.user.length > VM_VALIDATION_RULES.user.maxLength) {
    errors.user = `User must be no more than ${VM_VALIDATION_RULES.user.maxLength} characters`;
  } else if (!VM_VALIDATION_RULES.user.pattern.test(formData.user)) {
    errors.user = VM_VALIDATION_RULES.user.message;
  }

  // Validate port
  if (!formData.port) {
    errors.port = "Port is required";
  } else if (
    formData.port < VM_VALIDATION_RULES.port.min ||
    formData.port > VM_VALIDATION_RULES.port.max
  ) {
    errors.port = VM_VALIDATION_RULES.port.message;
  }

  // Validate environment
  if (!formData.environment) {
    errors.environment = "Environment is required";
  } else if (
    !VM_VALIDATION_RULES.environment.options.includes(formData.environment)
  ) {
    errors.environment = VM_VALIDATION_RULES.environment.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Creates a new VM form data object with default values
 * @param {Object} vm - Optional existing VM data to populate form
 * @returns {Object} Form data object
 */
export function createVMFormData(vm = null) {
  if (vm) {
    return {
      name: vm.name || "",
      host: vm.host || "",
      user: vm.user || "",
      environment: vm.environment || "development",
      port: vm.port || 22,
      description: vm.description || "",
      sshHost: vm.sshHost || "",
    };
  }

  return { ...DEFAULT_VM_FORM };
}

/**
 * Gets the display properties for a VM environment
 * @param {string} environment - The environment value
 * @returns {Object} Environment display properties
 */
export function getEnvironmentDisplay(environment) {
  return (
    VM_ENVIRONMENTS.find((env) => env.value === environment) ||
    VM_ENVIRONMENTS[0]
  );
}

/**
 * Gets the display properties for a VM status
 * @param {string} status - The status value
 * @returns {Object} Status display properties
 */
export function getStatusDisplay(status) {
  return VM_STATUS[status?.toUpperCase()] || VM_STATUS.UNKNOWN;
}

/**
 * Loads command count for a specific VM
 * @param {string} vmId - The VM ID
 * @param {Object} commandStore - Command store instance
 * @returns {Promise<number>} Number of commands for the VM
 */
export async function loadVMCommandCount(vmId, commandStore) {
  try {
    const commands = await commandStore.getCommandsForVM(vmId);
    return commands.length;
  } catch (error) {
    console.error(`Failed to load command count for VM ${vmId}:`, error);
    return 0;
  }
}

/**
 * Loads command counts for multiple VMs
 * @param {Array} vms - Array of VM objects
 * @param {Object} commandStore - Command store instance
 * @returns {Promise<Object>} Object mapping VM IDs to command counts
 */
export async function loadVMCommandCounts(vms, commandStore) {
  const counts = {};

  await Promise.all(
    vms.map(async (vm) => {
      counts[vm.id] = await loadVMCommandCount(vm.id, commandStore);
    })
  );

  return counts;
}

/**
 * Helper function to get SSH host alias for a VM
 * @param {Object} vm - VM object
 * @returns {string} SSH host alias
 */
export function getSSHHostAlias(vm) {
  // If VM has explicit sshHost field, use it
  if (vm.sshHost) {
    return vm.sshHost;
  }

  // Otherwise, try to map VM name to known SSH hosts
  const vmNameToSSHHost = {
    "prometheus-vm": "prometheus",
    "grafana-vm": "grafana",
    "grafana-db-vm": "grafana-db",
  };

  return vmNameToSSHHost[vm.name] || vm.name;
}

/**
 * Formats VM connection string for display
 * @param {Object} vm - VM object
 * @returns {string} Formatted connection string
 */
export function formatVMConnection(vm) {
  const port = vm.port && vm.port !== 22 ? `:${vm.port}` : "";
  return `${vm.user}@${vm.host}${port}`;
}
