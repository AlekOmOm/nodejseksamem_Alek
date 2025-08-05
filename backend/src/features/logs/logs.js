import express from 'express';
import { LogModel } from './LogModel.js';

export function createLogsRouter(db) {
  const router = express.Router();
  const logModel = new LogModel(db);

  // GET /api/logs - Get all logs with optional limit
  router.get('/', async (req, res) => {
    try {
      const logs = await logModel.getLogs(req.query.limit);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  // GET /api/logs/:jobId - Get logs for a specific job
  router.get('/:jobId', async (req, res) => {
    try {
      const logs = await logModel.getLogsForJob(req.params.jobId, req.query.limit);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching job logs:', error);
      res.status(500).json({ error: 'Failed to fetch job logs' });
    }
  });

  // POST /api/logs - Create a new log entry
  router.post('/', async (req, res) => {
    try {
      const log = await logModel.createLog(req.body);
      res.status(201).json(log);
    } catch (error) {
      console.error('Error creating log:', error);
      res.status(500).json({ error: 'Failed to create log' });
    }
  });

  // POST /api/logs/batch - Create multiple log entries at once
  router.post('/batch', async (req, res) => {
    try {
      const logs = await logModel.createLogsBatch(req.body.logs);
      res.status(201).json(logs);
    } catch (error) {
      console.error('Error creating logs batch:', error);
      res.status(500).json({ error: 'Failed to create logs batch' });
    }
  });

  return router;
} 