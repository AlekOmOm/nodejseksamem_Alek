import { VMsRepository } from "./VMsRepository.js";
import { SSHManager } from "./services/SSHManager.js";
import { autoRegisterVms } from "./services/vmAutoRegister.js";

class VMsService {
  constructor() {
    this.repo = new VMsRepository();
  }

  // ── VM CRUD operations ──────────────────────────────────────────────────

  async initialize() {
    console.log("[vmsService] initialize()");
    console.log("--------------------------------");
    const vms = await autoRegisterVms();
    return vms;
  }

  async getVMs() {
    return await this.repo.getVMs();
  }

  async getVM(id) {
    return await this.repo.getVM(id);
  }

  async createVM(vm) {
    return await this.repo.createVM(vm);
  }

  async updateVM(id, vm) {
    return await this.repo.updateVM(id, vm);
  }

  async deleteVM(id) {
    return await this.repo.deleteVM(id);
  }

  // ── VM Commands ─────────────────────────────────────────────────────────

  async getVMCommands(vmId) {
    return await this.repo.getVMCommands(vmId);
  }

  async createVMCommand(vmId, commandData) {
    return await this.repo.createCommand(vmId, commandData);
  }

  // ── SSH Management ──────────────────────────────────────────────────────

  getAllSSHHosts() {
    return SSHManager.getAllHosts();
  }

  getSSHConnectionConfig(alias) {
    return SSHManager.getConnectionConfig(alias);
  }

  generateVMName(alias, config) {
    return SSHManager.generateVMName(alias, config);
  }

  async testSSHConnection(alias, timeout = 10) {
    return await SSHManager.testConnection(alias, timeout);
  }

  validateSSHHostConfig(alias) {
    return SSHManager.validateHostConfig(alias);
  }

  getCloudProvider(hostname) {
    if (!hostname) return null;

    const host = hostname.toLowerCase();

    if (host.includes("amazonaws.com")) return "AWS";
    if (host.includes("googleusercontent.com") || host.includes("gcp"))
      return "Google Cloud";
    if (host.includes("azure")) return "Azure";
    if (host.includes("digitalocean")) return "DigitalOcean";
    if (host.includes("linode")) return "Linode";
    if (host.includes("vultr")) return "Vultr";

    return null;
  }
}

export const vmsService = new VMsService();
