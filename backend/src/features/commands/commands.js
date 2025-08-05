import express from "express";
import { serverlessAPI } from "../../clients/serverless-api-client.js";
import { COMMANDS } from "../../config/index.js";

export const commandsRouter = express.Router();

// List available command templates (static)
commandsRouter.get("/", (_, res) => {
   res.json(COMMANDS);
});

// CRUD for individual commands via serverless
commandsRouter.get("/:id", async (req, res) => {
   try {
      const command = await serverlessAPI.getCommand(req.params.id);
      res.json(command);
   } catch (error) {
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: error.message });
   }
});

commandsRouter.put("/:id", async (req, res) => {
   try {
      const command = await serverlessAPI.updateCommand(
         req.params.id,
         req.body
      );
      res.json(command);
   } catch (error) {
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: error.message });
   }
});

commandsRouter.delete("/:id", async (req, res) => {
   try {
      await serverlessAPI.deleteCommand(req.params.id);
      res.status(204).send();
   } catch (error) {
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: error.message });
   }
});
