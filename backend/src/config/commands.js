/**
 * Command Configuration
 *
 * This module defines all available commands that can be executed through the VM Orchestrator.
 * Commands are organized by type and include metadata for proper execution and UI display.
 *
 * @fileoverview Command definitions for the VM Orchestrator application
 */

/**
 * Available command types (must match database schema constraint)
 * @readonly
 * @enum {string}
 */
export const COMMAND_TYPES = {
   STREAM: "stream", // For local commands that stream output
   SSH: "ssh", // For remote SSH commands
   TERMINAL: "terminal", // For commands that spawn new terminal windows
};

/**
 * Command execution strategies
 * @readonly
 * @enum {string}
 */
export const EXECUTION_STRATEGIES = {
   STREAM: "stream",
   TERMINAL: "terminal",
   SSH: "ssh",
};

/**
 * Default command configuration
 * Each command must have: type, cmd, description
 * SSH commands must also have: hostAlias
 *
 * @type {Object.<string, CommandConfig>}
 */
export const DEFAULT_COMMANDS = {
   "vm-status": {
      type: COMMAND_TYPES.SSH,
      cmd: 'echo "VM Status: Running" && ps aux | head -5',
      hostAlias: "<host-alias>",
      description: "Check local VM status and processes",
   },
   "vm-logs": {
      type: COMMAND_TYPES.SSH,
      cmd: 'echo "Recent system logs:" && tail -10 /var/log/system.log 2>/dev/null || echo "No system logs available"',
      hostAlias: "<host-alias>",
      description: "Show recent system logs",
   },
   "docker-ps": {
      type: COMMAND_TYPES.SSH,
      cmd: 'docker ps',
      hostAlias: "<host-alias>",
      description: "List running Docker containers",
   },
   "docker-ps-grep": {
      type: COMMAND_TYPES.SSH,
      cmd: "docker ps | grep <container-name>",
      hostAlias: "<host-alias>",
      description: "Check container status",
   },
   "system-info": {
      type: COMMAND_TYPES.SSH,
      cmd: "uname -a && df -h",
      hostAlias: "<host-alias>",
      description: "Show system information and disk usage",
   },
};

/**
 * Command configuration interface
 * @typedef {Object} CommandConfig
 * @property {string} type - Command type (local, ssh, terminal)
 * @property {string} cmd - Command to execute
 * @property {string} description - Human-readable description
 * @property {string} [hostAlias] - SSH host alias (required for SSH commands)
 * @property {string} [workingDir] - Working directory for command execution
 * @property {number} [timeout] - Command timeout in milliseconds
 * @property {Object} [env] - Environment variables to set
 */

/**
 * Validates a command configuration object
 * @param {string} key - Command key
 * @param {CommandConfig} config - Command configuration
 * @throws {Error} If configuration is invalid
 */
export function validateCommandConfig(key, config) {
   if (!key || typeof key !== "string") {
      throw new Error("Command key must be a non-empty string");
   }

   if (!config || typeof config !== "object") {
      throw new Error(`Command ${key}: configuration must be an object`);
   }

   if (!config.type || !Object.values(COMMAND_TYPES).includes(config.type)) {
      throw new Error(
         `Command ${key}: type must be one of ${Object.values(
            COMMAND_TYPES
         ).join(", ")}`
      );
   }

   if (!config.cmd || typeof config.cmd !== "string") {
      throw new Error(`Command ${key}: cmd must be a non-empty string`);
   }

   if (!config.description || typeof config.description !== "string") {
      throw new Error(`Command ${key}: description must be a non-empty string`);
   }

   if (config.type === COMMAND_TYPES.SSH && !config.hostAlias) {
      throw new Error(`Command ${key}: SSH commands must specify hostAlias`);
   }
}

/**
 * Validates all commands in a configuration object
 * @param {Object.<string, CommandConfig>} commands - Commands to validate
 * @throws {Error} If any command is invalid
 */
export function validateCommands(commands) {
   if (!commands || typeof commands !== "object") {
      throw new Error("Commands must be an object");
   }

   for (const [key, config] of Object.entries(commands)) {
      validateCommandConfig(key, config);
   }
}

/**
 * Gets the execution strategy for a command type
 * @param {string} commandType - Command type
 * @returns {string} Execution strategy
 */
export function getExecutionStrategy(commandType) {
   switch (commandType) {
      case COMMAND_TYPES.STREAM:
         return EXECUTION_STRATEGIES.STREAM;
      case COMMAND_TYPES.SSH:
         return EXECUTION_STRATEGIES.SSH;
      case COMMAND_TYPES.TERMINAL:
         return EXECUTION_STRATEGIES.TERMINAL;
      default:
         return EXECUTION_STRATEGIES.STREAM;
   }
}

/**
 * Creates a command registry with validation
 * @param {Object.<string, CommandConfig>} [customCommands] - Custom commands to merge with defaults
 * @returns {Object.<string, CommandConfig>} Validated command registry
 */
export function createCommandRegistry(customCommands = {}) {
   const commands = { ...DEFAULT_COMMANDS, ...customCommands };
   validateCommands(commands);
   return commands;
}
