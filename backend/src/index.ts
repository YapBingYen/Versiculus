import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import webpush from 'web-push';
import cron from 'node-cron';
import { pool } from './db';
import { fetchRandomVerse, fetchVerseByReference, selectKeyWords } from './utils/verseGenerator';
import { sendEmailNotification } from './utils/mailer';
import { rateLimit } from './rateLimit';

dotenv.config();

const app = express();
const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
const PORT = parseInt(process.env.PORT || '5001', 10);
const JWT_SECRET = process.env.JWT_SECRET || (isProd ? '' : 'super-secret-versiculus-key');
const PUSH_NOTIFICATIONS_ENABLED = process.env.PUSH_NOTIFICATIONS_ENABLED === 'true';

if (PUSH_NOTIFICATIONS_ENABLED) {
  if (process.env.PUBLIC_VAPID_KEY && process.env.PRIVATE_VAPID_KEY) {
    webpush.setVapidDetails(
      'mailto:hello@versiculus.app',
      process.env.PUBLIC_VAPID_KEY,
      process.env.PRIVATE_VAPID_KEY
    );
  } else {
    console.warn('WARNING: VAPID keys not found. Push notifications will not work.');
  }
}

if (isProd && !JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/healthz', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// ---------------------------------------------------------
// AUTH ENDPOINTS
// ---------------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  key: (req) => `${req.ip}:${req.path}:${String((req as any).body?.email || '')}`,
});

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const checkUser = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'This account already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, is_admin',
      [username, email, password_hash]
    );

    // Create empty stats for new user
    await pool.query('INSERT INTO user_stats (user_id) VALUES ($1)', [newUser.rows[0].id]);

    const token = jwt.sign({ id: newUser.rows[0].id, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username,
        email: newUser.rows[0].email,
        isAdmin: !!newUser.rows[0].is_admin,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "This account doesn't exist" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, isAdmin: !!user.is_admin },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify token
const verifyToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    const isAdmin = !!result.rows[0]?.is_admin;
    if (!isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const parsePushSubscription = (raw: any) => {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const createMaskedText = (fullText: string, keyWords: string[]) => {
  let maskedText = fullText;
  keyWords.forEach((word: string) => {
    const blank = `[${'_'.repeat(word.length)}]`;
    const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
    maskedText = maskedText.replace(regex, blank);
  });
  return maskedText;
};

// ---------------------------------------------------------
// GET /api/daily
// Returns today's masked verse and metadata
// ---------------------------------------------------------
app.get('/api/daily', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const translation = req.query.translation || 'NIV';
    const difficulty = parseInt(req.query.difficulty as string) || 1;
    
    // Attempt to get the verse scheduled for today matching translation & difficulty
    let result = await pool.query(`
      SELECT v.id, v.reference, v.full_text as "fullText", v.key_words as "keyWords", v.translation, v.difficulty
      FROM daily_schedule ds
      JOIN verses v ON ds.verse_id = v.id
      WHERE ds.play_date = $1 AND v.translation = $2 AND v.difficulty = $3
    `, [today, translation, difficulty]);

    // If a verse is scheduled for today, but NOT in the requested translation
    if (result.rows.length === 0) {
      const todayScheduled = await pool.query(`
        SELECT v.reference
        FROM daily_schedule ds
        JOIN verses v ON ds.verse_id = v.id
        WHERE ds.play_date = $1
        LIMIT 1
      `, [today]);

      if (todayScheduled.rows.length > 0) {
        const reference = todayScheduled.rows[0].reference;
        
        // Does this translation exist in the verses table already?
        const transRes = await pool.query(`
          SELECT id, reference, full_text as "fullText", key_words as "keyWords", translation, difficulty
          FROM verses
          WHERE reference = $1 AND translation = $2 AND difficulty = $3
          LIMIT 1
        `, [reference, translation, difficulty]);

        if (transRes.rows.length > 0) {
          result = transRes;
        } else {
          // Check if we already have the text for this translation in another difficulty
          const existingTextRes = await pool.query(`
            SELECT full_text as "fullText"
            FROM verses
            WHERE reference = $1 AND translation = $2
            LIMIT 1
          `, [reference, translation]);

          let verseTextToUse = null;
          if (existingTextRes.rows.length > 0) {
            verseTextToUse = existingTextRes.rows[0].fullText;
          } else {
            // Fetch from the external API in the requested translation
            const newVerseData = await fetchVerseByReference(reference, translation as string);
            if (newVerseData) verseTextToUse = newVerseData.text;
          }

          if (verseTextToUse) {
            const keyWords = selectKeyWords(verseTextToUse, difficulty === 3 ? 6 : 4);
            const insertRes = await pool.query(`
              INSERT INTO verses (reference, full_text, key_words, difficulty, translation)
              VALUES ($1, $2, $3, $4, $5) RETURNING id, reference, full_text as "fullText", key_words as "keyWords", translation, difficulty
            `, [reference, verseTextToUse, keyWords, difficulty, translation]);
            
            result = insertRes;
          } else {
            // Ultimate fallback: Just serve whatever translation is already scheduled
            result = await pool.query(`
              SELECT v.id, v.reference, v.full_text as "fullText", v.key_words as "keyWords", v.translation, v.difficulty
              FROM daily_schedule ds
              JOIN verses v ON ds.verse_id = v.id
              WHERE ds.play_date = $1
            `, [today]);
          }
        }
      }
    }

    // If no schedule exists for today, generate a random verse and schedule it
    if (result.rows.length === 0) {
      const randomVerseData = await fetchRandomVerse(translation as string);
      const keyWords = selectKeyWords(randomVerseData.text, difficulty === 3 ? 6 : 4);

      const verseResult = await pool.query(`
        INSERT INTO verses (reference, full_text, key_words, difficulty, translation)
        VALUES ($1, $2, $3, $4, $5) RETURNING id, reference, full_text as "fullText", key_words as "keyWords", translation, difficulty
      `, [randomVerseData.reference, randomVerseData.text, keyWords, difficulty, translation]);

      const newVerse = verseResult.rows[0];

      await pool.query(`
        INSERT INTO daily_schedule (play_date, verse_id)
        VALUES ($1, $2)
      `, [today, newVerse.id]);

      result = { rows: [newVerse] } as any;
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No verses found in the database.' });
    }

    let verse = result.rows[0];

    const requestedDifficulty = difficulty;
    const requestedTranslation = translation as string;

    if (verse.reference && verse.fullText && verse.translation === requestedTranslation) {
      const updated = await fetchVerseByReference(verse.reference, requestedTranslation);
      if (updated?.text && updated.text.trim() !== verse.fullText.trim()) {
        const expectedCount = requestedDifficulty === 3 ? 6 : 4;
        const regeneratedKeyWords = selectKeyWords(updated.text, expectedCount);
        const updatedRow = await pool.query(
          `UPDATE verses
           SET full_text = $1, key_words = $2
           WHERE id = $3
           RETURNING id, reference, full_text as "fullText", key_words as "keyWords", translation, difficulty`,
          [updated.text, regeneratedKeyWords, verse.id]
        );
        if (updatedRow.rows.length > 0) {
          verse = updatedRow.rows[0];
        }
      }
    }

    const expectedCount = requestedDifficulty === 3 ? 6 : 4;
    if (Array.isArray(verse.keyWords) && verse.fullText && verse.keyWords.length !== expectedCount) {
      const regeneratedKeyWords = selectKeyWords(verse.fullText, expectedCount);
      const updatedRow = await pool.query(
        `UPDATE verses
         SET key_words = $1
         WHERE id = $2
         RETURNING id, reference, full_text as "fullText", key_words as "keyWords", translation, difficulty`,
        [regeneratedKeyWords, verse.id]
      );
      if (updatedRow.rows.length > 0) {
        verse = updatedRow.rows[0];
      }
    }
    
    const maskedText = createMaskedText(verse.fullText, verse.keyWords);

    res.json({
      id: verse.id,
      reference: verse.reference,
      fullText: verse.fullText,
      keyWords: verse.keyWords,
      maskedText,
      translation: verse.translation,
      difficulty: verse.difficulty
    });
    
  } catch (error) {
    console.error('Error fetching daily verse:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/practice', verifyToken, async (req, res) => {
  try {
    const translation = (req.query.translation as string) || 'NIV';
    const difficulty = parseInt(req.query.difficulty as string, 10) || 1;
    const count = difficulty === 3 ? 6 : 4;

    const randomVerseData = await fetchRandomVerse(translation);
    const keyWords = selectKeyWords(randomVerseData.text, count);
    const maskedText = createMaskedText(randomVerseData.text, keyWords);

    res.json({
      id: Date.now(),
      reference: randomVerseData.reference,
      fullText: randomVerseData.text,
      keyWords,
      maskedText,
      translation,
      difficulty,
      mode: 'practice'
    });
  } catch (error) {
    console.error('Error fetching practice verse:', error);
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
  const { userId } = req.params;
  const { isWin, attempts } = req.body;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if stats exist
    const statsResult = await pool.query('SELECT * FROM user_stats WHERE user_id = $1', [userId]);
    
    if (statsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stats not found for user' });
    }
    
    const stats = statsResult.rows[0];
    
    // If already played today, don't update stats again
    if (stats.last_played_date && new Date(stats.last_played_date).toISOString().split('T')[0] === today) {
      return res.json({ success: true, message: 'Already played today' });
    }

    const gamesPlayed = stats.games_played + 1;
    const gamesWon = isWin ? stats.games_won + 1 : stats.games_won;
    
    // Streak logic
    let currentStreak = stats.current_streak;
    const lastPlayed = stats.last_played_date ? new Date(stats.last_played_date as string) : null;
    
    const todayStr = today as string;
    const todayDate = new Date(todayStr);
    
    if (lastPlayed) {
      const diffTime = Math.abs(todayDate.getTime() - lastPlayed.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1 && isWin) {
        currentStreak += 1;
      } else if (diffDays > 1 || !isWin) {
        currentStreak = isWin ? 1 : 0;
      }
    } else {
      currentStreak = isWin ? 1 : 0;
    }
    
    const maxStreak = Math.max(currentStreak, stats.max_streak);
    
    // Update distribution
    const distribution = stats.guess_distribution || {};
    if (isWin && attempts) {
      distribution[attempts] = (distribution[attempts] || 0) + 1;
    }

    await pool.query(`
      UPDATE user_stats 
      SET games_played = $1, games_won = $2, current_streak = $3, max_streak = $4, guess_distribution = $5, last_played_date = $6
      WHERE user_id = $7
    `, [gamesPlayed, gamesWon, currentStreak, maxStreak, distribution, today, userId]);

    res.json({ success: true, message: 'Stats updated successfully' });
  } catch (error) {
    console.error('Error updating stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------
// GET /api/leaderboard
// Returns top users by max streak
// ---------------------------------------------------------
app.get('/api/leaderboard', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.username, us.max_streak, us.games_won, us.games_played
      FROM user_stats us
      JOIN users u ON us.user_id = u.id
      ORDER BY us.max_streak DESC, us.games_won DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------
// PUSH NOTIFICATIONS ENDPOINTS
// ---------------------------------------------------------
app.get('/api/notifications/preferences', verifyToken, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT email_notifications FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length > 0) {
      res.json({ email_notifications: result.rows[0].email_notifications });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

app.get('/api/notifications/public-key', (req, res) => {
  if (!PUSH_NOTIFICATIONS_ENABLED) {
    return res.status(404).send('');
  }
  if (!process.env.PUBLIC_VAPID_KEY) {
    return res.status(500).send('');
  }
  res.type('text/plain').send(process.env.PUBLIC_VAPID_KEY);
});

app.post('/api/notifications/subscribe', verifyToken, async (req: any, res: any) => {
  if (!PUSH_NOTIFICATIONS_ENABLED) {
    return res.status(410).json({ success: false, error: 'Push notifications are disabled.' });
  }
  const subscription = req.body.subscription;
  const userId = req.user.id;
  const pushOptions = { TTL: 60 * 60 };

  try {
    await pool.query(
      'UPDATE users SET push_subscription = $1 WHERE id = $2',
      [subscription ? JSON.stringify(subscription) : null, userId]
    );
    if (subscription) {
      const payload = JSON.stringify({ title: 'Push Enabled', body: 'You will now receive daily Versiculus reminders.' });
      try {
        await webpush.sendNotification(subscription, payload, pushOptions);
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await pool.query('UPDATE users SET push_subscription = NULL WHERE id = $1', [userId]);
        }
        return res.status(400).json({ success: false, error: 'Push subscription could not be validated.' });
      }
    }
    res.status(201).json({ success: true, message: 'Subscription saved.' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription.' });
  }
});

app.post('/api/notifications/email-subscribe', verifyToken, async (req: any, res) => {
  const { enabled } = req.body;
  const userId = req.user.id;

  try {
    await pool.query(
      'UPDATE users SET email_notifications = $1 WHERE id = $2',
      [enabled, userId]
    );
    if (enabled) {
      const emailRes = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
      const to = emailRes.rows[0]?.email;
      if (to) {
        const ok = await sendEmailNotification(to, 'Email Reminders Enabled', 'You will now receive an email when a new daily puzzle is ready.');
        if (!ok) {
          await pool.query('UPDATE users SET email_notifications = false WHERE id = $1', [userId]);
          return res.status(500).json({ success: false, error: 'Email is not configured on the server yet.' });
        }
      }
    }
    res.status(200).json({ success: true, message: 'Email preferences updated.' });
  } catch (error) {
    console.error('Error saving email preferences:', error);
    res.status(500).json({ error: 'Failed to save email preferences.' });
  }
});

app.post('/api/admin/notify-all', verifyToken, requireAdmin, async (req: any, res) => {

  const { title, body } = req.body;
  const payloadTitle = title || 'New Verse!';
  const payloadBody = body || 'Play today\'s Versiculus puzzle.';

  try {
    // Handle Email Notifications
    const emailResult = await pool.query('SELECT email FROM users WHERE email_notifications = true');
    const emailUsers = emailResult.rows;

    let emailSent = 0;
    let emailFailed = 0;
    for (const user of emailUsers) {
      const ok = await sendEmailNotification(user.email, payloadTitle, payloadBody);
      if (ok) emailSent += 1;
      else emailFailed += 1;
    }

    res.json({
      success: true,
      message: `Emails sent: ${emailSent}. Email failed: ${emailFailed}.`
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications.' });
  }
});

// ---------------------------------------------------------
// ADMIN CMS ENDPOINTS
// ---------------------------------------------------------
app.post('/api/admin/verses', verifyToken, requireAdmin, async (req: any, res) => {
  const { reference, fullText, keyWords, difficulty, translation, scheduleDate } = req.body;
  try {
    // Basic admin check (in a real app, verify user role)
    
    // Insert new verse
    const verseResult = await pool.query(`
      INSERT INTO verses (reference, full_text, key_words, difficulty, translation)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [reference, fullText, keyWords, difficulty || 1, translation || 'NIV']);
    
    const verseId = verseResult.rows[0].id;
    
    // Schedule it if a date was provided
    if (scheduleDate) {
      await pool.query(`
        INSERT INTO daily_schedule (play_date, verse_id)
        VALUES ($1, $2)
        ON CONFLICT (play_date) DO UPDATE SET verse_id = EXCLUDED.verse_id
      `, [scheduleDate, verseId]);
    }
    
    res.json({ success: true, verseId });
  } catch (error) {
    console.error('Error adding verse:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------
// CRON JOBS
// ---------------------------------------------------------
const runDailyRoutine = async () => {
  const today = new Date().toISOString().split('T')[0];

  let verseResult = await pool.query(
    'SELECT v.id FROM daily_schedule ds JOIN verses v ON ds.verse_id = v.id WHERE ds.play_date = $1',
    [today]
  );
  if (verseResult.rows.length === 0) {
    const randomVerseData = await fetchRandomVerse('NIV');
    const keyWords = selectKeyWords(randomVerseData.text);
    const insertRes = await pool.query(
      'INSERT INTO verses (reference, full_text, key_words, difficulty, translation) VALUES ($1, $2, $3, 1, $4) RETURNING id',
      [randomVerseData.reference, randomVerseData.text, keyWords, 'NIV']
    );
    await pool.query('INSERT INTO daily_schedule (play_date, verse_id) VALUES ($1, $2)', [today, insertRes.rows[0].id]);
  }

  const emailResult = await pool.query('SELECT email FROM users WHERE email_notifications = true');
  const emailUsers = emailResult.rows as Array<{ email: string }>;
  const emailNotifications = emailUsers.map((user) =>
    sendEmailNotification(
      user.email,
      'New Daily Verse!',
      'Your daily Versiculus puzzle is ready to play. Log in now to keep your streak alive!'
    )
  );
  await Promise.all(emailNotifications);

  return { emailsAttempted: emailUsers.length };
};

app.post('/api/cron/daily', async (req, res) => {
  const secret = process.env.CRON_SECRET || '';
  if (secret) {
    const provided = String(req.header('x-cron-secret') || '');
    if (provided !== secret) return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await runDailyRoutine();
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('Error running daily routine:', error);
    res.status(500).json({ ok: false });
  }
});

// Run every day at 8:00 AM server time (only works while the process is running)
cron.schedule('0 8 * * *', async () => {
  try {
    await runDailyRoutine();
  } catch (error) {
    console.error('Error in daily cron job:', error);
  }
});

app.listen(PORT, () => {
  console.log(`Versiculus API Server running on port ${PORT}`);
});
