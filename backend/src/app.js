// app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { SERVER_CONFIG } from "./config/index.js";
import { Router } from "express";
import { createCommandsRouter } from "./features/commands/commandsRouter.js";
import { createJobsRouter } from "./features/jobs/jobsRouter.js";
import { createLogsRouter } from "./features/logs/logsRouter.js";
import { createVmsRouter } from "./features/vms/vmsRouter.js";
import { createAuthRouter } from "./features/auth/authRouter.js";
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

// API routers
const apiRouter = Router();
apiRouter.use("/auth", createAuthRouter());
apiRouter.use("/logs", createLogsRouter());
apiRouter.use("/commands", createCommandsRouter());
apiRouter.use("/vms", createVmsRouter());
apiRouter.use("/jobs", createJobsRouter());
app.use("/api", apiRouter);

export { app };
