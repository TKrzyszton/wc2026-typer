/**
 * FULL RESEED â€“ usuwa wszystkie mecze i typy, Ĺ‚aduje poprawny terminarz z TVP Sport
 * (godziny w czasie polskim CEST)
 * node scripts/reseedMatches.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { db, initSchema } = require('../db/database');

const FLAG_BASE = '/flags';
const FLAG_MAP = {
  'Meksyk': 'mx', 'USA': 'us', 'Kanada': 'ca',
  'Argentyna': 'ar', 'Brazylia': 'br', 'Kolumbia': 'co', 'Ekwador': 'ec',
  'Urugwaj': 'uy', 'Chile': 'cl', 'Peru': 'pe', 'Wenezuela': 've', 'Paragwaj': 'py',
  'Niemcy': 'de', 'Francja': 'fr', 'Hiszpania': 'es', 'Anglia': 'gb-eng',
  'Portugalia': 'pt', 'Holandia': 'nl', 'Belgia': 'be', 'WĹ‚ochy': 'it',
  'Szwajcaria': 'ch', 'Chorwacja': 'hr', 'Dania': 'dk', 'Austria': 'at',
  'Szkocja': 'gb-sct', 'WÄ™gry': 'hu', 'Turcja': 'tr', 'Czechy': 'cz',
  'Polska': 'pl', 'Rumunia': 'ro', 'Serbia': 'rs', 'Ukraina': 'ua',
  'Szwecja': 'se', 'Norwegia': 'no',
  'Japonia': 'jp', 'Korea PoĹ‚udniowa': 'kr', 'Australia': 'au', 'Iran': 'ir',
  'Arabia Saudyjska': 'sa', 'Jordania': 'jo', 'Irak': 'iq', 'Uzbekistan': 'uz',
  'Katar': 'qa',
  'Maroko': 'ma', 'Senegal': 'sn', 'Nigeria': 'ng', 'Kamerun': 'cm',
  'DR Konga': 'cd', 'Mali': 'ml', 'Egipt': 'eg', 'Ghana': 'gh', 'Tunezja': 'tn',
  'Algieria': 'dz',
  'Panama': 'pa', 'Jamajka': 'jm', 'Honduras': 'hn', 'Kostaryka': 'cr',
  'Trynidad i Tobago': 'tt', 'Haiti': 'ht',
  'Nowa Zelandia': 'nz',
  'RPA': 'za',
  'Curacao': 'cw',
  'WybrzeĹĽe KoĹ›ci SĹ‚oniowej': 'ci',
  'Republika Zielonego PrzylÄ…dka': 'cv',
  'BoĹ›nia i Hercegowina': 'ba',
};

function flag(team) {
  const code = FLAG_MAP[team];
  return code ? `${FLAG_BASE}/${code}.png` : null;
}

// Godziny w czasie polskim (CEST = UTC+2)
const GROUP_MATCHES = [
  // â”€â”€â”€ 11 CZERWCA â”€â”€â”€
  { h: 'Meksyk',    a: 'RPA',                   t: '21:00', d: '2026-06-11', g: 'A', v: 'Mexico City' },
  // â”€â”€â”€ 12 CZERWCA â”€â”€â”€
  { h: 'Korea PoĹ‚udniowa', a: 'Czechy',          t: '04:00', d: '2026-06-12', g: 'A', v: 'Guadalajara' },
  { h: 'Kanada',    a: 'BoĹ›nia i Hercegowina',   t: '21:00', d: '2026-06-12', g: 'B', v: 'Toronto' },
  // â”€â”€â”€ 13 CZERWCA â”€â”€â”€
  { h: 'USA',       a: 'Paragwaj',               t: '03:00', d: '2026-06-13', g: 'D', v: 'Los Angeles' },
  { h: 'Katar',     a: 'Szwajcaria',             t: '21:00', d: '2026-06-13', g: 'B', v: 'Santa Clara' },
  // â”€â”€â”€ 14 CZERWCA â”€â”€â”€
  { h: 'Brazylia',  a: 'Maroko',                 t: '00:00', d: '2026-06-14', g: 'C', v: 'New Jersey' },
  { h: 'Haiti',     a: 'Szkocja',                t: '03:00', d: '2026-06-14', g: 'C', v: 'Boston' },
  { h: 'Australia', a: 'Turcja',                 t: '06:00', d: '2026-06-14', g: 'D', v: 'Vancouver' },
  { h: 'Niemcy',    a: 'Curacao',                t: '19:00', d: '2026-06-14', g: 'E', v: 'Houston' },
  { h: 'Holandia',  a: 'Japonia',                t: '22:00', d: '2026-06-14', g: 'F', v: 'Dallas' },
  // â”€â”€â”€ 15 CZERWCA â”€â”€â”€
  { h: 'WybrzeĹĽe KoĹ›ci SĹ‚oniowej', a: 'Ekwador', t: '01:00', d: '2026-06-15', g: 'E', v: 'Filadelfia' },
  { h: 'Szwecja',   a: 'Tunezja',               t: '04:00', d: '2026-06-15', g: 'F', v: 'Monterrey' },
  { h: 'Hiszpania', a: 'Republika Zielonego PrzylÄ…dka', t: '18:00', d: '2026-06-15', g: 'H', v: 'Atlanta' },
  { h: 'Belgia',    a: 'Egipt',                  t: '21:00', d: '2026-06-15', g: 'G', v: 'Seattle' },
  // â”€â”€â”€ 16 CZERWCA â”€â”€â”€
  { h: 'Arabia Saudyjska', a: 'Urugwaj',         t: '00:00', d: '2026-06-16', g: 'H', v: 'Miami' },
  { h: 'Iran',      a: 'Nowa Zelandia',           t: '03:00', d: '2026-06-16', g: 'G', v: 'Los Angeles' },
  { h: 'Francja',   a: 'Senegal',                t: '21:00', d: '2026-06-16', g: 'I', v: 'New Jersey' },
  // â”€â”€â”€ 17 CZERWCA â”€â”€â”€
  { h: 'Irak',      a: 'Norwegia',               t: '00:00', d: '2026-06-17', g: 'I', v: 'Boston' },
  { h: 'Argentyna', a: 'Algieria',               t: '03:00', d: '2026-06-17', g: 'J', v: 'Kansas City' },
  { h: 'Austria',   a: 'Jordania',               t: '06:00', d: '2026-06-17', g: 'J', v: 'Santa Clara' },
  { h: 'Portugalia', a: 'DR Konga',              t: '19:00', d: '2026-06-17', g: 'K', v: 'Houston' },
  { h: 'Anglia',    a: 'Chorwacja',              t: '22:00', d: '2026-06-17', g: 'L', v: 'Dallas' },
  // â”€â”€â”€ 18 CZERWCA â”€â”€â”€
  { h: 'Ghana',     a: 'Panama',                 t: '01:00', d: '2026-06-18', g: 'L', v: 'Boston' },
  { h: 'Uzbekistan', a: 'Kolumbia',              t: '04:00', d: '2026-06-18', g: 'K', v: 'Mexico City' },
  { h: 'Czechy',    a: 'RPA',                    t: '18:00', d: '2026-06-18', g: 'A', v: 'Atlanta' },
  { h: 'Szwajcaria', a: 'BoĹ›nia i Hercegowina',  t: '21:00', d: '2026-06-18', g: 'B', v: 'Los Angeles' },
  // â”€â”€â”€ 19 CZERWCA â”€â”€â”€
  { h: 'Kanada',    a: 'Katar',                  t: '00:00', d: '2026-06-19', g: 'B', v: 'Vancouver' },
  { h: 'Meksyk',    a: 'Korea PoĹ‚udniowa',        t: '03:00', d: '2026-06-19', g: 'A', v: 'Guadalajara' },
  { h: 'USA',       a: 'Australia',              t: '21:00', d: '2026-06-19', g: 'D', v: 'Seattle' },
  // â”€â”€â”€ 20 CZERWCA â”€â”€â”€
  { h: 'Szkocja',   a: 'Maroko',                 t: '00:00', d: '2026-06-20', g: 'C', v: 'Boston' },
  { h: 'Brazylia',  a: 'Haiti',                  t: '03:00', d: '2026-06-20', g: 'C', v: 'Filadelfia' },
  { h: 'Turcja',    a: 'Paragwaj',               t: '05:00', d: '2026-06-20', g: 'D', v: 'Santa Clara' },
  { h: 'Holandia',  a: 'Szwecja',                t: '19:00', d: '2026-06-20', g: 'F', v: 'Houston' },
  { h: 'Niemcy',    a: 'WybrzeĹĽe KoĹ›ci SĹ‚oniowej', t: '22:00', d: '2026-06-20', g: 'E', v: 'Toronto' },
  // â”€â”€â”€ 21 CZERWCA â”€â”€â”€
  { h: 'Ekwador',   a: 'Curacao',                t: '02:00', d: '2026-06-21', g: 'E', v: 'Kansas City' },
  { h: 'Tunezja',   a: 'Japonia',                t: '06:00', d: '2026-06-21', g: 'F', v: 'Monterrey' },
  { h: 'Hiszpania', a: 'Arabia Saudyjska',        t: '18:00', d: '2026-06-21', g: 'H', v: 'Atlanta' },
  { h: 'Belgia',    a: 'Iran',                   t: '21:00', d: '2026-06-21', g: 'G', v: 'Los Angeles' },
  // â”€â”€â”€ 22 CZERWCA â”€â”€â”€
  { h: 'Urugwaj',   a: 'Republika Zielonego PrzylÄ…dka', t: '00:00', d: '2026-06-22', g: 'H', v: 'Miami' },
  { h: 'Nowa Zelandia', a: 'Egipt',              t: '03:00', d: '2026-06-22', g: 'G', v: 'Vancouver' },
  { h: 'Argentyna', a: 'Austria',                t: '19:00', d: '2026-06-22', g: 'J', v: 'Dallas' },
  { h: 'Francja',   a: 'Irak',                   t: '23:00', d: '2026-06-22', g: 'I', v: 'Filadelfia' },
  // â”€â”€â”€ 23 CZERWCA â”€â”€â”€
  { h: 'Norwegia',  a: 'Senegal',                t: '02:00', d: '2026-06-23', g: 'I', v: 'New Jersey' },
  { h: 'Jordania',  a: 'Algieria',               t: '05:00', d: '2026-06-23', g: 'J', v: 'Santa Clara' },
  { h: 'Portugalia', a: 'Uzbekistan',             t: '19:00', d: '2026-06-23', g: 'K', v: 'Houston' },
  { h: 'Anglia',    a: 'Ghana',                  t: '22:00', d: '2026-06-23', g: 'L', v: 'Boston' },
  // â”€â”€â”€ 24 CZERWCA â”€â”€â”€
  { h: 'Panama',    a: 'Chorwacja',              t: '01:00', d: '2026-06-24', g: 'L', v: 'Toronto' },
  { h: 'Kolumbia',  a: 'DR Konga',               t: '04:00', d: '2026-06-24', g: 'K', v: 'Guadalajara' },
  { h: 'Szwajcaria', a: 'Kanada',                t: '21:00', d: '2026-06-24', g: 'B', v: 'Vancouver' },
  { h: 'BoĹ›nia i Hercegowina', a: 'Katar',       t: '21:00', d: '2026-06-24', g: 'B', v: 'Seattle' },
  // â”€â”€â”€ 25 CZERWCA â”€â”€â”€
  { h: 'Maroko',    a: 'Haiti',                  t: '00:00', d: '2026-06-25', g: 'C', v: 'Atlanta' },
  { h: 'Szkocja',   a: 'Brazylia',               t: '00:00', d: '2026-06-25', g: 'C', v: 'Miami' },
  { h: 'RPA',       a: 'Korea PoĹ‚udniowa',        t: '03:00', d: '2026-06-25', g: 'A', v: 'Monterrey' },
  { h: 'Czechy',    a: 'Meksyk',                 t: '03:00', d: '2026-06-25', g: 'A', v: 'Mexico City' },
  { h: 'Curacao',   a: 'WybrzeĹĽe KoĹ›ci SĹ‚oniowej', t: '22:00', d: '2026-06-25', g: 'E', v: 'Filadelfia' },
  { h: 'Ekwador',   a: 'Niemcy',                 t: '22:00', d: '2026-06-25', g: 'E', v: 'New Jersey' },
  // â”€â”€â”€ 26 CZERWCA â”€â”€â”€
  { h: 'Japonia',   a: 'Szwecja',                t: '01:00', d: '2026-06-26', g: 'F', v: 'Dallas' },
  { h: 'Tunezja',   a: 'Holandia',               t: '01:00', d: '2026-06-26', g: 'F', v: 'Kansas City' },
  { h: 'Paragwaj',  a: 'Australia',              t: '04:00', d: '2026-06-26', g: 'D', v: 'Santa Clara' },
  { h: 'Turcja',    a: 'USA',                    t: '04:00', d: '2026-06-26', g: 'D', v: 'Los Angeles' },
  { h: 'Norwegia',  a: 'Francja',                t: '21:00', d: '2026-06-26', g: 'I', v: 'Boston' },
  { h: 'Senegal',   a: 'Irak',                   t: '21:00', d: '2026-06-26', g: 'I', v: 'Toronto' },
  // â”€â”€â”€ 27 CZERWCA â”€â”€â”€
  { h: 'Republika Zielonego PrzylÄ…dka', a: 'Arabia Saudyjska', t: '02:00', d: '2026-06-27', g: 'H', v: 'Houston' },
  { h: 'Urugwaj',   a: 'Hiszpania',              t: '02:00', d: '2026-06-27', g: 'H', v: 'Guadalajara' },
  { h: 'Egipt',     a: 'Iran',                   t: '05:00', d: '2026-06-27', g: 'G', v: 'Seattle' },
  { h: 'Nowa Zelandia', a: 'Belgia',             t: '05:00', d: '2026-06-27', g: 'G', v: 'Vancouver' },
  { h: 'Chorwacja', a: 'Ghana',                  t: '23:00', d: '2026-06-27', g: 'L', v: 'Filadelfia' },
  { h: 'Panama',    a: 'Anglia',                 t: '23:00', d: '2026-06-27', g: 'L', v: 'New Jersey' },
  // â”€â”€â”€ 28 CZERWCA â”€â”€â”€
  { h: 'DR Konga',  a: 'Uzbekistan',             t: '01:30', d: '2026-06-28', g: 'K', v: 'Atlanta' },
  { h: 'Kolumbia',  a: 'Portugalia',             t: '01:30', d: '2026-06-28', g: 'K', v: 'Miami' },
  { h: 'Algieria',  a: 'Austria',                t: '04:00', d: '2026-06-28', g: 'J', v: 'Kansas City' },
  { h: 'Jordania',  a: 'Argentyna',              t: '04:00', d: '2026-06-28', g: 'J', v: 'Dallas' },
];

const KNOCKOUT_MATCHES = [
  // â”€â”€â”€ 1/16 FINAĹU (Runda 32) â”€â”€â”€
  { label: '1/16: 2Aâ€“2B',       d: '2026-06-28', t: '21:00', r: 'Runda 32', v: 'Los Angeles' },
  { label: '1/16: 1Câ€“2F',       d: '2026-06-29', t: '19:00', r: 'Runda 32', v: 'Houston' },
  { label: '1/16: 1Eâ€“3ABCDF',   d: '2026-06-29', t: '22:30', r: 'Runda 32', v: 'Boston' },
  { label: '1/16: 1Fâ€“2C',       d: '2026-06-30', t: '03:00', r: 'Runda 32', v: 'Monterrey' },
  { label: '1/16: 2Eâ€“2I',       d: '2026-06-30', t: '19:00', r: 'Runda 32', v: 'Dallas' },
  { label: '1/16: 1Iâ€“3CDFGH',   d: '2026-06-30', t: '23:00', r: 'Runda 32', v: 'New Jersey' },
  { label: '1/16: 1Aâ€“3CEFHI',   d: '2026-07-01', t: '03:00', r: 'Runda 32', v: 'Mexico City' },
  { label: '1/16: 1Lâ€“3EHIJK',   d: '2026-07-01', t: '18:00', r: 'Runda 32', v: 'Atlanta' },
  { label: '1/16: 1Gâ€“3AEHIJ',   d: '2026-07-01', t: '22:00', r: 'Runda 32', v: 'Seattle' },
  { label: '1/16: 1Dâ€“3BEFIJ',   d: '2026-07-02', t: '02:00', r: 'Runda 32', v: 'Santa Clara' },
  { label: '1/16: 1Hâ€“2J',       d: '2026-07-02', t: '21:00', r: 'Runda 32', v: 'Los Angeles' },
  { label: '1/16: 2Kâ€“2L',       d: '2026-07-03', t: '01:00', r: 'Runda 32', v: 'Toronto' },
  { label: '1/16: 1Bâ€“3EFGIJ',   d: '2026-07-03', t: '05:00', r: 'Runda 32', v: 'Vancouver' },
  { label: '1/16: 2Dâ€“2G',       d: '2026-07-03', t: '20:00', r: 'Runda 32', v: 'Arlington' },
  { label: '1/16: 1Jâ€“2H',       d: '2026-07-04', t: '00:00', r: 'Runda 32', v: 'Miami' },
  { label: '1/16: 1Kâ€“3DEIJL',   d: '2026-07-04', t: '03:30', r: 'Runda 32', v: 'Kansas City' },
  // â”€â”€â”€ 1/8 FINAĹU â”€â”€â”€
  { label: '1/8 (#2)',           d: '2026-07-04', t: '19:00', r: '1/8 FinaĹ‚u', v: 'Houston' },
  { label: '1/8 (#1)',           d: '2026-07-04', t: '23:00', r: '1/8 FinaĹ‚u', v: 'Filadelfia' },
  { label: '1/8 (#3)',           d: '2026-07-05', t: '22:00', r: '1/8 FinaĹ‚u', v: 'East Rutherford' },
  { label: '1/8 (#4)',           d: '2026-07-06', t: '02:00', r: '1/8 FinaĹ‚u', v: 'Mexico City' },
  { label: '1/8 (#5)',           d: '2026-07-06', t: '21:00', r: '1/8 FinaĹ‚u', v: 'Dallas' },
  { label: '1/8 (#6)',           d: '2026-07-07', t: '02:00', r: '1/8 FinaĹ‚u', v: 'Seattle' },
  { label: '1/8 (#7)',           d: '2026-07-07', t: '18:00', r: '1/8 FinaĹ‚u', v: 'Atlanta' },
  { label: '1/8 (#8)',           d: '2026-07-07', t: '22:00', r: '1/8 FinaĹ‚u', v: 'Vancouver' },
  // â”€â”€â”€ Ä†WIERÄ†FINAĹY â”€â”€â”€
  { label: 'Ä†wierÄ‡finaĹ‚ (#1)',   d: '2026-07-09', t: '22:00', r: 'Ä†wierÄ‡finaĹ‚', v: 'Boston' },
  { label: 'Ä†wierÄ‡finaĹ‚ (#2)',   d: '2026-07-10', t: '21:00', r: 'Ä†wierÄ‡finaĹ‚', v: 'Los Angeles' },
  { label: 'Ä†wierÄ‡finaĹ‚ (#3)',   d: '2026-07-11', t: '23:00', r: 'Ä†wierÄ‡finaĹ‚', v: 'Miami' },
  { label: 'Ä†wierÄ‡finaĹ‚ (#4)',   d: '2026-07-12', t: '03:00', r: 'Ä†wierÄ‡finaĹ‚', v: 'Kansas City' },
  // â”€â”€â”€ PĂ“ĹFINAĹY â”€â”€â”€
  { label: 'PĂłĹ‚finaĹ‚ 1',         d: '2026-07-14', t: '21:00', r: 'PĂłĹ‚finaĹ‚', v: 'Dallas' },
  { label: 'PĂłĹ‚finaĹ‚ 2',         d: '2026-07-15', t: '21:00', r: 'PĂłĹ‚finaĹ‚', v: 'Atlanta' },
  // â”€â”€â”€ MECZ O 3. MIEJSCE â”€â”€â”€
  { label: 'Mecz o 3. miejsce',  d: '2026-07-18', t: '23:00', r: 'Mecz o 3. miejsce', v: 'Miami' },
  // â”€â”€â”€ FINAĹ â”€â”€â”€
  { label: 'FINAĹ',              d: '2026-07-19', t: '21:00', r: 'FinaĹ‚', v: 'New Jersey' },
];

async function reseed() {
  await initSchema();

  console.log('Usuwam stare typy i mecze...');
  await db('predictions').delete();
  await db('champion_predictions').delete();
  await db('matches').delete();

  console.log('Inserting group matches...');
  let order = 1;
  for (const m of GROUP_MATCHES) {
    await db('matches').insert({
      home_team: m.h, away_team: m.a,
      home_flag: flag(m.h), away_flag: flag(m.a),
      match_date: m.d, match_time: m.t,
      group_name: `Grupa ${m.g}`, round: 'Faza grupowa',
      venue: m.v, sort_order: order++,
    });
  }

  console.log('Inserting knockout matches...');
  for (const m of KNOCKOUT_MATCHES) {
    await db('matches').insert({
      home_team: 'TBD', away_team: 'TBD',
      home_flag: null, away_flag: null,
      match_date: m.d, match_time: m.t,
      group_name: null, round: m.r,
      venue: m.v, sort_order: order++,
    });
  }

  const total = await db('matches').count('id as c').first();
  console.log(`\nâś“ ZaĹ‚adowano ${total.c} meczĂłw (godziny w czasie polskim CEST).`);
  await db.destroy();
}

reseed().catch(e => { console.error(e); process.exit(1); });
