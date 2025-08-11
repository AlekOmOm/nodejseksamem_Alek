import { LogsRepository } from "./LogRepository.js";
import { dbSingleton } from "../../database/PgsqlDatabase.js";

class LogsService {
  constructor(logsRepository) {
    this.repo = logsRepository;
    this.db = dbSingleton;
  }

  //getLogsForJob
  async getLogsForJob(jobId, limit = 1000) {
    return await this.repo.getLogsForJob(jobId, limit);
  }

  async getJobLogs(jobId, limit = 1000) {
    // Logs are handled by LogModel, but this shows the pattern
    const logModel = new LogsRepository(this.db);
    return logModel.getLogsForJob(jobId, limit);
  }
}

export const logsService = new LogsService(new LogsRepository());
