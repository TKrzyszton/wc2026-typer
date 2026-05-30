const router = require('express').Router();
const { db } = require('../db/database');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, async (req, res) => {
  const userId = req.user?.id ?? -1;
  const matches = await db('matches as m')
    .leftJoin('predictions as p', function () {
      this.on('p.match_id', '=', 'm.id').andOn('p.user_id', '=', db.raw('?', [userId]));
    })
    .select(
      'm.*',
      'p.home_score as pred_home',
      'p.away_score as pred_away',
      'p.predict_penalties',
      'p.points as pred_points'
    )
    .orderBy(['m.match_date', 'm.match_time', 'm.sort_order']);

  const grouped = {};
  for (const m of matches) {
    if (!grouped[m.match_date]) grouped[m.match_date] = [];
    grouped[m.match_date].push(m);
  }
  res.json(grouped);
});

router.get('/:id', optionalAuth, async (req, res) => {
  const match = await db('matches').where({ id: req.params.id }).first();
  if (!match) return res.status(404).json({ error: 'Mecz nie znaleziony' });
  res.json(match);
});

module.exports = router;
