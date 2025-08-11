import { dbSingleton } from "../../database/PgsqlDatabase.js";

export class LogsRepository {
  constructor() {
    this.db = dbSingleton;
  }

  async getLogsForJob(jobId, limit = 1000) {
    // 1. Check cache
    const cappedLimit = Math.min(parseInt(limit, 10) || 1000, 10000);
    const cachedLogs = await this.db.query(
      "SELECT * FROM job_logs WHERE job_id = $1 ORDER BY ts ASC LIMIT $2",
      [jobId, cappedLimit]
    );

    if (cachedLogs.rows.length > 0) {
      return cachedLogs.rows;
    }

    return cachedLogs.rows;
  }

  async createLogsBatch(jobId, logsArray) {
    return await this.cacheLogs(jobId, logsArray);
  }

  async cacheLogs(jobId, logsArray) {
    if (!Array.isArray(logsArray) || logsArray.length === 0) {
      return;
    }

    const values = [];
    const placeholders = logsArray
      .map((log, i) => {
        const n = i * 4;
        values.push(jobId, log.ts, log.stream, log.data);
        return `($${n + 1}, $${n + 2}, $${n + 3}, $${n + 4})`;
      })
      .join(",");

    const query = `
      INSERT INTO job_logs (job_id, ts, stream, data)
      VALUES ${placeholders}
      ON CONFLICT (job_id, ts) DO NOTHING;
    `;

    await this.db.query(query, values);
  }
}
