/**
 * Enhanced Jobs Namespace with improved logging and error handling
 */

import { COMMANDS } from "./../../config/index.js";

/**
 * Get browser info from user agent
 * @param {string} userAgent - User agent string
 * @returns {string} Browser info
 */
function getBrowserInfo(userAgent) {
   if (!userAgent) return "Unknown";

   if (userAgent.includes("Chrome")) return "Chrome";
   if (userAgent.includes("Firefox")) return "Firefox";
   if (userAgent.includes("Safari")) return "Safari";
   if (userAgent.includes("Edge")) return "Edge";

   return "Other";
}

/**
 * Setup enhanced jobs namespace with improved connection management
 * @param {Server} io - Socket.io server instance
 * @param {ExecutionManager} executionManager - Execution manager instance
 */
export function setupJobsNamespace(io, executionManager) {
   const jobsNamespace = io.of("/jobs");

   console.log("🔧 Setting up enhanced /jobs namespace");

   jobsNamespace.on("connection", (socket) => {
      // Enhanced connection logging
      const clientInfo = {
         id: socket.id,
         userAgent: socket.handshake.headers["user-agent"],
         ip: socket.handshake.address,
         timestamp: new Date().toISOString(),
      };

      socket.clientInfo = clientInfo;

      console.log(`🔗 New client connected to /jobs namespace:
      ID: ${clientInfo.id}
      Browser: ${getBrowserInfo(clientInfo.userAgent)}
      IP: ${clientInfo.ip}
      Time: ${clientInfo.timestamp}`);

      /**
       * Enhanced command execution handler
       */
      socket.on("execute-command", async (data) => {
         console.log(`⚡ Command Execution Request:
         Client: ${clientInfo.id} (${getBrowserInfo(clientInfo.userAgent)})
         Data: ${JSON.stringify(data, null, 2)}`);

         try {
            // Support both legacy format (string) and new format (object)
            let command, type, workingDir, hostAlias, vmId;

            if (typeof data === "string") {
               // Legacy format: data is a command key like "vm-status"
               const commandKey = data;
               const commandConfig = COMMANDS[commandKey];

               if (!commandConfig) {
                  console.error(`❌ Unknown legacy command: ${commandKey}`);
                  socket.emit("job:error", {
                     error: `Unknown command: ${commandKey}`,
                     timestamp: new Date().toISOString(),
                  });
                  return;
               }

               command = commandConfig.cmd;
               type = commandConfig.type || "stream";
               hostAlias = commandConfig.hostAlias;

               console.log(
                  `📋 Legacy command resolved: ${commandKey} -> ${command}`
               );
            } else if (typeof data === "object" && data !== null) {
               // New format: data is an object with command details
               ({
                  command,
                  type = "stream",
                  workingDir,
                  hostAlias,
                  vmId,
               } = data);

               console.log(
                  `📋 Object command: ${command} (type: ${type}, host: ${
                     hostAlias || "local"
                  }, vmId: ${vmId})`
               );
            } else {
               console.error("❌ Invalid command data format:", typeof data);
               socket.emit("job:error", {
                  error: "Invalid command data format",
                  timestamp: new Date().toISOString(),
               });
               return;
            }

            if (!command || typeof command !== "string") {
               console.error("❌ Invalid command:", command);
               socket.emit("job:error", {
                  error: "Command is required and must be a string",
                  timestamp: new Date().toISOString(),
               });
               return;
            }

            // Execute the command with vmId
            console.log(`🚀 Executing command: ${command} (vmId: ${vmId})`);
            const result = await executionManager.executeWithStrategy(
               command,
               type,
               workingDir,
               hostAlias,
               vmId
            );

            // Join the job room for real-time updates
            socket.join(result.jobId);
            console.log(
               `🔗 Client ${clientInfo.id} joined job room: ${result.jobId}`
            );

            socket.emit("job:started", {
               jobId: result.jobId,
               type,
               command,
               vmId,
               timestamp: new Date().toISOString(),
            });

            console.log(`✅ Job started successfully: ${result.jobId}`);
         } catch (error) {
            console.error("🚨 Command execution error:", {
               client: clientInfo.id,
               error: error.message,
               stack: error.stack,
               data,
            });

            socket.emit("job:error", {
               error: error.message,
               timestamp: new Date().toISOString(),
            });
         }
      });

      /**
       * Enhanced job room joining
       */
      socket.on("join-job", (jobId) => {
         if (!jobId || typeof jobId !== "string") {
            console.error(
               `❌ Invalid job ID from client ${clientInfo.id}:`,
               jobId
            );
            socket.emit("job:error", {
               error: "Valid job ID is required",
               timestamp: new Date().toISOString(),
            });
            return;
         }

         console.log(`🔗 Client ${clientInfo.id} joining job room: ${jobId}`);
         socket.join(jobId);
         socket.emit("job:joined", {
            jobId,
            timestamp: new Date().toISOString(),
         });
      });

      /**
       * Handle leaving job rooms
       * Stops receiving updates for specific jobs
       */
      socket.on("leave-job", (jobId) => {
         if (!jobId || typeof jobId !== "string") {
            socket.emit("job:error", { error: "Valid job ID is required" });
            return;
         }

         console.log(`Client ${socket.id} leaving job room: ${jobId}`);
         socket.leave(jobId);
         socket.emit("job:left", {
            jobId,
            timestamp: new Date().toISOString(),
         });
      });

      /**
       * Handle job cancellation requests
       * Attempts to cancel a running job
       */
      socket.on("cancel-job", async (data) => {
         try {
            const { jobId } = data || {};

            if (!jobId || typeof jobId !== "string") {
               socket.emit("job:error", { error: "Valid job ID is required" });
               return;
            }

            await executionManager.cancelJob(jobId);

            // Notify all clients in the job room
            jobsNamespace.to(jobId).emit("job:canceled", {
               jobId,
               timestamp: new Date().toISOString(),
            });
         } catch (error) {
            console.error("Job cancellation error:", error);
            socket.emit("job:error", {
               error: error.message,
               timestamp: new Date().toISOString(),
            });
         }
      });

      /**
       * Handle requests for active jobs list
       * Returns currently running jobs
       */
      socket.on("get-active-jobs", () => {
         try {
            const activeJobs = executionManager.getActiveJobs();
            socket.emit("active-jobs", {
               jobs: activeJobs,
               timestamp: new Date().toISOString(),
            });
         } catch (error) {
            console.error("Error getting active jobs:", error);
            socket.emit("job:error", {
               error: "Failed to get active jobs",
               timestamp: new Date().toISOString(),
            });
         }
      });

      /**
       * Enhanced disconnect handling
       */
      socket.on("disconnect", (reason) => {
         console.log(`❌ Client disconnected from /jobs namespace:
         ID: ${clientInfo.id}
         Reason: ${reason}
         Duration: ${new Date() - new Date(clientInfo.timestamp)}ms`);
      });

      /**
       * Error handling
       */
      socket.on("error", (error) => {
         console.error(`🚨 Socket error for client ${clientInfo.id}:`, error);
      });
   });

   return jobsNamespace;
}

