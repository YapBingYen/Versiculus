import { pool } from './src/db';

async function updateDb() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS push_subscription JSONB;
    `);
    console.log('Successfully added push_subscription column to users table');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    process.exit(0);
  }
}

updateDb();
