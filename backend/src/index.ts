import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------
// GET /api/daily
// Returns today's masked verse and metadata
// ---------------------------------------------------------
app.get('/api/daily', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Attempt to get the verse scheduled for today
    let result = await pool.query(`
      SELECT v.id, v.reference, v.full_text as "fullText", v.key_words as "keyWords"
      FROM daily_schedule ds
      JOIN verses v ON ds.verse_id = v.id
      WHERE ds.play_date = $1
    `, [today]);

    // If no schedule exists for today, fallback to verse id 1
    if (result.rows.length === 0) {
      result = await pool.query(`
        SELECT id, reference, full_text as "fullText", key_words as "keyWords" 
        FROM verses 
        ORDER BY id ASC LIMIT 1
      `);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No verses found in the database.' });
    }

    const verse = result.rows[0];
    
    // Generate masked text on the backend
    let maskedText = verse.fullText;
    verse.keyWords.forEach((word: string) => {
      // Create a blank that matches the character count exactly
      const blank = `[${'_'.repeat(word.length)}]`;
      // Replace the exact word (case-insensitive) using word boundaries
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      maskedText = maskedText.replace(regex, blank);
    });

    res.json({
      id: verse.id,
      reference: verse.reference,
      fullText: verse.fullText,
      keyWords: verse.keyWords,
      maskedText
    });
    
  } catch (error) {
    console.error('Error fetching daily verse:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------
// GET /api/stats/:userId
// Returns user statistics
// ---------------------------------------------------------
app.get('/api/stats/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM user_stats WHERE user_id = $1', [userId]);
    
    if (result.rows.length === 0) {
      // Return default empty stats if user not found
      return res.json({ 
        games_played: 0, 
        games_won: 0, 
        current_streak: 0, 
        max_streak: 0, 
        guess_distribution: {} 
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------
// POST /api/stats/:userId
// Updates user statistics after game completion (Stub for V1)
// ---------------------------------------------------------
app.post('/api/stats/:userId', async (req, res) => {
  // To be fully implemented in V2
  res.json({ success: true, message: 'Stats updated (mock)' });
});

app.listen(PORT, () => {
  console.log(`Versiculus API Server running on port ${PORT}`);
});