/**
 * Enhanced execution manager stream handlers
 * @param {ExecutionManager} executionManager - Execution manager to enhance
 * @param {Namespace} jobsNamespace - Jobs namespace instance
 */
export function enhanceExecutionManagerForNamespace(
   executionManager,
   jobsNamespace
) {
   console.log("🔧 Enhancing ExecutionManager with namespace support");

   /**
    * Add updateJobStatus method
    */
   executionManager.updateJobStatus = async function (
      jobId,
      status,
      exitCode = null
   ) {
      try {
         await this.db.query(
            "UPDATE jobs SET status = $1, finished_at = NOW(), exit_code = $2 WHERE id = $3",
            [status, exitCode, jobId]
         );
      } catch (error) {
         console.error(`Failed to update job status for ${jobId}:`, error);
      }
   };

   /**
    * Enhanced stream handlers with better error handling and logging
    */
   executionManager.setupStreamHandlers = function (jobId, process) {
      console.log(`📡 Setting up stream handlers for job: ${jobId}`);

      /**
       * Handle stdout data
       */
      process.stdout.on("data", async (data) => {
         try {
            const chunk = data.toString();
            const chunkSize = chunk.length;

            // Log chunk info (truncated for readability)
            const preview =
               chunk.length > 100 ? chunk.substring(0, 100) + "..." : chunk;
            console.log(
               `📤 stdout [${jobId}] (${chunkSize} bytes): ${preview.replace(
                  /\n/g,
                  "\\n"
               )}`
            );

            await this.logJobEvent(jobId, "stdout", chunk);

            // Broadcast to job room in namespace
            jobsNamespace.to(jobId).emit("job:log", {
               jobId,
               stream: "stdout",
               chunk,
               timestamp: new Date().toISOString(),
            });

            // Legacy compatibility
            this.io.emit("job-log", { jobId, stream: "stdout", data: chunk });
         } catch (error) {
            console.error(`🚨 Error handling stdout for job ${jobId}:`, error);
         }
      });

      /**
       * Handle stderr data
       */
      process.stderr.on("data", async (data) => {
         try {
            const chunk = data.toString();
            const chunkSize = chunk.length;

            // Log chunk info (truncated for readability)
            const preview =
               chunk.length > 100 ? chunk.substring(0, 100) + "..." : chunk;
            console.log(
               `📤 stderr [${jobId}] (${chunkSize} bytes): ${preview.replace(
                  /\n/g,
                  "\\n"
               )}`
            );

            await this.logJobEvent(jobId, "stderr", chunk);

            // Broadcast to job room in namespace
            jobsNamespace.to(jobId).emit("job:log", {
               jobId,
               stream: "stderr",
               chunk,
               timestamp: new Date().toISOString(),
            });

            // Legacy compatibility
            this.io.emit("job-log", { jobId, stream: "stderr", data: chunk });
         } catch (error) {
            console.error(`🚨 Error handling stderr for job ${jobId}:`, error);
         }
      });

      /**
       * Handle process exit
       */
      process.on("close", async (code, signal) => {
         try {
            console.log(
               `🏁 Process finished for job ${jobId}: code=${code}, signal=${signal}`
            );

            const status = code === 0 ? "success" : "failed";

            // Update job status
            await this.updateJobStatus(jobId, status, code);

            // Broadcast completion
            jobsNamespace.to(jobId).emit("job:done", {
               jobId,
               status,
               exitCode: code,
               signal,
               timestamp: new Date().toISOString(),
            });

            // Legacy compatibility
            this.io.emit("job-finished", { jobId, status, exitCode: code });

            // Cleanup
            this.activeJobs.delete(jobId);
            console.log(`🧹 Cleaned up job: ${jobId}`);
         } catch (error) {
            console.error(
               `🚨 Error handling process close for job ${jobId}:`,
               error
            );
         }
      });

      /**
       * Handle process errors
       */
      process.on("error", async (error) => {
         try {
            console.error(`🚨 Process error for job ${jobId}:`, error);

            await this.updateJobStatus(jobId, "failed", -1);

            jobsNamespace.to(jobId).emit("job:error", {
               jobId,
               error: error.message,
               timestamp: new Date().toISOString(),
            });

            // Cleanup
            this.activeJobs.delete(jobId);
         } catch (logError) {
            console.error(
               `🚨 Error handling process error for job ${jobId}:`,
               logError
            );
         }
      });
   };
}
