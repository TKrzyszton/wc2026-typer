/**
 * FULL RESEED – usuwa wszystkie mecze i typy, ładuje poprawny terminarz z TVP Sport
 * (godziny w czasie polskim CEST)
 * node scripts/reseedMatches.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { db, initSchema } = require('../db/database');

const FLAG_BASE = 'https://flagcdn.com/w40';
const FLAG_MAP = {
  'Meksyk': 'mx', 'USA': 'us', 'Kanada': 'ca',
  'Argentyna': 'ar', 'Brazylia': 'br', 'Kolumbia': 'co', 'Ekwador': 'ec',
  'Urugwaj': 'uy', 'Chile': 'cl', 'Peru': 'pe', 'Wenezuela': 've', 'Paragwaj': 'py',
  'Niemcy': 'de', 'Francja': 'fr', 'Hiszpania': 'es', 'Anglia': 'gb-eng',
  'Portugalia': 'pt', 'Holandia': 'nl', 'Belgia': 'be', 'Włochy': 'it',
  'Szwajcaria': 'ch', 'Chorwacja': 'hr', 'Dania': 'dk', 'Austria': 'at',
  'Szkocja': 'gb-sct', 'Węgry': 'hu', 'Turcja': 'tr', 'Czechy': 'cz',
  'Polska': 'pl', 'Rumunia': 'ro', 'Serbia': 'rs', 'Ukraina': 'ua',
  'Szwecja': 'se', 'Norwegia': 'no',
  'Japonia': 'jp', 'Korea Południowa': 'kr', 'Australia': 'au', 'Iran': 'ir',
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
  'Wybrzeże Kości Słoniowej': 'ci',
  'Republika Zielonego Przylądka': 'cv',
  'Bośnia i Hercegowina': 'ba',
};

function flag(team) {
  const code = FLAG_MAP[team];
  return code ? `${FLAG_BASE}/${code}.png` : null;
}

// Godziny w czasie polskim (CEST = UTC+2)
const GROUP_MATCHES = [
  // ─── 11 CZERWCA ───
  { h: 'Meksyk',    a: 'RPA',                   t: '21:00', d: '2026-06-11', g: 'A', v: 'Mexico City' },
  // ─── 12 CZERWCA ───
  { h: 'Korea Południowa', a: 'Czechy',          t: '04:00', d: '2026-06-12', g: 'A', v: 'Guadalajara' },
  { h: 'Kanada',    a: 'Bośnia i Hercegowina',   t: '21:00', d: '2026-06-12', g: 'B', v: 'Toronto' },
  // ─── 13 CZERWCA ───
  { h: 'USA',       a: 'Paragwaj',               t: '03:00', d: '2026-06-13', g: 'D', v: 'Los Angeles' },
  { h: 'Katar',     a: 'Szwajcaria',             t: '21:00', d: '2026-06-13', g: 'B', v: 'Santa Clara' },
  // ─── 14 CZERWCA ───
  { h: 'Brazylia',  a: 'Maroko',                 t: '00:00', d: '2026-06-14', g: 'C', v: 'New Jersey' },
  { h: 'Haiti',     a: 'Szkocja',                t: '03:00', d: '2026-06-14', g: 'C', v: 'Boston' },
  { h: 'Australia', a: 'Turcja',                 t: '06:00', d: '2026-06-14', g: 'D', v: 'Vancouver' },
  { h: 'Niemcy',    a: 'Curacao',                t: '19:00', d: '2026-06-14', g: 'E', v: 'Houston' },
  { h: 'Holandia',  a: 'Japonia',                t: '22:00', d: '2026-06-14', g: 'F', v: 'Dallas' },
  // ─── 15 CZERWCA ───
  { h: 'Wybrzeże Kości Słoniowej', a: 'Ekwador', t: '01:00', d: '2026-06-15', g: 'E', v: 'Filadelfia' },
  { h: 'Szwecja',   a: 'Tunezja',               t: '04:00', d: '2026-06-15', g: 'F', v: 'Monterrey' },
  { h: 'Hiszpania', a: 'Republika Zielonego Przylądka', t: '18:00', d: '2026-06-15', g: 'H', v: 'Atlanta' },
  { h: 'Belgia',    a: 'Egipt',                  t: '21:00', d: '2026-06-15', g: 'G', v: 'Seattle' },
  // ─── 16 CZERWCA ───
  { h: 'Arabia Saudyjska', a: 'Urugwaj',         t: '00:00', d: '2026-06-16', g: 'H', v: 'Miami' },
  { h: 'Iran',      a: 'Nowa Zelandia',           t: '03:00', d: '2026-06-16', g: 'G', v: 'Los Angeles' },
  { h: 'Francja',   a: 'Senegal',                t: '21:00', d: '2026-06-16', g: 'I', v: 'New Jersey' },
  // ─── 17 CZERWCA ───
  { h: 'Irak',      a: 'Norwegia',               t: '00:00', d: '2026-06-17', g: 'I', v: 'Boston' },
  { h: 'Argentyna', a: 'Algieria',               t: '03:00', d: '2026-06-17', g: 'J', v: 'Kansas City' },
  { h: 'Austria',   a: 'Jordania',               t: '06:00', d: '2026-06-17', g: 'J', v: 'Santa Clara' },
  { h: 'Portugalia', a: 'DR Konga',              t: '19:00', d: '2026-06-17', g: 'K', v: 'Houston' },
  { h: 'Anglia',    a: 'Chorwacja',              t: '22:00', d: '2026-06-17', g: 'L', v: 'Dallas' },
  // ─── 18 CZERWCA ───
  { h: 'Ghana',     a: 'Panama',                 t: '01:00', d: '2026-06-18', g: 'L', v: 'Boston' },
  { h: 'Uzbekistan', a: 'Kolumbia',              t: '04:00', d: '2026-06-18', g: 'K', v: 'Mexico City' },
  { h: 'Czechy',    a: 'RPA',                    t: '18:00', d: '2026-06-18', g: 'A', v: 'Atlanta' },
  { h: 'Szwajcaria', a: 'Bośnia i Hercegowina',  t: '21:00', d: '2026-06-18', g: 'B', v: 'Los Angeles' },
  // ─── 19 CZERWCA ───
  { h: 'Kanada',    a: 'Katar',                  t: '00:00', d: '2026-06-19', g: 'B', v: 'Vancouver' },
  { h: 'Meksyk',    a: 'Korea Południowa',        t: '03:00', d: '2026-06-19', g: 'A', v: 'Guadalajara' },
  { h: 'USA',       a: 'Australia',              t: '21:00', d: '2026-06-19', g: 'D', v: 'Seattle' },
  // ─── 20 CZERWCA ───
  { h: 'Szkocja',   a: 'Maroko',                 t: '00:00', d: '2026-06-20', g: 'C', v: 'Boston' },
  { h: 'Brazylia',  a: 'Haiti',                  t: '03:00', d: '2026-06-20', g: 'C', v: 'Filadelfia' },
  { h: 'Turcja',    a: 'Paragwaj',               t: '05:00', d: '2026-06-20', g: 'D', v: 'Santa Clara' },
  { h: 'Holandia',  a: 'Szwecja',                t: '19:00', d: '2026-06-20', g: 'F', v: 'Houston' },
  { h: 'Niemcy',    a: 'Wybrzeże Kości Słoniowej', t: '22:00', d: '2026-06-20', g: 'E', v: 'Toronto' },
  // ─── 21 CZERWCA ───
  { h: 'Ekwador',   a: 'Curacao',                t: '02:00', d: '2026-06-21', g: 'E', v: 'Kansas City' },
  { h: 'Tunezja',   a: 'Japonia',                t: '06:00', d: '2026-06-21', g: 'F', v: 'Monterrey' },
  { h: 'Hiszpania', a: 'Arabia Saudyjska',        t: '18:00', d: '2026-06-21', g: 'H', v: 'Atlanta' },
  { h: 'Belgia',    a: 'Iran',                   t: '21:00', d: '2026-06-21', g: 'G', v: 'Los Angeles' },
  // ─── 22 CZERWCA ───
  { h: 'Urugwaj',   a: 'Republika Zielonego Przylądka', t: '00:00', d: '2026-06-22', g: 'H', v: 'Miami' },
  { h: 'Nowa Zelandia', a: 'Egipt',              t: '03:00', d: '2026-06-22', g: 'G', v: 'Vancouver' },
  { h: 'Argentyna', a: 'Austria',                t: '19:00', d: '2026-06-22', g: 'J', v: 'Dallas' },
  { h: 'Francja',   a: 'Irak',                   t: '23:00', d: '2026-06-22', g: 'I', v: 'Filadelfia' },
  // ─── 23 CZERWCA ───
  { h: 'Norwegia',  a: 'Senegal',                t: '02:00', d: '2026-06-23', g: 'I', v: 'New Jersey' },
  { h: 'Jordania',  a: 'Algieria',               t: '05:00', d: '2026-06-23', g: 'J', v: 'Santa Clara' },
  { h: 'Portugalia', a: 'Uzbekistan',             t: '19:00', d: '2026-06-23', g: 'K', v: 'Houston' },
  { h: 'Anglia',    a: 'Ghana',                  t: '22:00', d: '2026-06-23', g: 'L', v: 'Boston' },
  // ─── 24 CZERWCA ───
  { h: 'Panama',    a: 'Chorwacja',              t: '01:00', d: '2026-06-24', g: 'L', v: 'Toronto' },
  { h: 'Kolumbia',  a: 'DR Konga',               t: '04:00', d: '2026-06-24', g: 'K', v: 'Guadalajara' },
  { h: 'Szwajcaria', a: 'Kanada',                t: '21:00', d: '2026-06-24', g: 'B', v: 'Vancouver' },
  { h: 'Bośnia i Hercegowina', a: 'Katar',       t: '21:00', d: '2026-06-24', g: 'B', v: 'Seattle' },
  // ─── 25 CZERWCA ───
  { h: 'Maroko',    a: 'Haiti',                  t: '00:00', d: '2026-06-25', g: 'C', v: 'Atlanta' },
  { h: 'Szkocja',   a: 'Brazylia',               t: '00:00', d: '2026-06-25', g: 'C', v: 'Miami' },
  { h: 'RPA',       a: 'Korea Południowa',        t: '03:00', d: '2026-06-25', g: 'A', v: 'Monterrey' },
  { h: 'Czechy',    a: 'Meksyk',                 t: '03:00', d: '2026-06-25', g: 'A', v: 'Mexico City' },
  { h: 'Curacao',   a: 'Wybrzeże Kości Słoniowej', t: '22:00', d: '2026-06-25', g: 'E', v: 'Filadelfia' },
  { h: 'Ekwador',   a: 'Niemcy',                 t: '22:00', d: '2026-06-25', g: 'E', v: 'New Jersey' },
  // ─── 26 CZERWCA ───
  { h: 'Japonia',   a: 'Szwecja',                t: '01:00', d: '2026-06-26', g: 'F', v: 'Dallas' },
  { h: 'Tunezja',   a: 'Holandia',               t: '01:00', d: '2026-06-26', g: 'F', v: 'Kansas City' },
  { h: 'Paragwaj',  a: 'Australia',              t: '04:00', d: '2026-06-26', g: 'D', v: 'Santa Clara' },
  { h: 'Turcja',    a: 'USA',                    t: '04:00', d: '2026-06-26', g: 'D', v: 'Los Angeles' },
  { h: 'Norwegia',  a: 'Francja',                t: '21:00', d: '2026-06-26', g: 'I', v: 'Boston' },
  { h: 'Senegal',   a: 'Irak',                   t: '21:00', d: '2026-06-26', g: 'I', v: 'Toronto' },
  // ─── 27 CZERWCA ───
  { h: 'Republika Zielonego Przylądka', a: 'Arabia Saudyjska', t: '02:00', d: '2026-06-27', g: 'H', v: 'Houston' },
  { h: 'Urugwaj',   a: 'Hiszpania',              t: '02:00', d: '2026-06-27', g: 'H', v: 'Guadalajara' },
  { h: 'Egipt',     a: 'Iran',                   t: '05:00', d: '2026-06-27', g: 'G', v: 'Seattle' },
  { h: 'Nowa Zelandia', a: 'Belgia',             t: '05:00', d: '2026-06-27', g: 'G', v: 'Vancouver' },
  { h: 'Chorwacja', a: 'Ghana',                  t: '23:00', d: '2026-06-27', g: 'L', v: 'Filadelfia' },
  { h: 'Panama',    a: 'Anglia',                 t: '23:00', d: '2026-06-27', g: 'L', v: 'New Jersey' },
  // ─── 28 CZERWCA ───
  { h: 'DR Konga',  a: 'Uzbekistan',             t: '01:30', d: '2026-06-28', g: 'K', v: 'Atlanta' },
  { h: 'Kolumbia',  a: 'Portugalia',             t: '01:30', d: '2026-06-28', g: 'K', v: 'Miami' },
  { h: 'Algieria',  a: 'Austria',                t: '04:00', d: '2026-06-28', g: 'J', v: 'Kansas City' },
  { h: 'Jordania',  a: 'Argentyna',              t: '04:00', d: '2026-06-28', g: 'J', v: 'Dallas' },
];

const KNOCKOUT_MATCHES = [
  // ─── 1/16 FINAŁU (Runda 32) ───
  { label: '1/16: 2A–2B',       d: '2026-06-28', t: '21:00', r: 'Runda 32', v: 'Los Angeles' },
  { label: '1/16: 1C–2F',       d: '2026-06-29', t: '19:00', r: 'Runda 32', v: 'Houston' },
  { label: '1/16: 1E–3ABCDF',   d: '2026-06-29', t: '22:30', r: 'Runda 32', v: 'Boston' },
  { label: '1/16: 1F–2C',       d: '2026-06-30', t: '03:00', r: 'Runda 32', v: 'Monterrey' },
  { label: '1/16: 2E–2I',       d: '2026-06-30', t: '19:00', r: 'Runda 32', v: 'Dallas' },
  { label: '1/16: 1I–3CDFGH',   d: '2026-06-30', t: '23:00', r: 'Runda 32', v: 'New Jersey' },
  { label: '1/16: 1A–3CEFHI',   d: '2026-07-01', t: '03:00', r: 'Runda 32', v: 'Mexico City' },
  { label: '1/16: 1L–3EHIJK',   d: '2026-07-01', t: '18:00', r: 'Runda 32', v: 'Atlanta' },
  { label: '1/16: 1G–3AEHIJ',   d: '2026-07-01', t: '22:00', r: 'Runda 32', v: 'Seattle' },
  { label: '1/16: 1D–3BEFIJ',   d: '2026-07-02', t: '02:00', r: 'Runda 32', v: 'Santa Clara' },
  { label: '1/16: 1H–2J',       d: '2026-07-02', t: '21:00', r: 'Runda 32', v: 'Los Angeles' },
  { label: '1/16: 2K–2L',       d: '2026-07-03', t: '01:00', r: 'Runda 32', v: 'Toronto' },
  { label: '1/16: 1B–3EFGIJ',   d: '2026-07-03', t: '05:00', r: 'Runda 32', v: 'Vancouver' },
  { label: '1/16: 2D–2G',       d: '2026-07-03', t: '20:00', r: 'Runda 32', v: 'Arlington' },
  { label: '1/16: 1J–2H',       d: '2026-07-04', t: '00:00', r: 'Runda 32', v: 'Miami' },
  { label: '1/16: 1K–3DEIJL',   d: '2026-07-04', t: '03:30', r: 'Runda 32', v: 'Kansas City' },
  // ─── 1/8 FINAŁU ───
  { label: '1/8 (#2)',           d: '2026-07-04', t: '19:00', r: '1/8 Finału', v: 'Houston' },
  { label: '1/8 (#1)',           d: '2026-07-04', t: '23:00', r: '1/8 Finału', v: 'Filadelfia' },
  { label: '1/8 (#3)',           d: '2026-07-05', t: '22:00', r: '1/8 Finału', v: 'East Rutherford' },
  { label: '1/8 (#4)',           d: '2026-07-06', t: '02:00', r: '1/8 Finału', v: 'Mexico City' },
  { label: '1/8 (#5)',           d: '2026-07-06', t: '21:00', r: '1/8 Finału', v: 'Dallas' },
  { label: '1/8 (#6)',           d: '2026-07-07', t: '02:00', r: '1/8 Finału', v: 'Seattle' },
  { label: '1/8 (#7)',           d: '2026-07-07', t: '18:00', r: '1/8 Finału', v: 'Atlanta' },
  { label: '1/8 (#8)',           d: '2026-07-07', t: '22:00', r: '1/8 Finału', v: 'Vancouver' },
  // ─── ĆWIERĆFINAŁY ───
  { label: 'Ćwierćfinał (#1)',   d: '2026-07-09', t: '22:00', r: 'Ćwierćfinał', v: 'Boston' },
  { label: 'Ćwierćfinał (#2)',   d: '2026-07-10', t: '21:00', r: 'Ćwierćfinał', v: 'Los Angeles' },
  { label: 'Ćwierćfinał (#3)',   d: '2026-07-11', t: '23:00', r: 'Ćwierćfinał', v: 'Miami' },
  { label: 'Ćwierćfinał (#4)',   d: '2026-07-12', t: '03:00', r: 'Ćwierćfinał', v: 'Kansas City' },
  // ─── PÓŁFINAŁY ───
  { label: 'Półfinał 1',         d: '2026-07-14', t: '21:00', r: 'Półfinał', v: 'Dallas' },
  { label: 'Półfinał 2',         d: '2026-07-15', t: '21:00', r: 'Półfinał', v: 'Atlanta' },
  // ─── MECZ O 3. MIEJSCE ───
  { label: 'Mecz o 3. miejsce',  d: '2026-07-18', t: '23:00', r: 'Mecz o 3. miejsce', v: 'Miami' },
  // ─── FINAŁ ───
  { label: 'FINAŁ',              d: '2026-07-19', t: '21:00', r: 'Finał', v: 'New Jersey' },
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
  console.log(`\n✓ Załadowano ${total.c} meczów (godziny w czasie polskim CEST).`);
  await db.destroy();
}

reseed().catch(e => { console.error(e); process.exit(1); });
