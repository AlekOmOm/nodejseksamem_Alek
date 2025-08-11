import { SSHManager } from "./services/SSHManager.js";

/**
 * Check if the VM is authorized to access the API
 * @param {Object} vm - The VM object
 * @returns {boolean} - True if the VM is authorized, false otherwise
 */
function checkVM(vm) {
  const hosts = SSHManager.getAllHosts();
  const hostAliases = new Set(hosts.map((h) => h.alias));

  if (!vm || !vm.alias) {
    return false;
  }

  return hostAliases.has(vm.alias);
}

export { checkVM };
