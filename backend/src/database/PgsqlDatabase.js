import { DATABASE_CONFIG } from "../config/index.js";
import { Pool } from "pg";

const dbSingleton = new Pool(DATABASE_CONFIG);
export { dbSingleton };
