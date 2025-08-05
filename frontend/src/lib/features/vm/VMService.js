/**
 * VM Service
 *
 * Business logic service for VM management operations.
 * Handles VM discovery, connection testing, and state management.
 *
 * @fileoverview VM business logic service
 */

import { ApiError } from "$lib/core/clients/ApiClient.js";
import { debug } from "$lib/debug.js";

/**
 * VM Service class
 *
 * Encapsulates all VM-related business logic and API interactions.
 * Uses dependency injection for API and WebSocket clients.
 */
export class VMService {
  ENDPOINT = "/api/vms";

  constructor(apiClient) {
    this.api = apiClient;
    this.initialized = false;
    this._initPromise = null;
  }

  async initialize() {
    if (this.initialized) {
      return null;
    }
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      try {
        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('VM initialization timeout')), 15000)
        );
        
        const vms = await Promise.race([
          this.api.get(`${this.ENDPOINT}/initialize`),
          timeoutPromise
        ]);
        
        this.initialized = true;
        return vms;
      } catch (error) {
        this.initialized = false;
        console.warn("VM service initialization failed, continuing with empty state:", error.message);
        // Return empty array instead of throwing
        return [];
      } finally {
        this._initPromise = null;
      }
    })();

    return this._initPromise;
  }

  async getVMs() {
    return await this.api.get(this.ENDPOINT);
  }
  async getVM(idOrAlias, caller = "unknown") {
    debug("VMService", "getVM", caller, idOrAlias);
    let vm = await this.getVMById(idOrAlias);
    if (!vm) {
      vm = await this.getVMByAlias(idOrAlias);
    }
    return vm;
  }

  async getVMById(id) {
    return await this.api.get(`${this.ENDPOINT}/${id}`);
  }

  async getVMByAlias(alias) {
    const vms = await this.getVMs();
    const vm = vms.find((v) => v.alias === alias || v.name === alias);
    if (!vm) {
      throw new Error(`VM with alias '${alias}' not found`);
    }
    return vm;
  }

  async createVM(data) {
    return await this.api.post(this.ENDPOINT, data);
  }

  async updateVM(id, updates) {
    return await this.api.put(`${this.ENDPOINT}/${id}`, updates);
  }

  async deleteVM(id) {
    return await this.api.delete(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Test SSH connection to VM
   * @param {string} vmId - VM ID (alias)
   * @param {number} timeout - Connection timeout in seconds
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection(vmId, timeout = 10) {
    try {
      const result = await this.api.post(
        `${this.ENDPOINT}/${vmId}/test-connection`,
        { timeout }
      );

      return result;
    } catch (error) {
      throw new VMServiceError(`Connection test failed for ${vmId}`, error);
    }
  }
}

/**
 * Custom VM Service Error class
 */
export class VMServiceError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = "VMServiceError";
    this.originalError = originalError;

    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}
