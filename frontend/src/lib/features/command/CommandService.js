export class CommandService {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async listVMCommands(vmId) {
    const response = await this.api.get(`/api/vms/${vmId}/commands`);
    return response;
  }

  async createCommand(vmId, data) {
    return await this.api.post(`/api/vms/${vmId}/commands`, data);
  }

  async getCommand(id) {
    return await this.api.get(`/api/commands/${id}`);
  }

  async updateCommand(id, updates) {
    return await this.api.put(`/api/commands/${id}`, updates);
  }

  async deleteCommand(id) {
    return await this.api.delete(`/api/commands/${id}`);
  }

  async getCommandTemplates() {
    try {
      return await this.api.get("/api/commands");
    } catch (error) {
      console.warn("Command templates not available:", error);
      return {};
    }
  }
}
