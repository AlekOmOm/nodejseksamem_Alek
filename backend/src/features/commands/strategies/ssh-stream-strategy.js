import { spawn } from "child_process";
import { SSHManager } from "../../vms/ssh-manager.js";

export class SshStreamStrategy {
   static spawn(command, sshConfig = {}) {
      const {
         host = "localhost",
         user = process.env.USER || "root",
         port = 22,
         keyFile = null,
         strictHostKeyChecking = false,
      } = sshConfig;

      // Build SSH command arguments
      const sshArgs = [];

      // Add port if specified
      if (port !== 22) {
         sshArgs.push("-p", port.toString());
      }

      // Add key file if specified
      if (keyFile) {
         sshArgs.push("-i", keyFile);
      }

      // Disable strict host key checking but keep default known_hosts file so the warning appears only once
      if (!strictHostKeyChecking) {
         sshArgs.push("-o", "StrictHostKeyChecking=no");
      }

      // Add connection timeout
      sshArgs.push("-o", "ConnectTimeout=10");

      // Add host and command
      const hostString = user ? `${user}@${host}` : host;
      sshArgs.push(hostString, command);

      const options = {
         stdio: ["pipe", "pipe", "pipe"],
         env: process.env,
      };

      return spawn("ssh", sshArgs, options);
   }

   static spawnWithConfigHost(configHost, command) {
      // Use SSH config host entry
      const sshArgs = [
         "-o",
         "StrictHostKeyChecking=no",
         "-o",
         "ConnectTimeout=10",
         configHost,
         command,
      ];

      const options = {
         stdio: ["pipe", "pipe", "pipe"],
         env: process.env,
      };

      return spawn("ssh", sshArgs, options);
   }

   static spawnWithHostAlias(hostAlias, command) {
      try {
         // Get connection config from SSH config
         const config = SSHManager.getConnectionConfig(hostAlias);

         // Use the SSH config host alias directly
         return this.spawnWithConfigHost(hostAlias, command);
      } catch (error) {
         console.error(
            `Failed to get SSH config for host ${hostAlias}:`,
            error
         );
         throw error;
      }
   }

   static parseConnectionString(connectionString) {
      // Parse connection strings like "user@host:port" or "host:port"
      const parts = connectionString.split("@");
      let user = null;
      let hostPort = connectionString;

      if (parts.length === 2) {
         user = parts[0];
         hostPort = parts[1];
      }

      const hostPortParts = hostPort.split(":");
      const host = hostPortParts[0];
      const port = hostPortParts.length > 1 ? parseInt(hostPortParts[1]) : 22;

      return { user, host, port };
   }

   static testConnection(sshConfig) {
      // Test SSH connection with a simple command
      return new Promise((resolve, reject) => {
         const testProcess = this.spawn('echo "connection test"', sshConfig);

         let output = "";
         let error = "";

         testProcess.stdout.on("data", (data) => {
            output += data.toString();
         });

         testProcess.stderr.on("data", (data) => {
            error += data.toString();
         });

         testProcess.on("close", (code) => {
            if (code === 0) {
               resolve({ success: true, output });
            } else {
               reject(new Error(`SSH connection test failed: ${error}`));
            }
         });

         testProcess.on("error", (err) => {
            reject(new Error(`SSH connection error: ${err.message}`));
         });
      });
   }
}
