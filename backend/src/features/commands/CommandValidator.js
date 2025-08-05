export class CommandValidator {
  static validateAndNormalize(data) {
    if (typeof data === "string") {
      return this.validateLegacyFormat(data);
    }
    if (typeof data === "object" && data !== null) {
      return this.validateObjectFormat(data);
    }
    throw new Error("Invalid command data format");
  }
  
  static validateLegacyFormat(commandKey) {
    const commandConfig = COMMANDS[commandKey];
    if (!commandConfig) {
      throw new Error(`Unknown command: ${commandKey}`);
    }
    return {
      command: commandConfig.cmd,
      type: commandConfig.type || "stream",
      hostAlias: commandConfig.hostAlias
    };
  }
  
  static validateObjectFormat(data) {
    const { command, type = "stream", workingDir, hostAlias, vmId } = data;
    if (!command || typeof command !== "string") {
      throw new Error("Command is required and must be a string");
    }
    return { command, type, workingDir, hostAlias, vmId };
  }
}