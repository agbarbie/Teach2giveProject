import { Pool } from "pg";
import dotenv from "dotenv"

dotenv.config()

const pool = new Pool ({
    host: process.env.DB_HOST || 'skillmatchesai1.clys68qy6l9q.eu-north-1.rds.amazonaws.com',
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
pool.connect((err, client, release) => {
    if (err) {
      return console.error('Error acquiring client', err.stack);
    }
    console.log('Connected to PostgreSQL database');
    release();
  });

export default pool

