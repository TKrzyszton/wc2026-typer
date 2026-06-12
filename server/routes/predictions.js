const router = require('express').Router();
const { db } = require('../db/database');
const { auth } = require('../middleware/auth');

const LOCK_MINUTES = 5;

// Godziny w bazie są w czasie polskim (CEST = UTC+2 latem, CET = UTC+1 zimą).
// Turniej odbywa się w czerwcu–lipcu → zawsze CEST = +02:00.
function toCEST(matchDate, matchTime) {
  return new Date(`${matchDate}T${matchTime}:00+02:00`);
}

function isLocked(matchDate, matchTime) {
  return Date.now() >= toCEST(matchDate, matchTime).getTime() - LOCK_MINUTES * 60 * 1000;
}

async function getFirstMatchStart() {
  const first = await db('matches').orderBy(['match_date', 'match_time']).first();
  if (!first) return null;
  return toCEST(first.match_date, first.match_time);
}

router.post('/match/:id', auth, async (req, res) => {
  const match = await db('matches').where({ id: req.params.id }).first();
  if (!match) return res.status(404).json({ error: 'Mecz nie znaleziony' });
  if (isLocked(match.match_date, match.match_time)) {
    return res.status(403).json({ error: 'Typowanie zablokowane (5 min przed meczem)' });
  }

  const { home_score, away_score, predict_penalties } = req.body;

  if (!predict_penalties) {
    if (home_score === undefined || home_score === null || away_score === undefined || away_score === null) {
      return res.status(400).json({ error: 'Podaj wynik lub zaznacz rzuty karne' });
    }
    if (!Number.isInteger(home_score) || !Number.isInteger(away_score) || home_score < 0 || away_score < 0) {
      return res.status(400).json({ error: 'Wynik musi być nieujemną liczbą całkowitą' });
    }
  }

  if (predict_penalties && match.round === 'Faza grupowa') {
    return res.status(400).json({ error: 'Rzuty karne możliwe tylko w fazie pucharowej' });
  }

  const existing = await db('predictions')
    .where({ user_id: req.user.id, match_id: match.id }).first();

  const data = {
    home_score: predict_penalties ? null : home_score,
    away_score: predict_penalties ? null : away_score,
    predict_penalties: predict_penalties ? 1 : 0,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await db('predictions').where({ id: existing.id }).update(data);
  } else {
    await db('predictions').insert({ user_id: req.user.id, match_id: match.id, ...data });
  }

  res.json({ success: true });
});

router.get('/match/:id/all', auth, async (req, res) => {
  const match = await db('matches').where({ id: req.params.id }).first();
  if (!match) return res.status(404).json({ error: 'Mecz nie znaleziony' });
  if (!isLocked(match.match_date, match.match_time)) {
    return res.status(403).json({ error: 'Typy widoczne dopiero po zablokowaniu meczu' });
  }
  const preds = await db('predictions as p')
    .join('users as u', 'u.id', 'p.user_id')
    .where('p.match_id', req.params.id)
    .select('u.username', 'p.home_score', 'p.away_score', 'p.predict_penalties', 'p.points')
    .orderBy('u.username');
  res.json(preds);
});

router.get('/champion', auth, async (req, res) => {
  const pred = await db('champion_predictions').where({ user_id: req.user.id }).first();
  res.json(pred || null);
});

router.post('/champion', auth, async (req, res) => {
  const firstMatch = await getFirstMatchStart();
  if (firstMatch) {
    const lockTime = new Date(firstMatch.getTime() - LOCK_MINUTES * 60 * 1000);
    if (new Date() >= lockTime) {
      return res.status(403).json({ error: 'Typowanie mistrza zablokowane (5 min przed 1. meczem)' });
    }
  }

  const { team } = req.body;
  if (!team?.trim()) return res.status(400).json({ error: 'Podaj nazwę drużyny' });

  const existing = await db('champion_predictions').where({ user_id: req.user.id }).first();
  if (existing) {
    await db('champion_predictions').where({ user_id: req.user.id })
      .update({ team: team.trim(), updated_at: new Date().toISOString() });
  } else {
    await db('champion_predictions').insert({ user_id: req.user.id, team: team.trim() });
  }

  res.json({ success: true });
});

module.exports = router;
