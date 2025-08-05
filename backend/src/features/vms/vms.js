import express from "express";
import { serverlessAPI } from "../../clients/serverless-api-client.js";
import { SSHManager } from "./ssh-manager.js";
import { syncSshHostsToVms } from "./vm-auto-register.js";
import { checkVM } from "./vmAuth.js";
import { createJobsRouter } from "../jobs/jobs.js";
import { isUserAuthenticated } from "../auth/authUtils.js";

export function createVmsRouter(db, executionManager) {
  const router = express.Router();

  // auth middleware
  router.use(isUserAuthenticated);

  // ── /api/vms/:vmId/jobs ── nested jobs collection ----------------------------------------
  router.use("/:vmId/jobs", createJobsRouter(db, executionManager));

  // ── /api/vms/ ------------------------------------
  router.get("/initialize", async (req, res) => {
    try {
      const vms = await syncSshHostsToVms();

      res.json(vms);
    } catch (error) {
      console.error("Error getting SSH hosts:", error);
      res.status(500).json({
        error: "Failed to retrieve SSH hosts",
        details: error.message,
      });
    }
  });

  router.get("/", async (_, res) => {
    try {
      const vms = await serverlessAPI.getVMs();
      const authorizedVms = vms.filter(checkVM);
      res.json(authorizedVms);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const vm = await serverlessAPI.getVM(req.params.id);
      if (checkVM(vm)) {
        res.json(vm);
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    } catch (e) {
      res
        .status(e.message.includes("not found") ? 404 : 500)
        .json({ error: e.message });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const vm = await serverlessAPI.createVM(req.body);
      res.status(201).json(vm);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put("/:id", async (req, res) => {
    try {
      const vm = await serverlessAPI.updateVM(req.params.id, req.body);
      res.json(vm);
    } catch (e) {
      res
        .status(e.message.includes("not found") ? 404 : 500)
        .json({ error: e.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      await serverlessAPI.deleteVM(req.params.id);
      res.status(204).send();
    } catch (e) {
      res
        .status(e.message.includes("not found") ? 404 : 500)
        .json({ error: e.message });
    }
  });

  router.get("/:vmId/commands", async (req, res) => {
    try {
      const cmds = await serverlessAPI.getVMCommands(req.params.vmId);
      res.json(cmds);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/:vmId/commands", async (req, res) => {
    try {
      const cmd = await serverlessAPI.createCommand(req.params.vmId, req.body);
      res.status(201).json(cmd);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /**
   * GET /api/vms/:alias
   * Get specific VM configuration
   *
   */
  router.get("/:alias", async (req, res) => {
    try {
      const { alias } = req.params;
      const config = SSHManager.getConnectionConfig(alias);

      res.json({
        alias,
        config,
        suggestedVMName: SSHManager.generateVMName(alias, config),
      });
    } catch (error) {
      console.error(`Error getting SSH host ${req.params.alias}:`, error);
      res.status(404).json({
        error: `SSH host '${req.params.alias}' not found`,
        details: error.message,
      });
    }
  });

  /**
   * POST /api/vms/:alias/test
   * Test SSH connection to a specific VM
   */
  router.post("/:alias/test", async (req, res) => {
    try {
      const { alias } = req.params;
      const { timeout = 10 } = req.body;

      const result = await SSHManager.testConnection(alias, timeout);

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

  /**
   * GET /api/vms/:alias/validate
   * Validate VM configuration
   */
  router.get("/:alias/validate", async (req, res) => {
    try {
      const { alias } = req.params;
      const validation = SSHManager.validateHostConfig(alias);

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

  /**
   * Helper function to determine cloud provider from hostname
   * @param {string} hostname - The hostname to analyze
   * @returns {string|null} Cloud provider name or null
   */
  function getCloudProvider(hostname) {
    if (!hostname) return null;

    const host = hostname.toLowerCase();

    if (host.includes("amazonaws.com")) return "AWS";
    if (host.includes("googleusercontent.com") || host.includes("gcp"))
      return "Google Cloud";
    if (host.includes("azure")) return "Azure";
    if (host.includes("digitalocean")) return "DigitalOcean";
    if (host.includes("linode")) return "Linode";
    if (host.includes("vultr")) return "Vultr";

    return null;
  }

  return router;
}
