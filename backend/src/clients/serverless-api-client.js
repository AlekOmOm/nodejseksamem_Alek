/**
 * Serverless API Client
 *
 * Client for interacting with the serverless VM and command management API.
 * Provides methods for CRUD operations on VMs, commands.
 *
 * @fileoverview Client for serverless API endpoints
 */

import { AWS_CONFIG } from "../config/index.js";

/**
 * Serverless API client class
 */
export class ServerlessAPIClient {
   constructor(baseUrl = null) {
      // Use the configured AWS API Gateway URL
      this.baseUrl = baseUrl || AWS_CONFIG.apiUrl;
   }

   /**
    * Make HTTP request to serverless API
    * @param {string} endpoint - API endpoint
    * @param {Object} options - Request options
    * @returns {Promise<Object>} Response data
    */
   async request(endpoint, options = {}) {
      const url = `${this.baseUrl}${endpoint}`;
      const config = {
         headers: {
            "Content-Type": "application/json",
            ...options.headers,
         },
         ...options,
      };

      console.log(
         `🌐 Serverless API Request: ${options.method || "GET"} ${url}`
      );

      try {
         const response = await fetch(url, config);

         console.log(
            `📡 Serverless API Response: ${response.status} ${response.statusText}`
         );

         if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(
               errorData.error ||
                  `HTTP ${response.status}: ${response.statusText}`
            );
            console.error(`❌ Serverless API Error:`, error);
            throw error;
         }

         // Handle 204 No Content
         if (response.status === 204) {
            return null;
         }

         return await response.json();
      } catch (error) {
         console.error(`API request failed: ${url}`, error);
         throw error;
      }
   }

   // VM Management Methods

   /**
    * Get all VMs
    * @returns {Promise<Array>} List of VMs
    */
   async getVMs() {
      return await this.request("/api/vms");
   }

   /**
    * Get VM by ID
    * @param {string} id - VM ID
    * @returns {Promise<Object>} VM object
    */
   async getVM(id) {
      return await this.request(`/api/vms/${id}`);
   }

   /**
    * Create new VM
    * @param {Object} vmData - VM data
    * @returns {Promise<Object>} Created VM
    */
   async createVM(vmData) {
      return await this.request("/api/vms", {
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
      return await this.request(`/api/vms/${id}`, {
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
      return await this.request(`/api/vms/${id}`, {
         method: "DELETE",
      });
   }

   // Command Management Methods

   /**
    * Get commands for a VM
    * @param {string} vmId - VM ID
    * @returns {Promise<Array>} List of commands
    */
   async getVMCommands(vmId) {
      return await this.request(`/api/vms/${vmId}/commands`);
   }

   /**
    * Get command by ID
    * @param {string} id - Command ID
    * @returns {Promise<Object>} Command object
    */
   async getCommand(id) {
      return await this.request(`/api/commands/${id}`);
   }

   /**
    * Create new command for VM
    * @param {string} vmId - VM ID
    * @param {Object} commandData - Command data
    * @returns {Promise<Object>} Created command
    */
   async createCommand(vmId, commandData) {
      return await this.request(`/api/vms/${vmId}/commands`, {
         method: "POST",
         body: JSON.stringify(commandData),
      });
   }

   /**
    * Update command
    * @param {string} id - Command ID
    * @param {Object} updates - Command updates
    * @returns {Promise<Object>} Updated command
    */
   async updateCommand(id, updates) {
      return await this.request(`/api/commands/${id}`, {
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
      return await this.request(`/api/commands/${id}`, {
         method: "DELETE",
      });
   }



}

/**
 * Default serverless API client instance
 */
export const serverlessAPI = new ServerlessAPIClient();
