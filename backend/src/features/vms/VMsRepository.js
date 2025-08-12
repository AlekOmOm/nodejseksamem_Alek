import { serverlessAPI } from "../../database/ServerlessAPIClient.js";

export class VMsRepository {
  BASE_ENDPOINT = "/api/vms";

  constructor() {
    this.api = serverlessAPI;
  }

  // VM Management Methods

  async getVMs() {
    console.log("[VMsRepository] getVMs()");
    console.log("--------------------------------");
    return await this.api.request(this.BASE_ENDPOINT);
  }

  /**
   * Get VM by ID
   * @param {string} id - VM ID
   * @returns {Promise<Object>} VM object
   */
  async getVM(id) {
    return await this.api.request(`${this.BASE_ENDPOINT}/${id}`);
  }

  /**
   * Create new VM
   * @param {Object} vmData - VM data
   * @returns {Promise<Object>} Created VM
   */
  async createVM(vmData) {
    return await this.api.request(this.BASE_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(vmData),
    });
  }

  /**
   * Update VM
   * @param {string} id - VM ID
   * @param {Object} updates - VM updates
   * @returns {Promise<Object>} Updated VM
   */
  async updateVM(id, updates) {
    return await this.api.request(`${this.BASE_ENDPOINT}/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete VM
   * @param {string} id - VM ID
   * @returns {Promise<void>}
   */
  async deleteVM(id) {
    return await this.api.request(`${this.BASE_ENDPOINT}/${id}`, {
      method: "DELETE",
    });
  }

  // --- vmsCommands ------------------------------------------------------------
  // - /api/vms/:vmId/commands

  /**
   * Get commands for a VM
   * @param {string} vmId - VM ID
   * @returns {Promise<Array>} List of commands
   */
  async getVMCommands(vmId) {
    return await this.api.request(`/api/vms/${vmId}/commands`);
  }

  /**
   * Create new command for VM
   * @param {string} vmId - VM ID
   * @param {Object} commandData - Command data
   * @returns {Promise<Object>} Created command
   */
  async createCommand(vmId, commandData) {
    return await this.api.request(`/api/vms/${vmId}/commands`, {
      method: "POST",
      body: JSON.stringify(commandData),
    });
  }

  /**
   * Delete all VMs for a user (for GDPR compliance)
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteAllUserVMs(userId) {
    return await this.api.request(`${this.BASE_ENDPOINT}/user/${userId}`, {
      method: "DELETE",
    });
  }
}
