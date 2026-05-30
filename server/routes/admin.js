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

router.get('/users', adminAuth, async (req, res) => {
  const users = await db('users').select('id', 'username', 'is_admin', 'created_at');
  res.json(users);
});

router.put('/users/:id/admin', adminAuth, async (req, res) => {
  await db('users').where({ id: req.params.id }).update({ is_admin: req.body.is_admin ? 1 : 0 });
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
