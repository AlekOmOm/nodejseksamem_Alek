/**
 * Service Container
 *
 * Dependency injection container for managing service instances.
 * Provides centralized service creation and lifecycle management.
 *
 * @fileoverview Dependency injection container for services
 */

import { ApiClient } from "$lib/core/clients/ApiClient.js";
import { WebSocketClient } from "$lib/core/clients/WebSocketClient.js";
import { JobWebSocketService } from "$lib/core/clients/websocket/JobWebSocketService.js";
// features
import { AuthService } from "$lib/features/auth/auth.js";
import { VMService } from "$lib/features/vm/VMService.js";

import { CommandService } from "$lib/features/command/CommandService.js";
import { CommandExecutor } from "$lib/core/clients/websocket/CommandExecutor.svelte.js";

import { JobService } from "$lib/features/job/JobService.js";

import { LogService } from "$lib/features/log/logService.js";

import { writable } from "svelte/store";

/**
 * Service Container class
 *
 * Manages service instances and their dependencies.
 * Implements singleton pattern for shared services.
 */
export class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.factories = new Map();
    this.initialized = false;

    this.registerDefaultServices();
  }

  /**
   * Register default services
   */
  registerDefaultServices() {
    this.registerSingleton("apiClient", () => new ApiClient());

    this.registerSingleton(
      "commandService",
      (c) => new CommandService(c.get("apiClient"))
    );
    this.registerSingleton(
      "webSocketClient",
      () => new WebSocketClient("/jobs")
    );
    this.registerSingleton(
      "jobWebSocketService",
      (c) => new JobWebSocketService(c.get("webSocketClient"))
    );
    this.registerSingleton(
      "jobService",
      (c) => new JobService(c.get("apiClient"))
    );
    this.registerSingleton(
      "vmService",
      (c) => new VMService(c.get("apiClient"))
    );
    this.registerSingleton(
      "logService",
      (c) => new LogService(c.get("apiClient"))
    );
    // auth
    this.registerSingleton(
      "authService",
      (c) => new AuthService(c.get("apiClient"))
    );

    this.registerSingleton("commandExecutor", (c) => new CommandExecutor());
  }

  /**
   * Register a singleton service
   * @param {string} name - Service name
   * @param {Function} factory - Factory function
   */
  registerSingleton(name, factory) {
    this.singletons.set(name, { factory, instance: null });
  }

  /**
   * Register a service instance
   * @param {string} name - Service name
   * @param {any} instance - Service instance
   */
  registerInstance(name, instance) {
    this.services.set(name, instance);
  }

  /**
   * Get service instance
   * @param {string} name - Service name
   * @returns {any} Service instance
   */
  get(name) {
    // Check for direct instance first
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Check for singleton
    if (this.singletons.has(name)) {
      const singleton = this.singletons.get(name);
      if (!singleton.instance) {
        singleton.instance = singleton.factory(this);
      }
      return singleton.instance;
    }

    // Check for factory
    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      return factory(this);
    }

    throw new Error(`Service '${name}' not found`);
  }

  /**
   * Check if service is registered
   * @param {string} name - Service name
   * @returns {boolean} True if service is registered
   */
  has(name) {
    return this.services.has(name) || this.singletons.has(name);
  }

  /**
   * Initialize only auth-related services (no WebSocket)
   */
  async initializeAuth() {
    if (this.authInitialized) return;

    console.log("🔧 [ServiceContainer] Initializing auth services...");

    this.registerSingleton("apiClient", () => new ApiClient());
    this.registerSingleton(
      "authService",
      (c) => new AuthService(c.get("apiClient"))
    );

    this.authInitialized = true;
    console.log("✅ [ServiceContainer] Auth services initialized");
  }

  /**
   * Initialize all singleton services
   */
  async initializeFull() {
    if (this.initialized) {
      console.log("⚠️ Service container already initialized");
      return;
    }

    console.log("🚀 Initializing service container...");

    try {
      // Initialize core clients
      const wsClient = this.get("webSocketClient");

      // Connect WebSocket
      wsClient.connect();

      // Wait for WebSocket connection (with timeout)
      await this.waitForWebSocketConnection(wsClient, 10000);
      this.get("apiClient");

      // Initialize core services
      this.get("vmService").initialize();
      this.get("commandService");
      this.get("commandExecutor");
      this.get("logService");
      this.get("jobService");
      this.get("authService");

      this.initialized = true;
    } catch (error) {
      console.error("❌ Failed to initialize service container:", error);
      throw error;
    }
  }

  /**
   * Wait for WebSocket connection
   * @param {WebSocketClient} wsClient - WebSocket client
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Promise that resolves when connected
   */
  waitForWebSocketConnection(wsClient, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error("WebSocket connection timeout"));
      }, timeout);

      const unsubscribe = wsClient.getConnectionStatus().subscribe((status) => {
        if (status === "connected") {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve();
        } else if (status === "error") {
          clearTimeout(timeoutId);
          unsubscribe();
          reject(new Error("WebSocket connection failed"));
        }
      });
    });
  }

  /**
   * Shutdown all services
   */
  async shutdown() {
    console.log("🛑 Shutting down service container...");

    try {
      // Disconnect WebSocket clients
      if (this.has("webSocketClient")) {
        const wsClient = this.get("webSocketClient");
        wsClient.disconnect();
      }

      // Clear all instances
      this.services.clear();
      this.singletons.forEach((singleton) => {
        singleton.instance = null;
      });

      this.initialized = false;
      console.log("✅ Service container shut down");
    } catch (error) {
      console.error("❌ Error during service container shutdown:", error);
    }
  }

  /**
   * Get all registered service names
   * @returns {Array<string>} List of service names
   */
  getServiceNames() {
    const names = new Set();

    this.services.forEach((_, name) => names.add(name));
    this.singletons.forEach((_, name) => names.add(name));
    this.factories.forEach((_, name) => names.add(name));

    return Array.from(names);
  }

  /**
   * Check if container is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Reset container (for testing)
   */
  reset() {
    this.shutdown();
    this.services.clear();
    this.singletons.clear();
    this.factories.clear();
    this.initialized = false;
    this.registerDefaultServices();
  }
}

/**
 * Global service container instance
 */
export const serviceContainer = new ServiceContainer();

/**
 * Helper function to get service from global container
 * @param {string} serviceName - Name of service to get
 * @returns {any} Service instance
 */
export function getService(serviceName) {
  return serviceContainer.get(serviceName);
}

// Export functions
export async function initializeAuthServices() {
  await serviceContainer.initializeAuth();
}

/**
 * Helper function to initialize global container
 * @returns {Promise} Promise that resolves when initialized
 */
export async function initializeServices() {
  // services: vmService, commandService, jobService, logService
  await serviceContainer.initializeFull();
}

/**
 * Helper function to shutdown global container
 * @returns {Promise} Promise that resolves when shut down
 */
export function shutdownServices() {
  return serviceContainer.shutdown();
}

// ✅ ADD: Reactive service health monitoring
export const serviceHealth = writable({
  apiClient: "disconnected",
  jobService: "disconnected",
  vmService: "ready",
});

export const getAPIClient = () => getService("apiClient");
export const getAuthService = () => getService("authService");
