/**
 * JobService - Pure REST API service for job persistence
 * NO WebSocket concerns, NO real-time state
 */
export class JobService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  // CRUD operations only
  async createJob(jobData) {
    console.log("📝 Creating job via REST API:", jobData);
    return await this.apiClient.post("/api/jobs", jobData);
  }

  async getJob(jobId) {
    return await this.apiClient.get(`/api/jobs/${jobId}`);
  }

  async updateJob(jobId, updates) {
    console.log("🔄 Updating job via REST API:", jobId, updates);
    return await this.apiClient.put(`/api/jobs/${jobId}`, updates);
  }

  async getJobs(limit = 50) {
    return await this.apiClient.get(`/api/jobs?limit=${limit}`);
  }

  async getJobsForVM(vmId, limit = 50) {
    console.log("[JobService] getJobsForVM:", vmId, limit);
    return await this.apiClient.get(`/api/vms/${vmId}/jobs?limit=${limit}`);
  }

  async deleteJob(jobId) {
    return await this.apiClient.delete(`/api/jobs/${jobId}`);
  }

  // Job logs via REST API (for historical data)
  async getJobLogs(jobId) {
    return await this.apiClient.get(`/api/jobs/${jobId}/logs`);
  }
}
