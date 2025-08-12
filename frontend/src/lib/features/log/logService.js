/**
 * LogService - Pure REST API service for log persistence
 */
export class LogService {
   constructor(apiClient) {
      this.apiClient = apiClient;
   }

   async getLogs(limit = 1000) {
      try {
         const logs = await this.apiClient.get(`/api/logs?limit=${limit}`);
         return logs || [];
      } catch (error) {
         console.error("Failed to fetch logs:", error);
         return [];
      }
   }

   async getJobLogs(jobId, limit = 1000) {
      if (!jobId) return [];
      
      try {
         // Use both endpoints as fallback
         let logs = [];
         
         // Try jobs endpoint first (as per jobsRouter.js:71-79)
         try {
            logs = await this.apiClient.get(`/api/jobs/${jobId}/logs`);
         } catch (jobError) {
            console.warn(`Jobs endpoint failed for ${jobId}, trying logs endpoint:`, jobError);
            // Fallback to logs endpoint (as per logsRouter.js:19-31) 
            logs = await this.apiClient.get(`/api/logs/${jobId}${limit ? `?limit=${limit}` : ''}`);
         }

         return (logs || []).map(l => ({
            id: l.id || `${jobId}-${l.ts}`,
            stream: l.stream,
            data: l.data || l.chunk,
            timestamp: l.timestamp || l.ts,
            jobId: jobId
         }));
      } catch (error) {
         console.error(`Failed to fetch logs for job ${jobId}:`, error);
         return [];
      }
   }

   async saveJobLogs(jobId, logEntries) {
      console.log("💾 Saving logs via REST API:", jobId, logEntries.length);
      return await this.apiClient.post(`/api/jobs/${jobId}/logs`, { logs: logEntries });
   }
}
