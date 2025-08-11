/**
 * Application Configuration
 *
 * Central configuration module for the VM Orchestrator application.
 * Handles environment variables, database configuration, and application settings.
 *
 * @fileoverview Main configuration module with environment-based overrides
 */

import { createCommandRegistry } from "../features/commands/commandsUtils.js";

/**
 * Environment configuration with defaults
 */
const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT) || 3000,

  // Database configuration
  POSTGRES_USER: process.env.POSTGRES_USER || "admin",
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || "admin",
  POSTGRES_DB: process.env.POSTGRES_DB || "mvp-vm-orchestrator",
  POSTGRES_HOST: process.env.POSTGRES_HOST || "localhost",
  POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT) || 5432,

  // WebSocket configuration
  CORS_ORIGINS: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
      ],

  // Application settings
  MAX_LOG_LINES: parseInt(process.env.MAX_LOG_LINES) || 1000,
  JOB_TIMEOUT: parseInt(process.env.JOB_TIMEOUT) || 300000, // 5 minutes
  MAX_CONCURRENT_JOBS: parseInt(process.env.MAX_CONCURRENT_JOBS) || 10,

  // SSH configuration
  SSH_CONNECT_TIMEOUT: parseInt(process.env.SSH_CONNECT_TIMEOUT) || 10,
  SSH_CONFIG_PATH: process.env.SSH_CONFIG_PATH || null, // Uses default ~/.ssh/config

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  LOG_FORMAT: process.env.LOG_FORMAT || "combined",

  // AWS Configuration
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || "us-east-1",
  AWS_DYNAMODB_VMS_TABLE:
    process.env.AWS_DYNAMODB_VMS_TABLE || "vm-orchestrator-vms",
  AWS_DYNAMODB_COMMANDS_TABLE:
    process.env.AWS_DYNAMODB_COMMANDS_TABLE || "vm-orchestrator-commands",

  // Serverless API Configuration
  SERVERLESS_API_URL:
    process.env.SERVERLESS_API_URL ||
    "https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com",
};

/**
 * Database connection configuration
 * @type {Object}
 */
export const DATABASE_CONFIG = {
  user: ENV.POSTGRES_USER,
  host: ENV.POSTGRES_HOST,
  database: ENV.POSTGRES_DB,
  password: ENV.POSTGRES_PASSWORD,
  port: ENV.POSTGRES_PORT,

  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait for a connection
};

/**
 * Server configuration
 * @type {Object}
 */
export const SERVER_CONFIG = {
  port: ENV.PORT,
  cors: {
    origin: ENV.CORS_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },

  // Static file serving
  staticPath: "../../frontend/dist",

  // Request limits
  jsonLimit: "10mb",
  urlEncodedLimit: "10mb",
};

/**
 * WebSocket configuration
 * @type {Object}
 */
export const WEBSOCKET_CONFIG = {
  cors: SERVER_CONFIG.cors,
  pingTimeout: 60000,
  pingInterval: 25000,

  // Namespace configuration
  jobsNamespace: "/jobs",

  // Event configuration
  maxListeners: 100,
};

/**
 * Application-wide settings
 * @type {Object}
 */
export const APP_CONFIG = {
  maxLogLines: ENV.MAX_LOG_LINES,
  jobTimeout: ENV.JOB_TIMEOUT,
  maxConcurrentJobs: ENV.MAX_CONCURRENT_JOBS,

  // SSH settings
  ssh: {
    connectTimeout: ENV.SSH_CONNECT_TIMEOUT,
    configPath: ENV.SSH_CONFIG_PATH,
    strictHostKeyChecking: false,
    userKnownHostsFile: "/dev/null",
  },

  // Logging settings
  logging: {
    level: ENV.LOG_LEVEL,
    format: ENV.LOG_FORMAT,
  },
};

/**
 * AWS configuration
 * @type {Object}
 */
export const AWS_CONFIG = {
  region: ENV.AWS_REGION,
  credentials:
    ENV.AWS_ACCESS_KEY_ID && ENV.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: ENV.AWS_ACCESS_KEY_ID,
          secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,

  // Serverless API endpoint
  apiUrl: ENV.SERVERLESS_API_URL,

  // DynamoDB table names
  tables: {
    vms: ENV.AWS_DYNAMODB_VMS_TABLE,
    commands: ENV.AWS_DYNAMODB_COMMANDS_TABLE,
  },
};

/**
 * Command registry - initialized with default commands
 * Can be extended with custom commands if needed
 * @type {Object}
 */
export const COMMANDS = createCommandRegistry();

/**
 * Validates the current configuration
 * @throws {Error} If configuration is invalid
 */
export function validateConfig() {
  // Validate required environment variables
  const required = ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"];
  const missing = required.filter((key) => !ENV[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  // Validate numeric values
  if (ENV.PORT < 1 || ENV.PORT > 65535) {
    throw new Error("PORT must be between 1 and 65535");
  }

  if (ENV.POSTGRES_PORT < 1 || ENV.POSTGRES_PORT > 65535) {
    throw new Error("POSTGRES_PORT must be between 1 and 65535");
  }

  // Validate CORS origins
  if (
    !Array.isArray(SERVER_CONFIG.cors.origin) ||
    SERVER_CONFIG.cors.origin.length === 0
  ) {
    throw new Error("At least one CORS origin must be specified");
  }
}

/**
 * Gets configuration for a specific environment
 * @param {string} [environment] - Environment name (defaults to NODE_ENV)
 * @returns {Object} Environment-specific configuration
 */
export function getEnvironmentConfig(environment = ENV.NODE_ENV) {
  const baseConfig = {
    database: DATABASE_CONFIG,
    server: SERVER_CONFIG,
    websocket: WEBSOCKET_CONFIG,
    app: APP_CONFIG,
    aws: AWS_CONFIG,
    commands: COMMANDS,
  };

  switch (environment) {
    case "development":
      return {
        ...baseConfig,
        app: {
          ...baseConfig.app,
          logging: { ...baseConfig.app.logging, level: "debug" },
        },
      };

    case "production":
      return {
        ...baseConfig,
        app: {
          ...baseConfig.app,
          logging: { ...baseConfig.app.logging, level: "warn" },
        },
      };

    case "test":
      return {
        ...baseConfig,
        database: {
          ...baseConfig.database,
          database: `${baseConfig.database.database}_test`,
        },
      };

    default:
      return baseConfig;
  }
}

// Validate configuration on module load
validateConfig();

// Export environment for debugging
export { ENV };
