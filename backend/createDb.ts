import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Connect to the default 'postgres' database to create our new one
const client = new Client({
  connectionString: 'postgresql://postgres:uLEu374tyNBTYUJ%23@localhost:5432/postgres',
});

async function createDatabase() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL default database.');
    
    // Check if the versiculus database already exists
    const checkRes = await client.query("SELECT datname FROM pg_database WHERE datname = 'versiculus'");
    
    if (checkRes.rows.length === 0) {
      console.log('Creating versiculus database...');
      // PostgreSQL doesn't allow CREATE DATABASE inside a transaction block, so we run it directly
      await client.query('CREATE DATABASE versiculus');
      console.log('✅ Database "versiculus" created successfully!');
    } else {
      console.log('ℹ️ Database "versiculus" already exists. Skipping creation.');
    }
  } catch (err) {
    console.error('❌ Error creating database:', err);
    console.log('\nMake sure your PostgreSQL server is running and the credentials in .env are correct (username: postgres, password: postgres)');
  } finally {
    await client.end();
  }
}

createDatabase();
