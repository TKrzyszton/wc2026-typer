const router = require('express').Router();
const { db } = require('../db/database');
const { adminAuth } = require('../middleware/auth');
const { calculatePoints } = require('../db/scoring');

router.put('/matches/:id/reset', adminAuth, async (req, res) => {
  const matchId = req.params.id;
  const match = await db('matches').where({ id: matchId }).first();
  if (!match) return res.status(404).json({ error: 'Mecz nie znaleziony' });

  await db('matches').where({ id: matchId }).update({
    home_score: null,
    away_score: null,
    ended_with_penalties: 0,
    status: 'scheduled',
  });
  await db('predictions').where({ match_id: matchId }).update({ points: null });

  res.json({ success: true });
});

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

router.put('/users/:id/reset-password', adminAuth, async (req, res) => {
  await db('users').where({ id: req.params.id }).update({ password_reset_required: 1 });
  res.json({ success: true });
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  const user = await db('users').where({ id: req.params.id }).first();
  if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
  if (user.is_admin) return res.status(403).json({ error: 'Nie można usunąć admina' });

  await db('predictions').where({ user_id: req.params.id }).delete();
  await db('champion_predictions').where({ user_id: req.params.id }).delete();
  await db('users').where({ id: req.params.id }).delete();
  res.json({ success: true });
});

// Reset all non-finished TBD knockout slots back to TBD (fixes corrupted bracket)
router.post('/reset-knockout', adminAuth, async (req, res) => {
  const { round } = req.body; // optional: 'Runda 32', '1/8 Finału', etc.
  let q = db('matches').whereNot({ status: 'finished' }).whereNot({ round: 'Faza grupowa' });
  if (round) q = q.where({ round });
  const affected = await q.update({
    home_team: 'TBD', away_team: 'TBD',
    home_flag: null, away_flag: null,
  });
  res.json({ success: true, affected });
});

router.put('/matches/:matchId/predictions/:userId', adminAuth, async (req, res) => {
  const { home_score, away_score, predict_penalties } = req.body;
  const existing = await db('predictions').where({ match_id: req.params.matchId, user_id: req.params.userId }).first();
  if (existing) {
    await db('predictions').where({ id: existing.id }).update({ home_score, away_score, predict_penalties: predict_penalties ? 1 : 0, updated_at: new Date().toISOString() });
  } else {
    await db('predictions').insert({ match_id: req.params.matchId, user_id: req.params.userId, home_score, away_score, predict_penalties: predict_penalties ? 1 : 0 });
  }
  res.json({ success: true });
});

router.post('/test-notifications', adminAuth, async (req, res) => {
  const { sendMatchReminders } = require('../scripts/sendNotifications');
  const minutesUntilKickoff = req.body.minutesUntilKickoff || 600;
  await sendMatchReminders({ windowMinFrom: minutesUntilKickoff - 5, windowMinTo: minutesUntilKickoff + 15 });
  res.json({ success: true });
});

router.get('/users/:userId/predictions', adminAuth, async (req, res) => {
  const preds = await db('predictions as p')
    .join('matches as m', 'm.id', 'p.match_id')
    .where('p.user_id', req.params.userId)
    .select('p.id', 'p.match_id', 'p.home_score', 'p.away_score', 'p.points', 'm.home_team', 'm.away_team', 'm.match_date', 'm.status')
    .orderBy('m.match_date');
  res.json(preds);
});

router.delete('/matches/:matchId/predictions/:userId', adminAuth, async (req, res) => {
  await db('predictions').where({ match_id: req.params.matchId, user_id: req.params.userId }).delete();
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
