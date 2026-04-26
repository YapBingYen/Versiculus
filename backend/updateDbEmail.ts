import { pool } from './src/db';

async function updateDbEmail() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT false;
    `);
    console.log('Successfully added email_notifications column to users table');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    process.exit(0);
  }
}

updateDbEmail();
