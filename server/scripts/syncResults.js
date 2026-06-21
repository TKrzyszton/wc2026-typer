/**
 * Sync service: pobiera wyniki z football-data.org i uzupełnia faze pucharową.
 * Uruchamiany co 5 minut przez node-cron.
 * Można też uruchomić ręcznie: node scripts/syncResults.js
 */
const axios = require('axios');
const { db, initSchema } = require('../db/database');
const { calculatePoints } = require('../db/scoring');

const API_KEY = process.env.FOOTBALL_API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

// Mapowanie angielskich nazw API → polskie nazwy w bazie
const EN_TO_PL = {
  'Mexico':                  'Meksyk',
  'United States':           'USA',
  'USA':                     'USA',
  'Canada':                  'Kanada',
  'Argentina':               'Argentyna',
  'Brazil':                  'Brazylia',
  'Colombia':                'Kolumbia',
  'Ecuador':                 'Ekwador',
  'Uruguay':                 'Urugwaj',
  'Chile':                   'Chile',
  'Peru':                    'Peru',
  'Venezuela':               'Wenezuela',
  'Paraguay':                'Paragwaj',
  'Germany':                 'Niemcy',
  'France':                  'Francja',
  'Spain':                   'Hiszpania',
  'England':                 'Anglia',
  'Portugal':                'Portugalia',
  'Netherlands':             'Holandia',
  'Belgium':                 'Belgia',
  'Italy':                   'Włochy',
  'Switzerland':             'Szwajcaria',
  'Croatia':                 'Chorwacja',
  'Denmark':                 'Dania',
  'Austria':                 'Austria',
  'Scotland':                'Szkocja',
  'Hungary':                 'Węgry',
  'Turkey':                  'Turcja',
  'Türkiye':                 'Turcja',
  'Czech Republic':          'Czechy',
  'Czechia':                 'Czechy',
  'Poland':                  'Polska',
  'Romania':                 'Rumunia',
  'Serbia':                  'Serbia',
  'Ukraine':                 'Ukraina',
  'Sweden':                  'Szwecja',
  'Norway':                  'Norwegia',
  'Japan':                   'Japonia',
  'South Korea':             'Korea Południowa',
  'Korea Republic':          'Korea Południowa',
  'Australia':               'Australia',
  'Iran':                    'Iran',
  'Saudi Arabia':            'Arabia Saudyjska',
  'Jordan':                  'Jordania',
  'Iraq':                    'Irak',
  'Uzbekistan':              'Uzbekistan',
  'Qatar':                   'Katar',
  'Morocco':                 'Maroko',
  'Senegal':                 'Senegal',
  'Nigeria':                 'Nigeria',
  'Cameroon':                'Kamerun',
  'DR Congo':                'DR Konga',
  'Congo DR':                'DR Konga',
  'Democratic Republic of Congo': 'DR Konga',
  'Mali':                    'Mali',
  'Egypt':                   'Egipt',
  'Ghana':                   'Ghana',
  'Tunisia':                 'Tunezja',
  'Algeria':                 'Algieria',
  'Panama':                  'Panama',
  'Jamaica':                 'Jamajka',
  'Honduras':                'Honduras',
  'Costa Rica':              'Kostaryka',
  'Trinidad and Tobago':     'Trynidad i Tobago',
  'Haiti':                   'Haiti',
  'New Zealand':             'Nowa Zelandia',
  'South Africa':            'RPA',
  'Curaçao':                 'Curacao',
  'Curacao':                 'Curacao',
  "Côte d'Ivoire":           'Wybrzeże Kości Słoniowej',
  'Ivory Coast':             'Wybrzeże Kości Słoniowej',
  'Cape Verde':              'Republika Zielonego Przylądka',
  'Cape Verde Islands':      'Republika Zielonego Przylądka',
  'Bosnia and Herzegovina':  'Bośnia i Hercegowina',
  'Bosnia & Herzegovina':    'Bośnia i Hercegowina',
  'Bosnia-Herzegovina':      'Bośnia i Hercegowina',
};

