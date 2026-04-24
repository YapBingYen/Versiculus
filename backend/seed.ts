import { pool } from './src/db';

async function seed() {
  console.log('Connecting to PostgreSQL to seed database...');
  
  try {
    // Create verses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verses (
        id SERIAL PRIMARY KEY,
        reference VARCHAR(50) NOT NULL,
        full_text TEXT NOT NULL,
        key_words TEXT[] NOT NULL,
        difficulty SMALLINT DEFAULT 1,
        last_used DATE
      );
    `);

    // Create daily schedule table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_schedule (
        play_date DATE PRIMARY KEY,
        verse_id INT REFERENCES verses(id)
      );
    `);

    // Create user stats table (UUID generation uses standard PG 13+ gen_random_uuid)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        games_played INT DEFAULT 0,
        games_won INT DEFAULT 0,
        current_streak INT DEFAULT 0,
        max_streak INT DEFAULT 0,
        last_played_date DATE,
        guess_distribution JSONB DEFAULT '{}'
      );
    `);

    // Insert John 3:16 (Verse 1)
    await pool.query(`
      INSERT INTO verses (id, reference, full_text, key_words)
      VALUES (
        1,
        'John 3:16', 
        'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        ARRAY['world', 'Son', 'believes', 'perish']
      ) ON CONFLICT (id) DO NOTHING;
    `);

    // Insert Proverbs 3:5-6 (Verse 2)
    await pool.query(`
      INSERT INTO verses (id, reference, full_text, key_words)
      VALUES (
        2,
        'Proverbs 3:5-6', 
        'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
        ARRAY['Trust', 'heart', 'understanding', 'paths']
      ) ON CONFLICT (id) DO NOTHING;
    `);

    // Assign John 3:16 to today's date
    const today = new Date().toISOString().split('T')[0];
    await pool.query(`
      INSERT INTO daily_schedule (play_date, verse_id)
      VALUES ($1, 1) 
      ON CONFLICT (play_date) DO NOTHING;
    `, [today]);

    // Assign Proverbs 3:5-6 to tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    await pool.query(`
      INSERT INTO daily_schedule (play_date, verse_id)
      VALUES ($1, 2) 
      ON CONFLICT (play_date) DO NOTHING;
    `, [tomorrowStr]);

    console.log('✅ Database seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
  } finally {
    await pool.end();
  }
}

seed();
