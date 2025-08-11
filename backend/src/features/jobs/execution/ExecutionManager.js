/**
 * Execution Manager
 *
 * Manages command execution across different strategies (local, SSH, terminal spawn).
 * Handles job lifecycle, logging, and real-time streaming of command output.
 *
 * @fileoverview Command execution manager with strategy pattern implementation
 */

import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { TerminalSpawnStrategy } from "./TerminalSpawnStrategy.js";
import { LocalStreamStrategy } from "./LocalStreamStrategy.js";
import { SshStreamStrategy } from "./SshStreamStrategy.js";
import { getExecutionStrategy } from "../../commands/commandsUtils.js";
import { dbSingleton } from "../../../database/PgsqlDatabase.js";

/**
 * ExecutionManager class handles command execution with different strategies
 */
class ExecutionManager {
  /**
   * Creates an ExecutionManager instance
   * @param {Server} io - Socket.IO server instance for real-time communication
   * @param {Pool} db - PostgreSQL connection pool for job persistence
   */
  constructor(io) {
    this.io = io;
    this.db = dbSingleton;
    this.activeJobs = new Map();

    // Bind methods to preserve context
    this.executeWithStrategy = this.executeWithStrategy.bind(this);
    this.setupStreamHandlers = this.setupStreamHandlers.bind(this);
    this.logJobEvent = this.logJobEvent.bind(this);
  }

  async attachIO(io) {
    this.io = io;
  }

  /**
   * Executes a command using the appropriate strategy
   * @param {string} command - Command to execute
   * @param {string} [type="stream"] - Execution type (stream, terminal, ssh)
   * @param {string} [workingDir=null] - Working directory for command execution
   * @param {string} [hostAlias=null] - SSH host alias for remote execution
   * @param {string} [vmId=null] - VM ID for job cache integration
   * @returns {Promise<Object>} Job execution result with jobId
   * @throws {Error} If command validation fails or execution strategy is unknown
   */
  async executeWithStrategy(
    command,
    type = "stream",
    workingDir = null,
    hostAlias = null,
    vmId = null
  ) {
    // Validate inputs
    if (!command || typeof command !== "string") {
      throw new Error("Command must be a non-empty string");
    }

    const jobId = uuidv4();
    console.log(`🚀 Starting job ${jobId}: ${command} (type: ${type})`);

    try {
      // Insert job record into database with vmId
      await this.db.query(
        "INSERT INTO jobs (id, vm_id, command, type, status, started_at) VALUES ($1, $2, $3, $4, $5, NOW())",
        [jobId, vmId, command, type, "running"]
      );

      let result;
      switch (type) {
        case "terminal":
          result = await this.executeTerminal(jobId, command, workingDir);
          break;
        case "stream":
          result = await this.executeStream(jobId, command, workingDir);
          break;
        case "ssh":
          result = await this.executeSsh(jobId, command, hostAlias);
          break;
        default:
          throw new Error(`Unknown execution type: ${type}`);
      }

      return { jobId, ...result };
    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
      throw error;
    }
  }

  /**
   * Executes a command in a new terminal window
   * @param {string} jobId - Unique job identifier
   * @param {string} command - Command to execute
   * @param {string} [workingDir] - Working directory for command execution
   * @returns {Promise<Object>} Execution result with process information
   * @throws {Error} If terminal spawning fails
   */
  async executeTerminal(jobId, command, workingDir) {
    try {
      // Update job status to spawned for terminal jobs
      await this.db.query("UPDATE jobs SET status = $1 WHERE id = $2", [
        "spawned",
        jobId,
      ]);

      const process = TerminalSpawnStrategy.spawn(command, workingDir);
      this.activeJobs.set(jobId, { process, type: "terminal" });

      // Emit job started event
      this.io.emit("job:started", { jobId, type: "terminal", command });

      return { type: "terminal", spawned: true };
    } catch (error) {
      console.error(`Terminal execution failed for job ${jobId}:`, error);
      throw new Error(`Failed to spawn terminal: ${error.message}`);
    }
  }

