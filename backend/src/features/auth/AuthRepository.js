import { dbSingleton } from "../../database/PgsqlDatabase.js";

export default class AuthRepository {
  constructor() {
    this.db = dbSingleton;
  }

  async findByEmail(email) {
    const query = {
      text: "SELECT id, email, role, password_hash FROM users WHERE email = $1",
      values: [email],
    };
    const result = await this.db.query(query);
    return result.rows[0];
  }

  async findById(id) {
    const query = {
      text: "SELECT id, email, role, created_at FROM users WHERE id = $1",
      values: [id],
    };
    const result = await this.db.query(query);
    return result.rows[0];
  }

  async create(email, hashedPassword, role = "dev") {
    const query = {
      text: "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at",
      values: [email, hashedPassword, role],
    };
    const result = await this.db.query(query);
    return result.rows[0];
  }

  async deleteUser(userId) {
    const query = {
      text: "DELETE FROM users WHERE id = $1 RETURNING id, email",
      values: [userId],
    };
    const result = await this.db.query(query);
    return result.rows[0];
  }

  async deleteUserWithAllData(userId) {
    const client = await this.db.getPool().connect();
    try {
      await client.query('BEGIN');
      
      // Delete job logs first (foreign key constraint)
      await client.query('DELETE FROM job_logs WHERE job_id IN (SELECT id FROM jobs WHERE user_id = $1)', [userId]);
      
      // Delete jobs
      await client.query('DELETE FROM jobs WHERE user_id = $1', [userId]);
      
      // Delete user
      const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id, email', [userId]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
