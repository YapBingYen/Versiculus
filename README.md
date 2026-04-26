# Versiculus - The Daily Bible Word Puzzle

Versiculus is a daily word puzzle game where players must fill in the missing words from a daily Bible verse. 

## Features (V2 Complete)
- **Daily Puzzles**: A new verse is dynamically generated or scheduled every day.
- **Multiple Translations**: Players can seamlessly switch between NIV, ESV, and KJV.
- **Hard Mode**: Removes extra contextual words for a harder challenge.
- **Hints System**: Players can use hints to reveal the first letter of a missing word.
- **User Accounts**: Global state management to save stats across devices.
- **Dynamic Leaderboard**: Ranks players by their max streak and games won.
- **Push & Email Notifications**: Automated daily reminders to keep streaks alive.
- **Admin CMS**: A dashboard to manually schedule verses and broadcast notifications.

## Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS, TypeScript
- **Backend**: Node.js, Express, PostgreSQL
- **Integrations**: Web-Push (Notifications), Nodemailer (Emails), Bible-api.com

## Local Development Setup

### 1. Database
You need a PostgreSQL database running. Create a database named `versiculus`.
Run the `schema.sql` file located in `/backend` to generate the tables.

### 2. Backend
1. `cd backend`
2. `npm install`
3. Create a `.env` file with the following variables:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/versiculus
   PORT=5001
   JWT_SECRET=your-secret-key
   
   # Run "node generate-vapid.js" to generate these:
   PUBLIC_VAPID_KEY=
   PRIVATE_VAPID_KEY=
   
   # Optional: For real email sending
   SMTP_HOST=
   SMTP_PORT=
   SMTP_USER=
   SMTP_PASS=
   ```
4. `npm run dev`

### 3. Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Open `http://localhost:3000`

## Production Deployment Preparation
1. **Frontend**: The Next.js frontend is optimized for deployment on Vercel. Ensure you set the backend API URL environment variable before building.
2. **Backend**: The Express server can be deployed to Render, Railway, or Heroku. Ensure you run `npm run build` to compile the TypeScript to JavaScript before starting the production server with `npm run start`.
3. **Database**: Provision a managed PostgreSQL database (e.g., Supabase or Neon) and update the `DATABASE_URL`.
