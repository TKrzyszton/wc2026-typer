const router = require('express').Router();
const axios = require('axios');
const { db } = require('../db/database');
const { optionalAuth } = require('../middleware/auth');

const EN_TO_PL = {
  'Mexico': 'Meksyk', 'United States': 'USA', 'USA': 'USA', 'Canada': 'Kanada',
  'Argentina': 'Argentyna', 'Brazil': 'Brazylia', 'Colombia': 'Kolumbia',
  'Ecuador': 'Ekwador', 'Uruguay': 'Urugwaj', 'Chile': 'Chile', 'Peru': 'Peru',
  'Venezuela': 'Wenezuela', 'Paraguay': 'Paragwaj', 'Germany': 'Niemcy',
  'France': 'Francja', 'Spain': 'Hiszpania', 'England': 'Anglia',
  'Portugal': 'Portugalia', 'Netherlands': 'Holandia', 'Belgium': 'Belgia',
  'Italy': 'Włochy', 'Switzerland': 'Szwajcaria', 'Croatia': 'Chorwacja',
  'Denmark': 'Dania', 'Austria': 'Austria', 'Scotland': 'Szkocja',
  'Hungary': 'Węgry', 'Turkey': 'Turcja', 'Türkiye': 'Turcja',
  'Czech Republic': 'Czechy', 'Czechia': 'Czechy', 'Poland': 'Polska',
  'Romania': 'Rumunia', 'Serbia': 'Serbia', 'Ukraine': 'Ukraina',
  'Sweden': 'Szwecja', 'Norway': 'Norwegia', 'Japan': 'Japonia',
  'South Korea': 'Korea Południowa', 'Korea Republic': 'Korea Południowa',
  'Australia': 'Australia', 'Iran': 'Iran', 'Saudi Arabia': 'Arabia Saudyjska',
  'Jordan': 'Jordania', 'Iraq': 'Irak', 'Uzbekistan': 'Uzbekistan', 'Qatar': 'Katar',
  'Morocco': 'Maroko', 'Senegal': 'Senegal', 'Nigeria': 'Nigeria',
  'Cameroon': 'Kamerun', 'DR Congo': 'DR Konga', 'Congo DR': 'DR Konga',
  'Democratic Republic of Congo': 'DR Konga', 'Mali': 'Mali', 'Egypt': 'Egipt',
  'Ghana': 'Ghana', 'Tunisia': 'Tunezja', 'Algeria': 'Algieria',
  'Panama': 'Panama', 'Jamaica': 'Jamajka', 'Honduras': 'Honduras',
  'Costa Rica': 'Kostaryka', 'Trinidad and Tobago': 'Trynidad i Tobago',
  'Haiti': 'Haiti', 'New Zealand': 'Nowa Zelandia', 'South Africa': 'RPA',
  'Curaçao': 'Curacao', 'Curacao': 'Curacao',
  "Côte d'Ivoire": 'Wybrzeże Kości Słoniowej', 'Ivory Coast': 'Wybrzeże Kości Słoniowej',
  'Cape Verde': 'Republika Zielonego Przylądka', 'Cape Verde Islands': 'Republika Zielonego Przylądka',
  'Bosnia and Herzegovina': 'Bośnia i Hercegowina', 'Bosnia & Herzegovina': 'Bośnia i Hercegowina',
  'Bosnia-Herzegovina': 'Bośnia i Hercegowina',
};

function toPlName(n) { return EN_TO_PL[n] || n; }

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

router.get('/:id/live-check', async (req, res) => {
  const LIVE_KEY = process.env.APISPORTS_KEY;
  if (!LIVE_KEY) return res.json({ status: 'no_key' });

  const match = await db('matches').where({ id: req.params.id }).first();
  if (!match) return res.status(404).json({ error: 'Not found' });

  try {
    const resp = await axios.get('https://v3.football.api-sports.io/fixtures?live=all', {
      headers: { 'x-apisports-key': LIVE_KEY },
    });

    const fixtures = (resp.data.response || []).filter(f => f.league.id === 1);

    const fixture = fixtures.find(f => {
      const h = toPlName(f.teams.home.name);
      const a = toPlName(f.teams.away.name);
      return (h === match.home_team && a === match.away_team) ||
             (h === match.away_team && a === match.home_team);
    });

    if (!fixture) return res.json({ status: 'not_live' });

    const short = fixture.fixture.status.short;
    const minute = fixture.fixture.status.elapsed;

    let status;
    if (short === '1H')                          status = 'first_half';
    else if (short === 'HT')                     status = 'half_time';
    else if (short === '2H' || short === 'ET')   status = 'second_half';
    else if (short === 'FT' || short === 'AET' || short === 'PEN') status = 'finished';
    else                                          status = 'not_live';

    res.json({ status, minute });
  } catch (e) {
    if (e.response?.status === 429) return res.json({ status: 'rate_limit' });
    console.error('[live-check]', e.message);
    res.json({ status: 'error' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  const match = await db('matches').where({ id: req.params.id }).first();
  if (!match) return res.status(404).json({ error: 'Mecz nie znaleziony' });
  res.json(match);
});

module.exports = router;
