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
class ServerlessAPIClient {
  constructor(baseUrl = null) {
    this.baseUrl = baseUrl || AWS_CONFIG.apiUrl;
    console.log("[ServerlessAPIClient] constructor()");
    console.log("--------------------------------");
    console.log("baseUrl:", this.baseUrl);
    console.log("--------------------------------");
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

    console.log(`🌐 Serverless API Request: ${options.method || "GET"} ${url}`);

    try {
      const response = await fetch(url, config);

      console.log(
        `📡 Serverless API Response: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
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
}

/**
 * Default serverless API client instance
 */
export const serverlessAPI = new ServerlessAPIClient();