const FLAG_BASE = '/flags';
const FLAG_MAP = {
  'Meksyk': 'mx', 'USA': 'us', 'Kanada': 'ca', 'Argentyna': 'ar', 'Brazylia': 'br',
  'Kolumbia': 'co', 'Ekwador': 'ec', 'Urugwaj': 'uy', 'Paragwaj': 'py', 'Niemcy': 'de',
  'Francja': 'fr', 'Hiszpania': 'es', 'Anglia': 'gb-eng', 'Portugalia': 'pt', 'Holandia': 'nl',
  'Belgia': 'be', 'Szwajcaria': 'ch', 'Chorwacja': 'hr', 'Austria': 'at', 'Szkocja': 'gb-sct',
  'Turcja': 'tr', 'Czechy': 'cz', 'Polska': 'pl', 'Szwecja': 'se', 'Norwegia': 'no',
  'Japonia': 'jp', 'Korea Południowa': 'kr', 'Australia': 'au', 'Iran': 'ir',
  'Arabia Saudyjska': 'sa', 'Jordania': 'jo', 'Irak': 'iq', 'Uzbekistan': 'uz', 'Katar': 'qa',
  'Maroko': 'ma', 'Senegal': 'sn', 'Nigeria': 'ng', 'Egipt': 'eg', 'Ghana': 'gh',
  'Tunezja': 'tn', 'Algieria': 'dz', 'DR Konga': 'cd',
  'Panama': 'pa', 'Jamajka': 'jm', 'Honduras': 'hn', 'Haiti': 'ht',
  'Trynidad i Tobago': 'tt', 'Nowa Zelandia': 'nz', 'RPA': 'za',
  'Curacao': 'cw', 'Wybrzeże Kości Słoniowej': 'ci', 'Republika Zielonego Przylądka': 'cv',
  'Bośnia i Hercegowina': 'ba',
};

function toPlName(engName) {
  return EN_TO_PL[engName] || engName;
}

function toFlag(plName) {
  const code = FLAG_MAP[plName];
  return code ? `${FLAG_BASE}/${code}.png` : null;
}

// Dopasowanie meczu API do meczu w bazie po drużynach + dacie (±1 dzień tolerancji)
function matchDbRow(dbMatches, homeEng, awayEng) {
  const homePl = toPlName(homeEng);
  const awayPl = toPlName(awayEng);
  return dbMatches.find(m =>
    m.home_team === homePl && m.away_team === awayPl
  ) || dbMatches.find(m =>
    // fallback: odwrócona kolejność (API może zwrócić inaczej)
    m.home_team === awayPl && m.away_team === homePl
  );
}

async function fetchTodayMatches() {
  const LIVE_KEY = process.env.APISPORTS_KEY;
  if (!LIVE_KEY) return [];
  const today = new Date().toISOString().slice(0, 10);
  const resp = await axios.get(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
    headers: { 'x-apisports-key': LIVE_KEY },
  });
  // Filtruj tylko MŚ (league.id === 1)
  return (resp.data.response || []).filter(m => m.league.id === 1);
}

// 1. Aktualizuje wyniki zakończonych meczów i przelicza punkty (api-football)
async function syncFinishedMatches(todayMatches, dbMatches) {
  const finished = todayMatches.filter(m => m.fixture.status.short === 'FT' || m.fixture.status.short === 'AET' || m.fixture.status.short === 'PEN');
  let updated = 0;

  for (const m of finished) {
    const isKnockout = !m.league.round.includes('Group');
    const hasExtraTime = m.score.extratime?.home != null;
    const hs = (isKnockout && hasExtraTime) ? m.score.extratime.home : m.score.fulltime.home;
    const as_ = (isKnockout && hasExtraTime) ? m.score.extratime.away : m.score.fulltime.away;
    if (hs === null || hs === undefined) continue;

    const pen = m.score.penalty?.home != null;

    const dbRow = matchDbRow(dbMatches, m.teams.home.name, m.teams.away.name);
    if (!dbRow) {
      console.log(`  [WARN] Nie znaleziono w bazie: ${m.teams.home.name} vs ${m.teams.away.name}`);
      continue;
    }

    // Zawsze aktualizuj jeśli wynik się różni (naprawia błędne dane)
    if (dbRow.status === 'finished' && dbRow.home_score === hs && dbRow.away_score === as_) continue;

    await db('matches').where({ id: dbRow.id }).update({
      home_score: hs,
      away_score: as_,
      ended_with_penalties: pen ? 1 : 0,
      status: 'finished',
      live_home: null,
      live_away: null,
      live_minute: null,
    });

    const updatedMatch = await db('matches').where({ id: dbRow.id }).first();
    const predictions = await db('predictions').where({ match_id: dbRow.id });
    for (const pred of predictions) {
      const { points } = calculatePoints(updatedMatch, pred);
      await db('predictions').where({ id: pred.id }).update({ points });
    }

    const homePl = toPlName(m.teams.home.name);
    const awayPl = toPlName(m.teams.away.name);
    console.log(`  ✓ ${homePl} ${hs}:${as_} ${awayPl}${pen ? ' (k)' : ''}`);
    updated++;
  }
  return updated;
}

