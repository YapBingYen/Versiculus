import { Pool } from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/versiculus';

if (isProd && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in production');
}

export const pool = new Pool({
  connectionString,
  ssl: isProd || connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});
