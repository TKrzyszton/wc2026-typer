require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initSchema, db } = require('./db/database');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
}

app.use(express.json());

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/matches',     require('./routes/matches'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/standings',   require('./routes/standings'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

if (isProd) {
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Błąd serwera' });
});

async function seedIfEmpty() {
  const count = await db('matches').count('id as c').first();
  if (count.c > 0) return;

  console.log('Baza pusta – ładuję terminarz…');
  // Inline seed – unika execSync
  const seedFn = require('./scripts/seedInline');
  await seedFn(db);
  console.log('Terminarz załadowany.');
}

async function start() {
  // Bind port FIRST – Railway sprawdza czy port jest otwarty
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`\n🚀 Serwer: http://localhost:${PORT}\n`));

  // Inicjalizacja bazy po bindowaniu portu
  await initSchema();
  await seedIfEmpty();
  await require('./scripts/migrateFlags');

  if (process.env.FOOTBALL_API_KEY) {
    const cron = require('node-cron');
    const { sync } = require('./scripts/syncResults');

    sync();
    cron.schedule('* * * * *', sync);
    console.log('Auto-sync wyników aktywny (co 1 min)');
  } else {
    console.log('Brak FOOTBALL_API_KEY – wyniki wpisuj ręcznie w panelu Admin.');
  }

  if (process.env.RESEND_API_KEY) {
    const cron = require('node-cron');
    const { sendMatchReminders } = require('./scripts/sendNotifications');
    cron.schedule('*/15 * * * *', sendMatchReminders);
    console.log('Powiadomienia email aktywne (co 15 min)');
  }
}

start().catch(e => { console.error('Błąd startu:', e); process.exit(1); });
