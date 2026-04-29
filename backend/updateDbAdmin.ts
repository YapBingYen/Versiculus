import { pool } from './src/db';

async function updateDbAdmin() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
    `);
    console.log('Successfully added is_admin column to users table');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    process.exit(0);
  }
}

updateDbAdmin();

