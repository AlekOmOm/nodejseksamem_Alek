import { serverlessAPI } from "../../database/ServerlessAPIClient.js";

export class CommandsRepository {
  BASE_ENDPOINT = "/api/commands";

  constructor() {
    this.request = serverlessAPI.request;
  }

  // ── /api/commands/ ------------------------------------

  /**
   * Get command by ID
   * @param {string} id - Command ID
   * @returns {Promise<Object>} Command object
   */
  async getCommand(id) {
    return await this.request(`${this.BASE_ENDPOINT}/${id}`);
  }

  /**
   * Update command
   * @param {string} id - Command ID
   * @param {Object} updates - Command updates
   * @returns {Promise<Object>} Updated command
   */
  async updateCommand(id, updates) {
    return await this.request(`${this.BASE_ENDPOINT}/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete command
   * @param {string} id - Command ID
   * @returns {Promise<void>}
   */
  async deleteCommand(id) {
    return await this.request(`${this.BASE_ENDPOINT}/${id}`, {
      method: "DELETE",
    });
  }
}
