/**
 * Core WebSocket Client
 *
 * Pure WebSocket client for real-time communication.
 * Handles connection management, event handling, and reconnection logic.
 *
 * @fileoverview Core WebSocket client for real-time backend communication
 */

import { io } from "socket.io-client";
import { writable } from "svelte/store";

/**
 * WebSocket Client configuration
 */
const DEFAULT_CONFIG = {
   transports: ["websocket", "polling"],
   timeout: 5000,
   reconnection: true,
   reconnectionAttempts: 5,
   reconnectionDelay: 1000,
   reconnectionDelayMax: 5000,
   maxReconnectionAttempts: 10,
};

/**
 * Connection states
 */
export const CONNECTION_STATES = {
   DISCONNECTED: "disconnected",
   CONNECTING: "connecting",
   CONNECTED: "connected",
   RECONNECTING: "reconnecting",
   ERROR: "error",
};

/**
 * Core WebSocket Client class
 *
 * Provides low-level WebSocket communication with the backend.
 * Does not contain business logic - that belongs in feature services.
 */
export class WebSocketClient {
   constructor(namespace = "", config = {}) {
      this.namespace = namespace;
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.socket = null;

      // Reactive stores
      this.connectionStatus = writable(CONNECTION_STATES.DISCONNECTED);
      this.lastError = writable(null);

      // Event handling
      this.eventHandlers = new Map();
      this.middlewares = [];

      // Connection state
      this.isConnected = false;
      this.reconnectAttempts = 0;
   }

   /**
    * Connect to WebSocket server
    * @param {string} url - Server URL (optional, auto-detected if not provided)
    */
   connect(url = null) {
      if (this.socket && this.socket.connected) {
         console.warn("WebSocket already connected");
         return;
      }

      const serverUrl = url || this.detectServerUrl();

      try {
         this.connectionStatus.set(CONNECTION_STATES.CONNECTING);

         // Create socket connection
         this.socket = io(`${serverUrl}${this.namespace}`, this.config);

         // Re-bind previously registered custom handlers
         if (this.eventHandlers) {
            for (const [event, handlers] of this.eventHandlers.entries()) {
               handlers.forEach((h) => this.socket.on(event, h));
            }
         }

         this.setupCoreEventHandlers();
         console.log(
            `🔌 WebSocket connecting to ${serverUrl}${this.namespace}`
         );
      } catch (error) {
         console.error("Failed to initialize WebSocket connection:", error);
         this.connectionStatus.set(CONNECTION_STATES.ERROR);
         this.lastError.set(error.message);
      }
   }

   /**
    * Auto-detect server URL
    */
   detectServerUrl() {
      if (typeof window !== "undefined") {
         return window.location.origin;
      }
      return "http://localhost:3000";
   }

