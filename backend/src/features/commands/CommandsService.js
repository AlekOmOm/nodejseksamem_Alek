import { CommandsRepository } from "./CommandsRepository.js";

class CommandsService {
  constructor(commandsRepository) {
    this.repo = commandsRepository;
  }

  async getCommand(id) {
    return await this.repo.getCommand(id);
  }

  async updateCommand(id, command) {
    return await this.repo.updateCommand(id, command);
  }

  async deleteCommand(id) {
    return await this.repo.deleteCommand(id);
  }
}

export const commandsService = new CommandsService(new CommandsRepository());
