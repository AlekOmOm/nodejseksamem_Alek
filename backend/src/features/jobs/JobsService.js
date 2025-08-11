import { JobsRepository } from "./JobsRepository.js";

class JobsService {
  constructor(jobsRepository) {
    this.repo = jobsRepository;
  }

  async getJobs(limit = 10) {
    return await this.repo.getJobs(limit);
  }

  async getJob(jobId) {
    return await this.repo.getJob(jobId);
  }

  async createJob(jobData) {
    return await this.repo.createJob(jobData);
  }

  async updateJob(jobId, updates) {
    return await this.repo.updateJob(jobId, updates);
  }

  async getJobLogs(jobId, limit) {
    return await this.repo.getJobLogs(jobId, limit);
  }

  async getJobsForVM(vmId, limit) {
    return await this.repo.getJobsForVM(vmId, limit);
  }
}

export const jobsService = new JobsService(new JobsRepository());
