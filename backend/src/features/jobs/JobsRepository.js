import { LogsRepository } from "../logs/LogRepository.js";
import { dbSingleton } from "../../database/PgsqlDatabase.js";

export class JobsRepository {
  constructor() {
    this.db = dbSingleton;
  }

  /**
   * Transform database row to camelCase format
   */
  _transformJob(row) {
    if (!row) return null;
    
    return {
      id: row.id,
      vmId: row.vm_id,
      command: row.command,
      type: row.type,
      status: row.status,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      exitCode: row.exit_code,
      cachedAt: row.cached_at,
    };
  }

  async getJobs(limit = 10) {
    // 1. Fetch from Postgres cache first
    const cappedLimit = Math.min(parseInt(limit, 10) || 10, 100);
    const cachedJobs = await this.db.query(
      "SELECT * FROM jobs ORDER BY started_at DESC LIMIT $1",
      [cappedLimit]
    );
    
    return cachedJobs.rows.map(row => this._transformJob(row));
  }

  async getJob(jobId) {
    // 1. Check cache
    const cachedJob = await this.db.query("SELECT * FROM jobs WHERE id = $1", [
      jobId,
    ]);
    if (cachedJob.rows.length > 0) {
      return this._transformJob(cachedJob.rows[0]);
    }
    return null;
  }

  async createJob(jobData) {
    const {
      id,
      vm_id,
      command,
      status = "running",
      started_at = new Date(),
    } = jobData;
    const result = await this.db.query(
      `INSERT INTO jobs (id, vm_id, command, status, started_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, vm_id, command, status, started_at]
    );
    return this._transformJob(result.rows[0]);
  }

  async updateJob(jobId, updates) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx += 1;
    }
    values.push(jobId);
    const query = `UPDATE jobs SET ${fields.join(
      ", "
    )}, cached_at = NOW() WHERE id = $${idx} RETURNING *`;
    const result = await this.db.query(query, values);
    return this._transformJob(result.rows[0]);
  }

  async getJobLogs(jobId, limit = 1000) {
    // Logs are handled by LogModel, but this shows the pattern
    const logModel = new LogsRepository(this.db);
    return logModel.getLogsForJob(jobId, limit);
  }

  async getJobsForVM(vmId, limit = 50) {
    const cappedLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const result = await this.db.query(
      "SELECT * FROM jobs WHERE vm_id = $1 ORDER BY started_at DESC LIMIT $2",
      [vmId, cappedLimit]
    );
    return result.rows.map(row => this._transformJob(row));
  }

  async deleteJob(jobId) {
    const result = await this.db.query(
      "DELETE FROM jobs WHERE id = $1 RETURNING *",
      [jobId]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Job with ID '${jobId}' not found`);
    }
    
    return this._transformJob(result.rows[0]);
  }

  async cacheJobs(jobs) {
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return;
    }

    const values = [];
    const placeholders = jobs
      .map((job, i) => {
        const n = i * 7;
        values.push(
          job.id,
          job.vm_id,
          job.command,
          job.status,
          job.started_at,
          job.finished_at,
          new Date() // cached_at
        );
        return `($${n + 1}, $${n + 2}, $${n + 3}, $${n + 4}, $${n + 5}, $${
          n + 6
        }, $${n + 7})`;
      })
      .join(",");

    const query = `
      INSERT INTO jobs (id, vm_id, command, status, started_at, finished_at, cached_at)
      VALUES ${placeholders}
      ON CONFLICT (id) DO UPDATE SET
        vm_id = EXCLUDED.vm_id,
        command = EXCLUDED.command,
        status = EXCLUDED.status,
        finished_at = EXCLUDED.finished_at,
        cached_at = EXCLUDED.cached_at;
    `;

    await this.db.query(query, values);
  }
}
