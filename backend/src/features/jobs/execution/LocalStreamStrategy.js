import { spawn } from "child_process";

export class LocalStreamStrategy {
  static spawn(command, workingDir = null) {
    // Parse command into executable and arguments
    const parts = this.parseCommand(command);
    const executable = parts[0];
    const args = parts.slice(1);

    const options = {
      cwd: workingDir || process.cwd(),
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    };

    return spawn(executable, args, options);
  }

  static parseCommand(command) {
    // Simple command parsing - splits on spaces but respects quotes
    const parts = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";

    for (let i = 0; i < command.length; i++) {
      const char = command[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = "";
      } else if (char === " " && !inQuotes) {
        if (current.trim()) {
          parts.push(current.trim());
          current = "";
        }
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts;
  }

  static spawnShell(command, workingDir = null) {
    // Alternative method that uses shell execution
    const shell = process.platform === "win32" ? "cmd" : "bash";
    const shellFlag = process.platform === "win32" ? "/c" : "-c";

    const options = {
      cwd: workingDir || process.cwd(),
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    };

    return spawn(shell, [shellFlag, command], options);
  }
}