// 2. Uzupełnia drużyny TBD w fazie pucharowej (api-football, tylko dzisiejsze mecze)
async function syncKnockoutTeams(todayMatches, dbMatches) {
  const knockout = todayMatches.filter(m =>
    !m.league.round.includes('Group') &&
    m.teams.home.name && m.teams.away.name &&
    m.teams.home.name !== 'TBD' && m.teams.away.name !== 'TBD'
  );

  let updated = 0;
  for (const m of knockout) {
    const homePl = toPlName(m.teams.home.name);
    const awayPl = toPlName(m.teams.away.name);
    const apiDate = m.fixture.date.slice(0, 10);

    const dbRow = dbMatches.find(d =>
      d.home_team === 'TBD' && d.away_team === 'TBD' &&
      d.match_date === apiDate && d.status !== 'finished'
    );
    if (!dbRow) continue;

    await db('matches').where({ id: dbRow.id }).update({
      home_team: homePl,
      away_team: awayPl,
      home_flag: toFlag(homePl),
      away_flag: toFlag(awayPl),
    });
    console.log(`  ✓ Uzupełniono bracket: ${homePl} vs ${awayPl} (${apiDate})`);
    updated++;
  }
  return updated;
}

// 3. Aktualizuje wyniki na żywo używając api-football (ma prawdziwe live z minutą)
async function syncLiveMatches(dbMatches) {
  const LIVE_KEY = process.env.APISPORTS_KEY;
  if (!LIVE_KEY) return 0;

  const resp = await axios.get('https://v3.football.api-sports.io/fixtures?live=all', {
    headers: { 'x-apisports-key': LIVE_KEY },
  });

  const live = resp.data.response || [];

  const liveIds = new Set();

  for (const m of live) {
    const homeEng = m.teams.home.name;
    const awayEng = m.teams.away.name;
    const hs = m.goals.home ?? 0;
    const as_ = m.goals.away ?? 0;
    const minute = m.fixture.status.elapsed;

    const dbRow = matchDbRow(dbMatches, homeEng, awayEng);
    if (!dbRow || dbRow.status === 'finished') continue;

    liveIds.add(dbRow.id);

    if (dbRow.status !== 'in_play' || dbRow.live_home !== hs || dbRow.live_away !== as_ || dbRow.live_minute !== minute) {
      await db('matches').where({ id: dbRow.id }).update({
        status: 'in_play',
        live_home: hs,
        live_away: as_,
        live_minute: minute,
      });
    }
  }

  // Wyczyść live dla meczów które przestały być na żywo
  const staleLive = dbMatches.filter(m => m.status === 'in_play' && !liveIds.has(m.id));
  for (const m of staleLive) {
    await db('matches').where({ id: m.id }).update({ status: 'scheduled', live_home: null, live_away: null, live_minute: null });
  }

  return live.length;
}

async function sync() {
  if (!API_KEY) { console.error('Brak FOOTBALL_API_KEY'); return; }

  console.log(`[${new Date().toLocaleTimeString('pl-PL')}] Synchronizacja wyników...`);

  try {
    const [todayMatches, dbMatches] = await Promise.all([
      fetchTodayMatches(),
      db('matches').select('*'),
    ]);

    const liveCount = await syncLiveMatches(dbMatches);
    const r1 = await syncFinishedMatches(todayMatches, dbMatches);
    const r2 = await syncKnockoutTeams(todayMatches, dbMatches);

    if (liveCount > 0) console.log(`  🔴 Na żywo: ${liveCount} meczów`);
    if (r1 === 0 && r2 === 0 && liveCount === 0) console.log('  Brak nowych danych.');
    else if (r1 > 0 || r2 > 0) console.log(`  Wyniki: ${r1} zaktualizowanych, bracket: ${r2} uzupełnionych.`);

    return liveCount > 0;

  } catch (e) {
    if (e.response?.status === 429) {
      console.error('  [WARN] Rate limit API (429) – poczekaj chwilę.');
    } else {
      console.error('  [ERROR]', e.message);
    }
    return false;
  }
}

module.exports = { sync };

// Uruchomienie ręczne
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
  initSchema().then(() => sync()).then(() => db.destroy());
}
