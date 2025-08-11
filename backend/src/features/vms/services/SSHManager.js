/**
 * SSH Manager
 *
 * util for:
 *  - managing SSH configuration parsing, connection testing, and host management.
 *  - working with ~/.ssh/config files and SSH connections.
 *
 */

import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

/**
 * SSH configuration and connection management class
 */
export class SSHManager {
  /**
   * Parses SSH configuration file and extracts host configurations
   * @param {string} [configPath] - Path to SSH config file (defaults to ~/.ssh/config)
   * @returns {Object} Object containing host configurations
   */
  static parseSSHConfig(configPath = null) {
    const sshConfigPath = configPath || path.join(os.homedir(), ".ssh/config");

    // Check if config file exists
    if (!fs.existsSync(sshConfigPath)) {
      console.warn(`SSH config file not found at ${sshConfigPath}`);
      return {};
    }

    try {
      const configContent = fs.readFileSync(sshConfigPath, "utf8");
      const hosts = {};
      let currentHost = null;

      // Parse each line of the config file
      configContent.split("\n").forEach((line) => {
        const trimmed = line.trim();

        // Skip comments and empty lines
        if (!trimmed || trimmed.startsWith("#")) {
          return;
        }

        if (trimmed.toLowerCase().startsWith("host ")) {
          // Extract host name, handling multiple hosts on one line
          const hostParts = trimmed.split(/\s+/).slice(1);
          if (hostParts.length > 0) {
            currentHost = hostParts[0]; // Use first host if multiple
            hosts[currentHost] = {};
          }
        } else if (currentHost && trimmed.includes(" ")) {
          // Parse configuration directive
          const spaceIndex = trimmed.indexOf(" ");
          const key = trimmed.substring(0, spaceIndex).toLowerCase();
          const value = trimmed.substring(spaceIndex + 1).trim();

          // Remove quotes if present
          const cleanValue = value.replace(/^["']|["']$/g, "");
          hosts[currentHost][key] = cleanValue;
        }
      });

      return hosts;
    } catch (error) {
      console.error(`Error parsing SSH config: ${error.message}`);
      return {};
    }
  }

  /**
   * Gets connection configuration for a specific SSH host alias
   * @param {string} hostAlias - SSH host alias from config
   * @returns {Object} Connection configuration object
   * @throws {Error} If host alias is not found in SSH config
   */
  static getConnectionConfig(hostAlias) {
    if (!hostAlias || typeof hostAlias !== "string") {
      throw new Error("Host alias must be a non-empty string");
    }

    const hosts = this.parseSSHConfig();
    const config = hosts[hostAlias];

    if (!config) {
      throw new Error(`Host ${hostAlias} not found in SSH config`);
    }

    // Parse port with validation
    let port = 22;
    if (config.port) {
      const parsedPort = parseInt(config.port, 10);
      if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
        console.warn(
          `Invalid port ${config.port} for host ${hostAlias}, using default 22`
        );
      } else {
        port = parsedPort;
      }
    }

    return {
      host: config.hostname || hostAlias,
      user: config.user || process.env.USER || "ubuntu",
      port,
      identityFile: config.identityfile,
      strictHostKeyChecking: config.stricthostkeychecking === "yes",
      connectTimeout: config.connecttimeout
        ? parseInt(config.connecttimeout, 10)
        : 10,
      serverAliveInterval: config.serveraliveinterval
        ? parseInt(config.serveraliveinterval, 10)
        : null,
      compression: config.compression === "yes",
    };
  }

  /**
   * Gets all SSH hosts from the configuration file
   * @returns {Array<Object>} Array of host objects with alias and configuration
   */
  static getAllHosts() {
    try {
      const hosts = this.parseSSHConfig();
      return Object.keys(hosts)
        .filter((hostAlias) => {
          // Filter out wildcard hosts, invalid entries, and system hosts
          return (
            hostAlias &&
            !hostAlias.includes("*") &&
            !hostAlias.includes("?") &&
            !hostAlias.toLowerCase().includes("github") &&
            !hostAlias.toLowerCase().includes("gitlab") &&
            hostAlias !== "localhost"
          );
        })
        .map((hostAlias) => {
          try {
            const config = this.getConnectionConfig(hostAlias);
            return {
              alias: hostAlias,
              config,
              // Create a suggested VM name based on the host alias
              suggestedVMName: this.generateVMName(hostAlias, config),
              // Determine if this looks like a server/VM host
              isServerHost: this.isServerHost(hostAlias, config),
            };
          } catch (error) {
            console.warn(
              `Skipping invalid host ${hostAlias}: ${error.message}`
            );
            return null;
          }
        })
        .filter((host) => host !== null && host.isServerHost); // Only return server hosts
    } catch (error) {
      console.error("Error getting all hosts:", error);
      return [];
    }
  }

  /**
   * Generate a VM name suggestion based on SSH host alias and config
   * @param {string} hostAlias - SSH host alias
   * @param {Object} config - SSH configuration
   * @returns {string} Suggested VM name
   */
  static generateVMName(hostAlias, config) {
    // If the alias already looks like a VM name, use it as-is
    if (hostAlias.includes("-vm") || hostAlias.includes("_vm")) {
      return hostAlias;
    }

    // For cloud instances, try to extract meaningful names
    if (config.host && config.host.includes("amazonaws.com")) {
      return `${hostAlias}-aws`;
    }
    if (config.host && config.host.includes("googleusercontent.com")) {
      return `${hostAlias}-gcp`;
    }
    if (config.host && config.host.includes("azure")) {
      return `${hostAlias}-azure`;
    }

    // Default: append -vm to the alias
    return `${hostAlias}-vm`;
  }

  /**
   * Determine if an SSH host looks like a server/VM rather than a git host or local machine
   * @param {string} hostAlias - SSH host alias
   * @param {Object} config - SSH configuration
   * @returns {boolean} True if this appears to be a server host
   */
  static isServerHost(hostAlias, config) {
    const alias = hostAlias.toLowerCase();
    const hostname = (config.host || "").toLowerCase();

    // Exclude common git hosts
    const gitHosts = ["github", "gitlab", "bitbucket", "git."];
    if (gitHosts.some((git) => alias.includes(git) || hostname.includes(git))) {
      return false;
    }

    // Exclude localhost and local networks that might be development machines
    if (alias === "localhost" || hostname === "localhost") {
      return false;
    }

    // Include cloud instances
    const cloudProviders = [
      "amazonaws.com",
      "googleusercontent.com",
      "azure",
      "digitalocean",
    ];
    if (cloudProviders.some((cloud) => hostname.includes(cloud))) {
      return true;
    }

    // Include hosts that look like servers
    const serverKeywords = [
      "server",
      "vm",
      "instance",
      "node",
      "prod",
      "staging",
      "dev",
    ];
    if (serverKeywords.some((keyword) => alias.includes(keyword))) {
      return true;
    }

    // Include if it has a non-standard SSH port (likely a server)
    if (config.port && config.port !== 22) {
      return true;
    }

    // Include if it has an IP address as hostname
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipRegex.test(hostname)) {
      return true;
    }

    // Default to true for other hosts (better to include than exclude)
    return true;
  }

