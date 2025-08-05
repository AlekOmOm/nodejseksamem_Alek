/**
 * JobWebSocketService - Pure WebSocket service for real-time communication
 * NO REST API concerns, NO persistence
 */
export class JobWebSocketService {
  constructor(webSocketClient) {
    this.wsClient = webSocketClient;
    this.eventHandlers = {
      jobStarted: [],
      jobLog: [],
      jobCompleted: [],
      jobError: [],
    };

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.wsClient.on("job:started", (data) => {
      console.log("🚀 WebSocket job:started:", data);
      const job = {
        id: data.jobId,
        command: data.command,
        vmId: data.vmId,
        status: "running",
        startedAt: data.timestamp,
      };
      this.eventHandlers.jobStarted.forEach((handler) => handler(job));
    });

    this.wsClient.on("job:log", (data) => {
      const logEntry = {
        jobId: data.jobId,
        stream: data.stream,
        data: data.chunk,
        timestamp: data.timestamp,
      };
      this.eventHandlers.jobLog.forEach((handler) => handler(logEntry));
    });

    this.wsClient.on("job:done", (data) => {
      console.log("✅ WebSocket job:done:", data);
      const job = {
        status: data.status === "success" ? "completed" : "failed",
        exitCode: data.exitCode,
        finishedAt: data.timestamp,
      };
      this.eventHandlers.jobCompleted.forEach((handler) => handler(job));
    });

    this.wsClient.on("job:error", (data) => {
      console.error("❌ WebSocket job:error:", data);
      const error = {
        message: data.error,
        timestamp: data.timestamp,
      };
      this.eventHandlers.jobError.forEach((handler) => handler(error));
    });
  }

  // Event subscription methods
  onJobStarted(handler) {
    this.eventHandlers.jobStarted.push(handler);
  }
  onJobLog(handler) {
    this.eventHandlers.jobLog.push(handler);
  }
  onJobCompleted(handler) {
    this.eventHandlers.jobCompleted.push(handler);
  }
  onJobError(handler) {
    this.eventHandlers.jobError.push(handler);
  }

  // Event unsubscription methods
  offJobStarted(handler) {
    if (handler) {
      const index = this.eventHandlers.jobStarted.indexOf(handler);
      if (index > -1) this.eventHandlers.jobStarted.splice(index, 1);
    } else {
      this.eventHandlers.jobStarted = [];
    }
  }
  offJobLog(handler) {
    if (handler) {
      const index = this.eventHandlers.jobLog.indexOf(handler);
      if (index > -1) this.eventHandlers.jobLog.splice(index, 1);
    } else {
      this.eventHandlers.jobLog = [];
    }
  }
  offJobCompleted(handler) {
    if (handler) {
      const index = this.eventHandlers.jobCompleted.indexOf(handler);
      if (index > -1) this.eventHandlers.jobCompleted.splice(index, 1);
    } else {
      this.eventHandlers.jobCompleted = [];
    }
  }
  offJobError(handler) {
    if (handler) {
      const index = this.eventHandlers.jobError.indexOf(handler);
      if (index > -1) this.eventHandlers.jobError.splice(index, 1);
    } else {
      this.eventHandlers.jobError = [];
    }
  }

  // WebSocket operations only
  executeCommand(commandData) {
    if (!this.wsClient.getIsConnected()) {
      throw new Error("WebSocket not connected");
    }
    console.log("📤 WebSocket execute-command:", commandData);
    this.wsClient.emit("execute-command", commandData);
  }

  joinJob(jobId) {
    this.wsClient.emit("join-job", jobId);
  }
}