  /**
   * Executes a command with streaming output
   * @param {string} jobId - Unique job identifier
   * @param {string} command - Command to execute
   * @param {string} [workingDir] - Working directory for command execution
   * @returns {Promise<Object>} Execution result with process information
   * @throws {Error} If command execution fails
   */
  async executeStream(jobId, command, workingDir) {
    try {
      const process = LocalStreamStrategy.spawn(command, workingDir);
      this.activeJobs.set(jobId, { process, type: "stream" });

      // Emit job started event (both new and legacy formats)
      this.io.emit("job:started", { jobId, type: "stream", command });
      this.io.emit("job-started", { jobId, command }); // Legacy format

      // Set up stream handlers for real-time output
      this.setupStreamHandlers(jobId, process);

      return { type: "stream", process };
    } catch (error) {
      console.error(`Stream execution failed for job ${jobId}:`, error);
      throw new Error(`Failed to execute command: ${error.message}`);
    }
  }

  /**
   * Executes a command via SSH with streaming output
   * @param {string} jobId - Unique job identifier
   * @param {string} command - Command to execute
   * @param {string} [hostAlias] - SSH host alias from ~/.ssh/config
   * @returns {Promise<Object>} Execution result with process information
   * @throws {Error} If SSH execution fails
   */
  async executeSsh(jobId, command, hostAlias = null) {
    try {
      let process;

      if (hostAlias) {
        // Use SSH config host alias
        process = SshStreamStrategy.spawnWithHostAlias(hostAlias, command);
      } else {
        // Use default SSH execution (for backward compatibility)
        process = SshStreamStrategy.spawn(command);
      }

      this.activeJobs.set(jobId, { process, type: "ssh" });

      // Emit job started event (both new and legacy formats)
      this.io.emit("job:started", { jobId, type: "ssh", command });
      this.io.emit("job-started", { jobId, command }); // Legacy format

      // Set up stream handlers for real-time output
      this.setupStreamHandlers(jobId, process);

      return { type: "ssh", process };
    } catch (error) {
      console.error(`SSH execution failed for job ${jobId}:`, error);
      throw new Error(`Failed to execute SSH command: ${error.message}`);
    }
  }

  /**
   * Sets up stream handlers for a process to capture and broadcast output
   * @param {string} jobId - Unique job identifier
   * @param {ChildProcess} process - The spawned process
   */
  setupStreamHandlers(jobId, process) {
    /**
     * Handle stdout data from the process
     */
    process.stdout.on("data", async (data) => {
      try {
        const chunk = data.toString();
        await this.logJobEvent(jobId, "stdout", chunk);

        // Emit both new and legacy formats for compatibility
        this.io.emit("job:log", {
          jobId,
          stream: "stdout",
          chunk,
          timestamp: new Date().toISOString(),
        });
        this.io.emit("job-log", { jobId, stream: "stdout", data: chunk }); // Legacy format
      } catch (error) {
        console.error(`Error handling stdout for job ${jobId}:`, error);
      }
    });

    /**
     * Handle stderr data from the process
     */
    process.stderr.on("data", async (data) => {
      try {
        const chunk = data.toString();
        await this.logJobEvent(jobId, "stderr", chunk);

        // Emit both new and legacy formats for compatibility
        this.io.emit("job:log", {
          jobId,
          stream: "stderr",
          chunk,
          timestamp: new Date().toISOString(),
        });
        this.io.emit("job-log", { jobId, stream: "stderr", data: chunk }); // Legacy format
      } catch (error) {
        console.error(`Error handling stderr for job ${jobId}:`, error);
      }
    });

    /**
     * Handle process completion
     */
    process.on("close", async (code) => {
      try {
        const status = code === 0 ? "success" : "failed";
        await this.db.query(
          "UPDATE jobs SET status = $1, finished_at = NOW(), exit_code = $2 WHERE id = $3",
          [status, code, jobId]
        );

        // Update job cache if this job has a vmId
        const jobResult = await this.db.query(
          "SELECT * FROM jobs WHERE id = $1",
          [jobId]
        );
        if (jobResult.rows.length > 0) {
          const job = jobResult.rows[0];
          // Try to extract vmId from job metadata or context
          // For now, we'll skip cache update here since we don't store vmId in jobs table
          // This could be enhanced by adding vmId to the jobs table schema
        }

        // Emit both new and legacy formats for compatibility
        this.io.emit("job:done", {
          jobId,
          status,
          exitCode: code,
          timestamp: new Date().toISOString(),
        });
        this.io.emit("job-finished", { jobId, status, exitCode: code }); // Legacy format

        this.activeJobs.delete(jobId);
      } catch (error) {
        console.error(`Error handling process close for job ${jobId}:`, error);
      }
    });

    /**
     * Handle process errors
     */
    process.on("error", async (error) => {
      try {
        await this.logJobEvent(
          jobId,
          "system",
          `Process error: ${error.message}`
        );
        await this.db.query(
          "UPDATE jobs SET status = $1, finished_at = NOW() WHERE id = $2",
          ["failed", jobId]
        );

        this.io.emit("job:error", {
          jobId,
          error: error.message,
          timestamp: new Date().toISOString(),
        });

        this.activeJobs.delete(jobId);
      } catch (dbError) {
        console.error(
          `Error handling process error for job ${jobId}:`,
          dbError
        );
      }
    });
  }

