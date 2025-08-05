import express from 'express';
import { JobModel } from './JobModel.js';

export function createJobsRouter(db, executionManager) {
  const router = express.Router({ mergeParams: true });
  const jobModel = new JobModel(db, executionManager);

  router.get('/', async (req, res) => {
    try {
      const { vmId } = req.params;
      const limit = req.query.limit;

      const jobs = vmId
        ? await jobModel.getJobsForVM(vmId, limit) // nested
        : await jobModel.getJobs(limit);           // global

      res.json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch job history' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      req.body.vm_id ??= req.params.vmId;    // only set if nested
      const job = await jobModel.createJob(req.body);
      res.status(201).json(job);
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({ error: 'Failed to create job' });
    }
  });

  router.get('/:jobId', async (req, res) => {
    try {
      const job = await jobModel.getJob(req.params.jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  });

  router.put('/:jobId', async (req, res) => {
    try {
      const job = await jobModel.updateJob(req.params.jobId, req.body);
      res.json(job);
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ error: 'Failed to update job' });
    }
  });

  router.get('/:jobId/logs', async (req, res) => {
    try {
      const lines = await jobModel.getJobLogs(req.params.jobId, req.query.limit);
      res.json(lines);
    } catch (error) {
      console.error('Error fetching job logs:', error);
      res.status(500).json({ error: 'Failed to fetch job logs' });
    }
  });

  return router;
}
