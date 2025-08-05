/**
 * Terminal Spawn Strategy
 *
 * Handles spawning commands in new terminal windows across different operating systems.
 * Provides platform-specific implementations for macOS, Linux, and Windows.
 *
 * @fileoverview Cross-platform terminal spawning strategy
 */

import { spawn } from "child_process";

/**
 * Strategy class for spawning commands in new terminal windows
 */
export class TerminalSpawnStrategy {
   /**
    * Spawns a command in a new terminal window based on the current platform
    * @param {string} command - Command to execute in the terminal
    * @param {string} [workingDir] - Working directory for the command
    * @returns {ChildProcess} The spawned process
    * @throws {Error} If platform is unsupported or spawning fails
    */
   static spawn(command, workingDir = null) {
      if (!command || typeof command !== "string") {
         throw new Error("Command must be a non-empty string");
      }

      const platform = process.platform;

      try {
         switch (platform) {
            case "darwin": // macOS
               return this.spawnMacOS(command, workingDir);
            case "linux":
               return this.spawnLinux(command, workingDir);
            case "win32":
               return this.spawnWindows(command, workingDir);
            default:
               throw new Error(`Unsupported platform: ${platform}`);
         }
      } catch (error) {
         throw new Error(
            `Failed to spawn terminal on ${platform}: ${error.message}`
         );
      }
   }

   /**
    * Spawns a command in Terminal.app on macOS using AppleScript
    * @param {string} command - Command to execute
    * @param {string} [workingDir] - Working directory
    * @returns {ChildProcess} The spawned osascript process
    * @throws {Error} If AppleScript execution fails
    */
   static spawnMacOS(command, workingDir) {
      try {
         // Escape single quotes in command and directory path
         const escapedCommand = command.replace(/'/g, "'\"'\"'");
         const escapedDir = workingDir
            ? workingDir.replace(/'/g, "'\"'\"'")
            : null;

         // Create AppleScript to open Terminal with the command
         const script = escapedDir
            ? `tell application "Terminal" to do script "cd '${escapedDir}' && ${escapedCommand}"`
            : `tell application "Terminal" to do script "${escapedCommand}"`;

         return spawn("osascript", ["-e", script], {
            detached: true,
            stdio: "ignore",
         });
      } catch (error) {
         throw new Error(`Failed to create macOS terminal: ${error.message}`);
      }
   }

   static spawnLinux(command, workingDir) {
      // Try different terminal emulators in order of preference
      const terminals = [
         { cmd: "gnome-terminal", args: ["--", "bash", "-c"] },
         { cmd: "xterm", args: ["-e", "bash", "-c"] },
         { cmd: "konsole", args: ["-e", "bash", "-c"] },
         { cmd: "xfce4-terminal", args: ["-e", "bash", "-c"] },
      ];

      const fullCommand = workingDir
         ? `cd '${workingDir}' && ${command}; exec bash`
         : `${command}; exec bash`;

      for (const terminal of terminals) {
         try {
            return spawn(terminal.cmd, [...terminal.args, fullCommand], {
               cwd: workingDir,
               detached: true,
               stdio: "ignore",
            });
         } catch (error) {
            // Try next terminal if this one fails
            continue;
         }
      }

      throw new Error("No suitable terminal emulator found");
   }

   static spawnWindows(command, workingDir) {
      // Use Windows Terminal if available, otherwise fall back to cmd
      const fullCommand = workingDir
         ? `cd /d "${workingDir}" && ${command}`
         : command;

      try {
         // Try Windows Terminal first
         return spawn("wt", ["cmd", "/k", fullCommand], {
            cwd: workingDir,
            detached: true,
            stdio: "ignore",
         });
      } catch (error) {
         // Fall back to cmd
         return spawn("cmd", ["/k", fullCommand], {
            cwd: workingDir,
            detached: true,
            stdio: "ignore",
         });
      }
   }
}
