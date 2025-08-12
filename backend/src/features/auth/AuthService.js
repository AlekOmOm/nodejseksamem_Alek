import { comparePassword, hashPassword } from "../../shared/utils/hashing.js";
import { registerBusinessRules, loginBusinessRules } from "./authValidation.js";
import { parse } from "valibot";
import AuthRepository from "./AuthRepository.js";

export default class AuthService {
  constructor() {
    this.repo = new AuthRepository();
  }

  async register(userData) {
    const validatedData = parse(registerBusinessRules, userData);

    const existingUser = await this.repo.findByEmail(validatedData.email);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await hashPassword(validatedData.password);
    const newUser = await this.repo.create(
      validatedData.email,
      hashedPassword,
      validatedData.role
    );

    return newUser;
  }

  async login(email, password) {
    const validatedData = parse(loginBusinessRules, { email, password });

    const user = await this.repo.findByEmail(validatedData.email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    delete user.password_hash;
    return user;
  }

  async getCurrentUser(userId) {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async deleteUser(userId) {
    const deletedUser = await this.repo.deleteUser(userId);
    if (!deletedUser) {
      throw new Error("User not found");
    }
    return deletedUser;
  }

  async deleteAllUserData(userId) {
    // Import needed services
    const { vmsService } = await import('../vms/VMsService.js');
    const { commandsService } = await import('../commands/CommandsService.js');
    
    try {
      // Delete user's VMs and commands from DynamoDB
      await vmsService.deleteAllUserVMs(userId);
      await commandsService.deleteAllUserCommands(userId);
      
      // Delete user and all PostgreSQL data (jobs, logs)
      const deletedUser = await this.repo.deleteUserWithAllData(userId);
      if (!deletedUser) {
        throw new Error("User not found");
      }
      
      return deletedUser;
    } catch (error) {
      console.error('Error deleting all user data:', error);
      throw error;
    }
  }
}
