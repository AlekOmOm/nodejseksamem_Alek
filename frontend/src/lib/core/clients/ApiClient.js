/**
 * Core API Client
 *
 * Pure HTTP client for REST API communication.
 * Handles authentication, error handling, and request/response transformation.
 *
 * @fileoverview Core HTTP client for backend API communication
 */

/**
 * API Client configuration
 */
const DEFAULT_CONFIG = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
};

/**
 * Core API Client class
 *
 * Provides low-level HTTP communication with the backend API.
 * Does not contain business logic - that belongs in feature services.
 */
export class ApiClient {
  constructor(baseUrl = "", config = {}) {
    this.baseUrl = baseUrl || "http://localhost:3000";
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.interceptors = {
      request: [],
      response: [],
    };
  }

  /**
   * Add request interceptor
   * @param {Function} interceptor - Request interceptor function
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Add response interceptor
   * @param {Function} interceptor - Response interceptor function
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Apply request interceptors
   * @param {Object} config - Request configuration
   * @returns {Object} Modified request configuration
   */
  async applyRequestInterceptors(config) {
    let modifiedConfig = { ...config };

    for (const interceptor of this.interceptors.request) {
      modifiedConfig = await interceptor(modifiedConfig);
    }

    return modifiedConfig;
  }

  /**
   * Apply response interceptors
   * @param {Response} response - Fetch response
   * @returns {Response} Modified response
   */
  async applyResponseInterceptors(response) {
    let modifiedResponse = response;

    for (const interceptor of this.interceptors.response) {
      modifiedResponse = await interceptor(modifiedResponse);
    }

    return modifiedResponse;
  }

  /**
   * Make HTTP request with full error handling and retries
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    // Prepare request configuration
    let requestConfig = {
      headers: { ...this.config.headers, ...options.headers },
      timeout: options.timeout || this.config.timeout,
      ...options,
    };

    // Apply request interceptors
    requestConfig = await this.applyRequestInterceptors(requestConfig);

    // Implement retry logic
    let lastError;
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          requestConfig.timeout
        );

        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal,
          credentials: requestConfig.credentials || "include", // Ensure credentials are always included
        });

        clearTimeout(timeoutId);

        // Apply response interceptors
        const processedResponse = await this.applyResponseInterceptors(
          response
        );

        if (!processedResponse.ok) {
          const errorData = await this.parseErrorResponse(processedResponse);
          throw new ApiError(
            errorData.message ||
              `HTTP ${processedResponse.status}: ${processedResponse.statusText}`,
            processedResponse.status,
            errorData
          );
        }

        // Handle different response types
        return await this.parseSuccessResponse(processedResponse);
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx) or abort errors
        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          throw error;
        }

        if (error.name === "AbortError") {
          throw new ApiError("Request timeout", 408, {
            timeout: requestConfig.timeout,
          });
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Parse error response
   * @param {Response} response - Fetch response
   * @returns {Object} Error data
   */
  async parseErrorResponse(response) {
    try {
      return await response.json();
    } catch {
      return { message: response.statusText };
    }
  }

  /**
   * Parse success response
   * @param {Response} response - Fetch response
   * @returns {any} Response data
   */
  async parseSuccessResponse(response) {
    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Create default API client instance
 */
export const defaultApiClient = new ApiClient();
