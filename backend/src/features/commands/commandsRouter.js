import express from "express";
import { COMMANDS } from "../../config/index.js";
import { commandsService } from "./CommandsService.js";

/**
 * Create commands router
 * - /api/commands
 *
 * @returns {express.Router} Router instance
 */
export function createCommandsRouter() {
  const router = express.Router();
  const service = commandsService;

  router.get("/", (_, res) => {
    res.json(COMMANDS);
  });

  // CRUD for individual commands via serverless
  router.get("/:id", async (req, res) => {
    try {
      const command = await service.getCommand(req.params.id);
      res.json(command);
    } catch (error) {
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  router.put("/:id", async (req, res) => {
    try {
      const command = await service.updateCommand(req.params.id, req.body);
      res.json(command);
    } catch (error) {
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      await service.deleteCommand(req.params.id);
      res.status(204).send();
    } catch (error) {
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  });
  return router;
}
