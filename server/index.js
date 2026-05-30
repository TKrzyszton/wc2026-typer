require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initSchema } = require('./db/database');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// W produkcji CORS nie jest potrzebny (Express serwuje frontend sam)
if (!isProd) {
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
}

app.use(express.json());

// API routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/matches',     require('./routes/matches'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/standings',   require('./routes/standings'));
app.use('/api/admin',       require('./routes/admin'));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Serwuj zbudowany frontend w produkcji
if (isProd) {
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // React Router – wszystkie nieznane ścieżki zwracają index.html
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.warn('WARN: client/dist nie istnieje – uruchom npm run build');
  }
}

// Global async error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Błąd serwera' });
});

async function start() {
  await initSchema();

  const { db } = require('./db/database');
  const count = await db('matches').count('id as c').first();
  if (count.c === 0) {
    console.log('Baza pusta – ładuję terminarz…');
    const { execSync } = require('child_process');
    execSync('node scripts/seedMatches.js', { stdio: 'inherit', cwd: __dirname });
  }

  if (process.env.FOOTBALL_API_KEY) {
    const cron = require('node-cron');
    const { sync } = require('./scripts/syncResults');
    sync();
    cron.schedule('*/5 * * * *', sync);
    console.log('Auto-sync wyników aktywny (co 5 min)');
  } else {
    console.log('Brak FOOTBALL_API_KEY – wyniki wpisuj ręcznie w panelu Admin.');
  }

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`\n🚀 Serwer: http://localhost:${PORT}\n`));
}

start().catch(e => { console.error(e); process.exit(1); });