  /**
   * Logs a job event to the database
   * @param {string} jobId - Unique job identifier
   * @param {string} stream - Stream type (stdout, stderr, system)
   * @param {string} chunk - Output chunk to log
   */
  async logJobEvent(jobId, stream, chunk) {
    try {
      await this.db.query(
        "INSERT INTO job_logs (job_id, ts, stream, data) VALUES ($1, NOW(), $2, $3)",
        [jobId, stream, chunk]
      );
    } catch (error) {
      console.error("Failed to log job event:", error);
    }
  }

  /**
   * Cancels a running job
   * @param {string} jobId - Unique job identifier
   * @returns {Promise<Object>} Cancellation result
   * @throws {Error} If job is not found or cancellation fails
   */
  async cancelJob(jobId) {
    if (!jobId || typeof jobId !== "string") {
      throw new Error("Valid job ID is required");
    }

    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found or already finished`);
    }

    try {
      // Send termination signal to the process
      job.process.kill("SIGTERM");

      // Update job status in database
      await this.db.query(
        "UPDATE jobs SET status = $1, finished_at = NOW() WHERE id = $2",
        ["canceled", jobId]
      );

      // Notify clients about cancellation
      this.io.emit("job:canceled", {
        jobId,
        timestamp: new Date().toISOString(),
      });

      this.activeJobs.delete(jobId);

      return { success: true, jobId };
    } catch (error) {
      throw new Error(`Failed to cancel job ${jobId}: ${error.message}`);
    }
  }

  /**
   * Gets list of currently active job IDs
   * @returns {Array<string>} Array of active job IDs
   */
  getActiveJobs() {
    return Array.from(this.activeJobs.keys());
  }

  /**
   * Checks if a job is currently active
   * @param {string} jobId - Job ID to check
   * @returns {boolean} True if job is active
   */
  isJobActive(jobId) {
    return this.activeJobs.has(jobId);
  }

  /**
   * Gets detailed information about active jobs
   * @returns {Array<Object>} Array of active job details
   */
  getActiveJobDetails() {
    return Array.from(this.activeJobs.entries()).map(([jobId, job]) => ({
      jobId,
      type: job.type,
      startTime: job.startTime || new Date().toISOString(),
    }));
  }

  /**
   * Gracefully shuts down all active jobs
   * @returns {Promise<void>}
   */
  async shutdown() {
    console.log(
      `Shutting down ExecutionManager with ${this.activeJobs.size} active jobs`
    );

    const shutdownPromises = Array.from(this.activeJobs.keys()).map(
      async (jobId) => {
        try {
          await this.cancelJob(jobId);
        } catch (error) {
          console.error(`Error canceling job ${jobId} during shutdown:`, error);
        }
      }
    );

    await Promise.all(shutdownPromises);
    console.log("ExecutionManager shutdown complete");
  }
}

export const executionManager = new ExecutionManager(null);