  /**
   * Tests SSH connection to a specific host
   * @param {string} hostAlias - SSH host alias to test
   * @param {number} [timeout=5] - Connection timeout in seconds
   * @returns {Promise<Object>} Connection test result
   * @throws {Error} If connection test fails
   */
  static testConnection(hostAlias, timeout = 5) {
    return new Promise((resolve, reject) => {
      if (!hostAlias || typeof hostAlias !== "string") {
        reject(new Error("Host alias must be a non-empty string"));
        return;
      }

      // Validate timeout
      const connectTimeout = Math.max(1, Math.min(timeout, 30)); // Between 1-30 seconds

      const testProcess = spawn("ssh", [
        "-o",
        `ConnectTimeout=${connectTimeout}`,
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "UserKnownHostsFile=/dev/null",
        "-o",
        "BatchMode=yes", // Prevent interactive prompts
        "-o",
        "LogLevel=ERROR", // Reduce noise in stderr
        hostAlias,
        'echo "connection test successful"',
      ]);

      let output = "";
      let error = "";
      let isResolved = false;

      // Set up timeout for the entire operation
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          testProcess.kill("SIGTERM");
          reject(
            new Error(
              `SSH connection test timed out after ${connectTimeout} seconds`
            )
          );
        }
      }, (connectTimeout + 2) * 1000); // Add 2 seconds buffer

      testProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      testProcess.stderr.on("data", (data) => {
        error += data.toString();
      });

      testProcess.on("close", (code) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeoutId);

        if (code === 0) {
          resolve({
            success: true,
            output: output.trim(),
            hostAlias,
            timestamp: new Date().toISOString(),
          });
        } else {
          reject(
            new Error(
              `SSH connection test failed (exit code ${code}): ${error.trim()}`
            )
          );
        }
      });

      testProcess.on("error", (err) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeoutId);
        reject(new Error(`SSH connection error: ${err.message}`));
      });
    });
  }

  /**
   * Validates SSH host configuration
   * @param {string} hostAlias - SSH host alias to validate
   * @returns {Object} Validation result with details
   */
  static validateHostConfig(hostAlias) {
    try {
      const config = this.getConnectionConfig(hostAlias);
      const issues = [];

      // Check for common configuration issues
      if (!config.host) {
        issues.push("No hostname specified");
      }

      if (config.identityFile && !fs.existsSync(config.identityFile)) {
        issues.push(`Identity file not found: ${config.identityFile}`);
      }

      return {
        valid: issues.length === 0,
        issues,
        config,
      };
    } catch (error) {
      return {
        valid: false,
        issues: [error.message],
        config: null,
      };
    }
  }

  /**
   * Gets SSH configuration file path
   * @returns {string} Path to SSH config file
   */
  static getConfigPath() {
    return path.join(os.homedir(), ".ssh/config");
  }

  /**
   * Checks if SSH config file exists
   * @returns {boolean} True if config file exists
   */
  static hasConfigFile() {
    return fs.existsSync(this.getConfigPath());
  }
}
