import express from "express";
import { vmsService } from "./VMsService.js";
import { checkVM } from "./vmUtils.js";
import { createJobsRouter } from "../jobs/jobsRouter.js";
import isAuthenticated from "../../shared/middleware/authorization.js";

/**
 * Create VMs router
 * - /api/vms
 *
 * @returns {express.Router} Router instance
 */
export function createVmsRouter() {
  const router = express.Router();
  const service = vmsService;

  // auth middleware
  router.use(isAuthenticated);

  router.use((req, res, next) => {
    console.log("--------------------------------");
    console.log("request:", req.method, req.url, req.body);
    console.log("--------------------------------");
    next();
  });

  // ── /api/vms/:vmId/jobs ── nested jobs collection ──────────────────────
  router.use("/:vmId/jobs", createJobsRouter());

  // ── SSH Host Management ─────────────────────────────────────────────────

  router.get("/initialize", async (req, res) => {
    try {
      console.log("initializing VMs from SSH hosts");
      console.log("--------------------------------");
      const vms = await service.initialize();
      res.json(vms);
    } catch (error) {
      console.error("Error initializing VMs from SSH hosts:", error);
      res.status(500).json({
        error: "Failed to initialize VMs from SSH hosts",
        details: error.message,
      });
    }
  });

  router.get("/ssh-hosts", async (req, res) => {
    try {
      const hosts = service.getAllSSHHosts();
      res.json(hosts);
    } catch (error) {
      console.error("Error getting SSH hosts:", error);
      res.status(500).json({
        error: "Failed to retrieve SSH hosts",
        details: error.message,
      });
    }
  });

  router.get("/ssh-hosts/:alias", async (req, res) => {
    try {
      const { alias } = req.params;
      const config = service.getSSHConnectionConfig(alias);
      const suggestedVMName = service.generateVMName(alias, config);

      res.json({
        alias,
        config,
        suggestedVMName,
      });
    } catch (error) {
      console.error(`Error getting SSH host ${req.params.alias}:`, error);
      res.status(404).json({
        error: `SSH host '${req.params.alias}' not found`,
        details: error.message,
      });
    }
  });

  router.post("/ssh-hosts/:alias/test", async (req, res) => {
    try {
      const { alias } = req.params;
      const { timeout = 10 } = req.body;

      const result = await service.testSSHConnection(alias, timeout);

      res.json({
        alias,
        success: result.success,
        message: result.message,
        responseTime: result.responseTime,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        `Error testing SSH connection to ${req.params.alias}:`,
        error
      );
      res.status(500).json({
        error: "Failed to test SSH connection",
        details: error.message,
      });
    }
  });

  router.get("/ssh-hosts/:alias/validate", async (req, res) => {
    try {
      const { alias } = req.params;
      const validation = service.validateSSHHostConfig(alias);

      res.json({
        alias,
        valid: validation.valid,
        issues: validation.issues,
        config: validation.config,
      });
    } catch (error) {
      console.error(`Error validating SSH host ${req.params.alias}:`, error);
      res.status(404).json({
        error: `SSH host '${req.params.alias}' not found`,
        details: error.message,
      });
    }
  });

  // ── VM CRUD Operations ──────────────────────────────────────────────────

  router.get("/", async (_, res) => {
    try {
      const vms = await service.getVMs();
      const authorizedVms = vms.filter(checkVM);
      res.json(authorizedVms);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const vm = await service.getVM(req.params.id);
      if (checkVM(vm)) {
        res.json(vm);
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    } catch (e) {
      res.status(e.message.includes("not found") ? 404 : 500).json({
        error: e.message,
      });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const vm = await service.createVM(req.body);
      res.status(201).json(vm);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put("/:id", async (req, res) => {
    try {
      const vm = await service.updateVM(req.params.id, req.body);
      res.json(vm);
    } catch (e) {
      res.status(e.message.includes("not found") ? 404 : 500).json({
        error: e.message,
      });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      await service.deleteVM(req.params.id);
      res.status(204).send();
    } catch (e) {
      res.status(e.message.includes("not found") ? 404 : 500).json({
        error: e.message,
      });
    }
  });

  // ── VM Commands ─────────────────────────────────────────────────────────

  router.get("/:vmId/commands", async (req, res) => {
    try {
      const cmds = await service.getVMCommands(req.params.vmId);
      res.json(cmds);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/:vmId/commands", async (req, res) => {
    try {
      const cmd = await service.createVMCommand(req.params.vmId, req.body);
      res.status(201).json(cmd);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
