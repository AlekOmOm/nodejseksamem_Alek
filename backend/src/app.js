// app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { SERVER_CONFIG, DATABASE_CONFIG } from "./config/index.js";
import { Pool } from "pg";
import { Router } from "express";
import { commandsRouter } from "./features/commands/commands.js";
import { createJobsRouter } from "./features/jobs/jobs.js";
import { createLogsRouter } from "./features/logs/logs.js";
import { ExecutionManager } from "./features/commands/execution-manager.js";
import { createVmsRouter } from "./features/vms/vms.js";
import { createAuthRouter } from "./features/auth/auth.js";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(express.json({ limit: SERVER_CONFIG.jsonLimit }));
app.use(
  express.urlencoded({
    extended: true,
    limit: SERVER_CONFIG.urlEncodedLimit,
  })
);
app.use(express.static(path.join(__dirname, SERVER_CONFIG.staticPath)));
app.use(cors(SERVER_CONFIG.cors));

// db and execution manager
const db = new Pool(DATABASE_CONFIG);
const executionManager = new ExecutionManager(null, db);

// API routers
const apiRouter = Router();
apiRouter.use("/auth", createAuthRouter(db));
apiRouter.use("/logs", createLogsRouter(db));
apiRouter.use("/commands", commandsRouter);
apiRouter.use("/vms", createVmsRouter(db, executionManager));
apiRouter.use("/jobs", createJobsRouter(db, executionManager));
app.use("/api", apiRouter);

export { app, db, executionManager };