   /**
    * Setup core WebSocket event handlers
    */
   setupCoreEventHandlers() {
      this.socket.on("connect", () => {
         console.log(`✅ WebSocket connected to ${this.namespace}`);
         this.isConnected = true;
         this.reconnectAttempts = 0;
         this.connectionStatus.set(CONNECTION_STATES.CONNECTED);
         this.lastError.set(null);

         this.triggerEvent("core:connected", { namespace: this.namespace });
      });

      this.socket.on("disconnect", (reason) => {
         console.log(`❌ WebSocket disconnected: ${reason}`);
         this.isConnected = false;
         this.connectionStatus.set(CONNECTION_STATES.DISCONNECTED);

         this.triggerEvent("core:disconnected", { reason });
      });

      this.socket.on("connect_error", (error) => {
         console.error("🚨 WebSocket connection error:", error);
         this.connectionStatus.set(CONNECTION_STATES.ERROR);
         this.lastError.set(error.message);

         this.triggerEvent("core:error", { error });
      });

      this.socket.on("reconnect", (attemptNumber) => {
         console.log(
            `🔄 WebSocket reconnected after ${attemptNumber} attempts`
         );
         this.connectionStatus.set(CONNECTION_STATES.CONNECTED);

         this.triggerEvent("core:reconnected", { attempts: attemptNumber });
      });

      this.socket.on("reconnect_attempt", (attemptNumber) => {
         console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}`);
         this.reconnectAttempts = attemptNumber;
         this.connectionStatus.set(CONNECTION_STATES.RECONNECTING);

         this.triggerEvent("core:reconnecting", { attempt: attemptNumber });
      });

      this.socket.on("reconnect_error", (error) => {
         console.error("🚨 WebSocket reconnection error:", error);
         this.triggerEvent("core:reconnect_error", { error });
      });

      this.socket.on("reconnect_failed", () => {
         console.error("🚨 WebSocket reconnection failed");
         this.connectionStatus.set(CONNECTION_STATES.ERROR);
         this.lastError.set("Reconnection failed after maximum attempts");

         this.triggerEvent("core:reconnect_failed", {});
      });
   }

   /**
    * Add event listener
    * @param {string} event - Event name
    * @param {Function} handler - Event handler function
    */
   on(event, handler) {
      if (!this.eventHandlers.has(event)) {
         this.eventHandlers.set(event, []);
      }

      this.eventHandlers.get(event).push(handler);

      // Also register with socket if connected
      if (this.socket) {
         this.socket.on(event, (data) => {
            // Add debugging for job completion events only (reduce spam)
            if (event.startsWith("job:") && !event.includes("log")) {
               console.log(`📨 WebSocket received ${event}:`, data);
            }
            handler(data);
         });
      }
   }

   /**
    * Remove event listener
    * @param {string} event - Event name
    * @param {Function} handler - Event handler function
    */
   off(event, handler) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
         const index = handlers.indexOf(handler);
         if (index > -1) {
            handlers.splice(index, 1);
         }
      }

      // Also remove from socket if connected
      if (this.socket) {
         this.socket.off(event, handler);
      }
   }

   /**
    * Emit event to server
    * @param {string} event - Event name
    * @param {any} data - Event data
    */
   emit(event, data) {
      if (!this.socket || !this.isConnected) {
         console.warn(`Cannot emit ${event}: WebSocket not connected`);
         throw new Error("WebSocket not connected");
      }

      // Apply middlewares
      let processedData = data;
      for (const middleware of this.middlewares) {
         processedData = middleware(event, processedData);
      }

      console.log(`📤 Emitting ${event}:`, processedData);
      this.socket.emit(event, processedData);
   }

   /**
    * Trigger internal event handlers
    * @param {string} event - Event name
    * @param {any} data - Event data
    */
   triggerEvent(event, data) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
         handlers.forEach((handler) => {
            try {
               handler(data);
            } catch (error) {
               console.error(`Error in event handler for ${event}:`, error);
            }
         });
      }
   }

   /**
    * Add middleware for outgoing events
    * @param {Function} middleware - Middleware function
    */
   addMiddleware(middleware) {
      this.middlewares.push(middleware);
   }

   /**
    * Join a room
    * @param {string} room - Room name
    */
   joinRoom(room) {
      if (!this.isConnected) {
         console.warn(`Cannot join room ${room}: WebSocket not connected`);
         return;
      }

      console.log(`🔗 Joining room: ${room}`);
      this.emit("join-room", room);
   }

   /**
    * Leave a room
    * @param {string} room - Room name
    */
   leaveRoom(room) {
      if (!this.isConnected) {
         console.warn(`Cannot leave room ${room}: WebSocket not connected`);
         return;
      }

      console.log(`🚪 Leaving room: ${room}`);
      this.emit("leave-room", room);
   }

   /**
    * Disconnect from server
    */
   disconnect() {
      if (this.socket) {
         console.log("🔌 Disconnecting WebSocket");
         this.socket.disconnect();
         this.socket = null;
      }

      this.isConnected = false;
      this.connectionStatus.set(CONNECTION_STATES.DISCONNECTED);
   }

   /**
    * Get connection status store
    */
   getConnectionStatus() {
      return this.connectionStatus;
   }

   /**
    * Get last error store
    */
   getLastError() {
      return this.lastError;
   }

   /**
    * Check if currently connected
    */
   getIsConnected() {
      return this.isConnected;
   }
}

/**
 * Create default WebSocket client for jobs namespace
 */
export const defaultJobsWebSocketClient = new WebSocketClient("/jobs");
