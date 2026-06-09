const router = require('express').Router();
const { db } = require('../db/database');
const { adminAuth } = require('../middleware/auth');
const { calculatePoints } = require('../db/scoring');

router.put('/matches/:id/result', adminAuth, async (req, res) => {
  const { home_score, away_score, ended_with_penalties, status } = req.body;
  const matchId = req.params.id;

  const match = await db('matches').where({ id: matchId }).first();
  if (!match) return res.status(404).json({ error: 'Mecz nie znaleziony' });

  await db('matches').where({ id: matchId }).update({
    home_score: home_score ?? null,
    away_score: away_score ?? null,
    ended_with_penalties: ended_with_penalties ? 1 : 0,
    status: status || 'finished',
  });

  if (home_score !== null && home_score !== undefined && away_score !== null && away_score !== undefined) {
    const updatedMatch = await db('matches').where({ id: matchId }).first();
    const predictions = await db('predictions').where({ match_id: matchId });
    for (const pred of predictions) {
      const { points } = calculatePoints(updatedMatch, pred);
      await db('predictions').where({ id: pred.id }).update({ points });
    }
  }

  res.json({ success: true });
});

router.put('/matches/:id/teams', adminAuth, async (req, res) => {
  const { home_team, away_team, home_flag, away_flag } = req.body;
  await db('matches').where({ id: req.params.id }).update({
    home_team, away_team,
    home_flag: home_flag || null,
    away_flag: away_flag || null,
  });
  res.json({ success: true });
});

router.put('/champion', adminAuth, async (req, res) => {
  const { team } = req.body;
  if (!team) return res.status(400).json({ error: 'Podaj mistrza' });

  const preds = await db('champion_predictions');
  for (const p of preds) {
    await db('champion_predictions').where({ id: p.id })
      .update({ points: p.team === team ? 5 : 0 });
  }
  res.json({ success: true });
});

// Bootstrap: działa tylko gdy nie ma jeszcze żadnego admina
router.post('/bootstrap', async (req, res) => {
  const { username } = req.body;
  const existingAdmin = await db('users').where({ is_admin: 1 }).first();
  if (existingAdmin) {
    return res.status(403).json({ error: 'Bootstrap już wykonany' });
  }
  const user = await db('users').where({ username }).first();
  if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
  await db('users').where({ id: user.id }).update({ is_admin: 1 });

  const seedFn = require('../scripts/seedInline');
  await db('predictions').delete();
  await db('champion_predictions').delete();
  await db('matches').delete();
  await seedFn(db);
  const count = await db('matches').count('id as c').first();
  res.json({ success: true, admin: username, matches: count.c });
});

// Force reseed
router.post('/reseed', adminAuth, async (req, res) => {
  const seedFn = require('../scripts/seedInline');
  await db('predictions').delete();
  await db('champion_predictions').delete();
  await db('matches').delete();
  await seedFn(db);
  const count = await db('matches').count('id as c').first();
  res.json({ success: true, matches: count.c });
});

router.get('/users', adminAuth, async (req, res) => {
  const users = await db('users').select('id', 'username', 'is_admin', 'created_at');
  res.json(users);
});

router.put('/users/:id/admin', adminAuth, async (req, res) => {
  await db('users').where({ id: req.params.id }).update({ is_admin: req.body.is_admin ? 1 : 0 });
  res.json({ success: true });
});

router.put('/users/:id/password', adminAuth, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Hasło musi mieć min. 6 znaków' });
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(password, 10);
  await db('users').where({ id: req.params.id }).update({ password_hash: hash });
  res.json({ success: true });
});

router.get('/matches/:id/predictions', adminAuth, async (req, res) => {
  const preds = await db('predictions as p')
    .join('users as u', 'u.id', 'p.user_id')
    .where('p.match_id', req.params.id)
    .select('u.username', 'p.home_score', 'p.away_score', 'p.predict_penalties', 'p.points')
    .orderBy('u.username');
  res.json(preds);
});

module.exports = router;
