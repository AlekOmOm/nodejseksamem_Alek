export default class UserModel {
   constructor(db) {
      this.db = db;
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
}
