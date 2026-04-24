import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Connect to the PostgreSQL database using the DATABASE_URL environment variable.
// Default fallback provided for local development.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/versiculus',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});
