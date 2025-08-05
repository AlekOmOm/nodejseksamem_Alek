/**
 * LogService - Pure REST API service for log persistence
 */
export class LogService {
   constructor(apiClient) {
      this.apiClient = apiClient;
   }

   async saveJobLogs(jobId, logEntries) {
      console.log("💾 Saving logs via REST API:", jobId, logEntries.length);
      return await this.apiClient.post(`/api/jobs/${jobId}/logs`, { logs: logEntries });
   }

   async getJobLogs(jobId) {
      if (!jobId) return [];
      
      try {
         const logs = await this.apiClient.get(`/api/jobs/${jobId}/logs`);
         return (logs || []).map(l => ({
            stream: l.stream,
            data: l.chunk,
            timestamp: l.timestamp,
            jobId: jobId
         }));
      } catch (error) {
         console.error(`Failed to fetch logs for job ${jobId}:`, error);
         return [];
      }
   }
}
