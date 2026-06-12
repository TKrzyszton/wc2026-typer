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
  'Bosnia and Herzegovina':  'Bośnia i Hercegowina',
  'Bosnia & Herzegovina':    'Bośnia i Hercegowina',
  'Bosnia-Herzegovina':      'Bośnia i Hercegowina',
};

const FLAG_BASE = 'https://flagcdn.com/w40';
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

async function fetchAllMatches() {
  const resp = await axios.get(`${BASE_URL}/competitions/WC/matches`, {
    headers: { 'X-Auth-Token': API_KEY },
    params: { season: 2026 },
  });
  return resp.data.matches || [];
}

// 1. Aktualizuje wyniki zakończonych meczów i przelicza punkty
async function syncFinishedMatches(apiMatches, dbMatches) {
  const finished = apiMatches.filter(m => m.status === 'FINISHED');
  let updated = 0;

  for (const m of finished) {
    // Dla fazy pucharowej używamy wyniku po 120 min (extraTime), dla grupowej po 90 min (fullTime)
    const isKnockout = m.stage !== 'GROUP_STAGE';
    const hasExtraTime = m.score.extraTime?.home !== null && m.score.extraTime?.home !== undefined;
    const hs = (isKnockout && hasExtraTime) ? m.score.extraTime.home : m.score.fullTime.home;
    const as_ = (isKnockout && hasExtraTime) ? m.score.extraTime.away : m.score.fullTime.away;
    if (hs === null || as_ === null) continue;

    // Sprawdź czy mecz zakończył się rzutami karnymi
    const pen = m.score.penalties != null &&
      (m.score.penalties.home !== null || m.score.penalties.away !== null);

    const dbRow = matchDbRow(dbMatches, m.homeTeam.name, m.awayTeam.name);
    if (!dbRow) {
      console.log(`  [WARN] Nie znaleziono w bazie: ${m.homeTeam.name} vs ${m.awayTeam.name}`);
      continue;
    }
    if (dbRow.status === 'finished') continue; // już zaktualizowany

    await db('matches').where({ id: dbRow.id }).update({
      home_score: hs,
      away_score: as_,
      ended_with_penalties: pen ? 1 : 0,
      status: 'finished',
    });

    // Przelicz punkty wszystkich typerów
    const updatedMatch = await db('matches').where({ id: dbRow.id }).first();
    const predictions = await db('predictions').where({ match_id: dbRow.id });
    for (const pred of predictions) {
      const { points } = calculatePoints(updatedMatch, pred);
      await db('predictions').where({ id: pred.id }).update({ points });
    }

    console.log(`  ✓ ${toPlName(m.homeTeam.name)} ${hs}:${as_} ${toPlName(m.awayTeam.name)}${pen ? ' (k)' : ''}`);
    updated++;
  }
  return updated;
}

// 2. Uzupełnia drużyny TBD w fazie pucharowej
async function syncKnockoutTeams(apiMatches, dbMatches) {
  // Mecze fazy pucharowej z API które mają już znane drużyny (nie są TBD)
  const knockout = apiMatches.filter(m =>
    m.stage !== 'GROUP_STAGE' &&
    m.homeTeam?.name && m.awayTeam?.name &&
    m.homeTeam.name !== 'TBD' && m.awayTeam.name !== 'TBD'
  );

  let updated = 0;
  for (const m of knockout) {
    const homePl = toPlName(m.homeTeam.name);
    const awayPl = toPlName(m.awayTeam.name);

    // Znajdź TBD mecz po dacie i rundzie
    const apiDate = m.utcDate.slice(0, 10);
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

async function sync() {
  if (!API_KEY) { console.error('Brak FOOTBALL_API_KEY'); return; }

  console.log(`[${new Date().toLocaleTimeString('pl-PL')}] Synchronizacja wyników...`);

  try {
    const [apiMatches, dbMatches] = await Promise.all([
      fetchAllMatches(),
      db('matches').select('*'),
    ]);

    console.log(`  API: ${apiMatches.length} meczów, baza: ${dbMatches.length} meczów`);

    const r1 = await syncFinishedMatches(apiMatches, dbMatches);
    const r2 = await syncKnockoutTeams(apiMatches, dbMatches);

    if (r1 === 0 && r2 === 0) console.log('  Brak nowych danych.');
    else console.log(`  Wyniki: ${r1} zaktualizowanych, bracket: ${r2} uzupełnionych.`);

  } catch (e) {
    if (e.response?.status === 429) {
      console.error('  [WARN] Rate limit API (429) – poczekaj chwilę.');
    } else {
      console.error('  [ERROR]', e.message);
    }
  }
}

module.exports = { sync };

// Uruchomienie ręczne
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
  initSchema().then(() => sync()).then(() => db.destroy());
}
