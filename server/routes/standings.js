const router = require('express').Router();
const { db } = require('../db/database');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const rows = await db('users as u')
    .where('u.is_admin', 0)
    .leftJoin('predictions as p', function () {
      this.on('p.user_id', '=', 'u.id').andOn(db.raw('p.points IS NOT NULL'));
    })
    .leftJoin('champion_predictions as cp', 'cp.user_id', 'u.id')
    .select(
      'u.id',
      'u.username',
      db.raw('COALESCE(SUM(p.points), 0) as match_points'),
      db.raw('COALESCE(cp.points, 0) as champion_points'),
      db.raw('COALESCE(SUM(p.points), 0) + COALESCE(cp.points, 0) as total_points'),
      db.raw('COUNT(CASE WHEN p.points = 3 THEN 1 END) as exact_3'),
      db.raw('COUNT(CASE WHEN p.points = 2 THEN 1 END) as exact_2'),
      db.raw('COUNT(CASE WHEN p.points = 1 THEN 1 END) as exact_1')
    )
    .groupBy('u.id')
    .orderByRaw('total_points DESC, exact_3 DESC, exact_2 DESC, exact_1 DESC');

  res.json(rows);
});

module.exports = router;
