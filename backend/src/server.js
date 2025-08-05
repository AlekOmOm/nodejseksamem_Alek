// server.js
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { app, db, executionManager } from "./app.js";
import { WEBSOCKET_CONFIG, SERVER_CONFIG } from "./config/index.js";
import {
   setupJobsNamespace,
   enhanceExecutionManagerForNamespace,
} from "./features/jobs/jobs-namespace.js";

const server = http.createServer(app);
const io = new Server(server, {
   cors: WEBSOCKET_CONFIG.cors,
   pingTimeout: WEBSOCKET_CONFIG.pingTimeout,
   pingInterval: WEBSOCKET_CONFIG.pingInterval,
});

executionManager.attachIO(io);
const jobsNS = setupJobsNamespace(io, executionManager);
enhanceExecutionManagerForNamespace(executionManager, jobsNS);

db.on("error", (err) => console.error("Database error:", err));

process.on("SIGTERM", async () => {
   await db.end();
   server.close(() => process.exit(0));
});

server.listen(SERVER_CONFIG.port, () =>
   console.log(`Server listening on ${SERVER_CONFIG.port}`)
);
