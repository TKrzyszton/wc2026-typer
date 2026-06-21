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
  'SĹ‚owacja': 'sk', 'Polska': 'pl', 'Rumunia': 'ro', 'Serbia': 'rs', 'Ukraina': 'ua',
  'Japonia': 'jp', 'Korea PoĹ‚udniowa': 'kr', 'Australia': 'au', 'Iran': 'ir',
  'Arabia Saudyjska': 'sa', 'Jordania': 'jo', 'Irak': 'iq', 'Uzbekistan': 'uz',
  'Maroko': 'ma', 'Senegal': 'sn', 'Nigeria': 'ng', 'Kamerun': 'cm',
  'DRK': 'cd', 'Mali': 'ml', 'Egipt': 'eg', 'Ghana': 'gh', 'Tunezja': 'tn',
  'Panama': 'pa', 'Jamajka': 'jm', 'Honduras': 'hn', 'Kostaryka': 'cr',
  'Salwador': 'sv', 'Gwatemala': 'gt', 'Haiti': 'ht', 'Trynidad i Tobago': 'tt',
  'Nowa Zelandia': 'nz',
};

function flag(team) {
  const code = FLAG_MAP[team];
  return code ? `${FLAG_BASE}/${code}.png` : null;
}

const GROUP_MATCHES = [
  // GROUP A
  { home: 'Meksyk',    away: 'Jamajka',   date: '2026-06-11', time: '20:00', group: 'A', venue: 'Mexico City' },
  { home: 'Honduras',  away: 'Kostaryka', date: '2026-06-11', time: '23:00', group: 'A', venue: 'Guadalajara' },
  { home: 'Meksyk',    away: 'Kostaryka', date: '2026-06-15', time: '22:00', group: 'A', venue: 'Monterrey' },
  { home: 'Jamajka',   away: 'Honduras',  date: '2026-06-15', time: '19:00', group: 'A', venue: 'Dallas' },
  { home: 'Kostaryka', away: 'Honduras',  date: '2026-06-19', time: '22:00', group: 'A', venue: 'Mexico City' },
  { home: 'Jamajka',   away: 'Meksyk',    date: '2026-06-19', time: '22:00', group: 'A', venue: 'Guadalajara' },
  // GROUP B
  { home: 'USA',       away: 'Panama',    date: '2026-06-12', time: '21:00', group: 'B', venue: 'Los Angeles' },
  { home: 'Urugwaj',   away: 'Ekwador',   date: '2026-06-12', time: '18:00', group: 'B', venue: 'New York' },
  { home: 'USA',       away: 'Ekwador',   date: '2026-06-16', time: '21:00', group: 'B', venue: 'Seattle' },
  { home: 'Panama',    away: 'Urugwaj',   date: '2026-06-16', time: '18:00', group: 'B', venue: 'Kansas City' },
  { home: 'Ekwador',   away: 'Panama',    date: '2026-06-20', time: '21:00', group: 'B', venue: 'Los Angeles' },
  { home: 'USA',       away: 'Urugwaj',   date: '2026-06-20', time: '21:00', group: 'B', venue: 'Dallas' },
  // GROUP C
  { home: 'Kanada',    away: 'Trynidad i Tobago', date: '2026-06-12', time: '20:00', group: 'C', venue: 'Toronto' },
  { home: 'Maroko',    away: 'TBD',       date: '2026-06-12', time: '23:00', group: 'C', venue: 'Vancouver' },
  { home: 'Kanada',    away: 'TBD',       date: '2026-06-16', time: '20:00', group: 'C', venue: 'Toronto' },
  { home: 'Maroko',    away: 'Trynidad i Tobago', date: '2026-06-16', time: '23:00', group: 'C', venue: 'Vancouver' },
  { home: 'TBD',       away: 'Trynidad i Tobago', date: '2026-06-20', time: '23:00', group: 'C', venue: 'Toronto' },
  { home: 'Kanada',    away: 'Maroko',    date: '2026-06-20', time: '23:00', group: 'C', venue: 'Vancouver' },
  // GROUP D
  { home: 'Brazylia',  away: 'Niemcy',    date: '2026-06-13', time: '21:00', group: 'D', venue: 'Miami' },
  { home: 'Japonia',   away: 'Chile',     date: '2026-06-13', time: '18:00', group: 'D', venue: 'Houston' },
  { home: 'Brazylia',  away: 'Chile',     date: '2026-06-17', time: '21:00', group: 'D', venue: 'Dallas' },
  { home: 'Niemcy',    away: 'Japonia',   date: '2026-06-17', time: '18:00', group: 'D', venue: 'Miami' },
  { home: 'Chile',     away: 'Niemcy',    date: '2026-06-21', time: '21:00', group: 'D', venue: 'Houston' },
  { home: 'Brazylia',  away: 'Japonia',   date: '2026-06-21', time: '21:00', group: 'D', venue: 'Miami' },
  // GROUP E
  { home: 'Hiszpania', away: 'Serbia',    date: '2026-06-13', time: '20:00', group: 'E', venue: 'Atlanta' },
  { home: 'Senegal',   away: 'TBD',       date: '2026-06-13', time: '23:00', group: 'E', venue: 'Chicago' },
  { home: 'Hiszpania', away: 'TBD',       date: '2026-06-17', time: '20:00', group: 'E', venue: 'New York' },
  { home: 'Senegal',   away: 'Serbia',    date: '2026-06-17', time: '23:00', group: 'E', venue: 'Boston' },
  { home: 'TBD',       away: 'Serbia',    date: '2026-06-21', time: '23:00', group: 'E', venue: 'Chicago' },
  { home: 'Hiszpania', away: 'Senegal',   date: '2026-06-21', time: '23:00', group: 'E', venue: 'Atlanta' },
  // GROUP F
  { home: 'Francja',   away: 'TBD',       date: '2026-06-14', time: '20:00', group: 'F', venue: 'Los Angeles' },
  { home: 'TBD',       away: 'TBD',       date: '2026-06-14', time: '23:00', group: 'F', venue: 'San Francisco' },
  { home: 'Francja',   away: 'TBD',       date: '2026-06-18', time: '20:00', group: 'F', venue: 'Seattle' },
  { home: 'TBD',       away: 'TBD',       date: '2026-06-18', time: '23:00', group: 'F', venue: 'Los Angeles' },
  { home: 'TBD',       away: 'TBD',       date: '2026-06-22', time: '23:00', group: 'F', venue: 'San Francisco' },
  { home: 'Francja',   away: 'TBD',       date: '2026-06-22', time: '23:00', group: 'F', venue: 'Seattle' },
  // GROUP G
  { home: 'Argentyna', away: 'TBD',       date: '2026-06-14', time: '21:00', group: 'G', venue: 'New York' },
  { home: 'TBD',       away: 'TBD',       date: '2026-06-14', time: '18:00', group: 'G', venue: 'Atlanta' },
  { home: 'Argentyna', away: 'TBD',       date: '2026-06-18', time: '21:00', group: 'G', venue: 'Miami' },
  { home: 'TBD',       away: 'TBD',       date: '2026-06-18', time: '18:00', group: 'G', venue: 'Dallas' },
  { home: 'TBD',       away: 'TBD',       date: '2026-06-22', time: '21:00', group: 'G', venue: 'New York' },
  { home: 'Argentyna', away: 'TBD',       date: '2026-06-22', time: '21:00', group: 'G', venue: 'Miami' },
  // GROUP H
  { home: 'Portugalia', away: 'TBD',      date: '2026-06-14', time: '22:00', group: 'H', venue: 'San Francisco' },
  { home: 'TBD',        away: 'TBD',      date: '2026-06-15', time: '01:00', group: 'H', venue: 'Los Angeles' },
  { home: 'Portugalia', away: 'TBD',      date: '2026-06-18', time: '22:00', group: 'H', venue: 'Seattle' },
  { home: 'TBD',        away: 'TBD',      date: '2026-06-18', time: '19:00', group: 'H', venue: 'Kansas City' },
  { home: 'TBD',        away: 'TBD',      date: '2026-06-22', time: '22:00', group: 'H', venue: 'San Francisco' },
  { home: 'Portugalia', away: 'TBD',      date: '2026-06-22', time: '22:00', group: 'H', venue: 'Los Angeles' },
  // GROUP I
  { home: 'Anglia',    away: 'TBD',       date: '2026-06-15', time: '22:00', group: 'I', venue: 'New York' },
  { home: 'TBD',       away: 'TBD',       date: '2026-06-15', time: '19:00', group: 'I', venue: 'Boston' },
  { home: 'Anglia',    away: 'TBD',       date: '2026-06-19', time: '22:00', group: 'I', venue: 'Atlanta' },
  { home: 'TBD',       away: 'TBD',       date: '2026-06-19', time: '19:00', group: 'I', venue: 'New York' },
  { home: 'TBD',       away: 'TBD',       date: '2026-06-23', time: '22:00', group: 'I', venue: 'Boston' },
  { home: 'Anglia',    away: 'TBD',       date: '2026-06-23', time: '22:00', group: 'I', venue: 'Atlanta' },
  // GROUP J
  { home: 'Holandia',  away: 'TBD',       date: '2026-06-15', time: '21:00', group: 'J', venue: 'Houston' },
  { home: 'TBD',       away: 'TBD',       date: '2026-06-15', time: '18:00', group: 'J', venue: 'Kansas City' },
  { home: 'Holandia',  away: 'TBD',       date: '2026-06-19', time: '21:00', group: 'J', venue: 'Dallas' },
  { home: 'TBD',       away: 'TBD',       date: '2026-06-19', time: '18:00', group: 'J', venue: 'Houston' },
  { home: 'TBD',       away: 'TBD',       date: '2026-06-23', time: '21:00', group: 'J', venue: 'Kansas City' },
  { home: 'Holandia',  away: 'TBD',       date: '2026-06-23', time: '21:00', group: 'J', venue: 'Dallas' },
  // GROUP K
  { home: 'TBD',  away: 'TBD',           date: '2026-06-16', time: '22:00', group: 'K', venue: 'Miami' },
  { home: 'TBD',  away: 'TBD',           date: '2026-06-16', time: '19:00', group: 'K', venue: 'Chicago' },
  { home: 'TBD',  away: 'TBD',           date: '2026-06-20', time: '22:00', group: 'K', venue: 'Atlanta' },
  { home: 'TBD',  away: 'TBD',           date: '2026-06-20', time: '19:00', group: 'K', venue: 'Miami' },
  { home: 'TBD',  away: 'TBD',           date: '2026-06-24', time: '22:00', group: 'K', venue: 'Chicago' },
  { home: 'TBD',  away: 'TBD',           date: '2026-06-24', time: '22:00', group: 'K', venue: 'Atlanta' },
  // GROUP L
  { home: 'Korea PoĹ‚udniowa', away: 'TBD', date: '2026-06-16', time: '01:00', group: 'L', venue: 'Los Angeles' },
  { home: 'TBD',  away: 'TBD',           date: '2026-06-16', time: '04:00', group: 'L', venue: 'San Francisco' },
  { home: 'Korea PoĹ‚udniowa', away: 'TBD', date: '2026-06-20', time: '01:00', group: 'L', venue: 'Seattle' },
  { home: 'TBD',  away: 'TBD',           date: '2026-06-20', time: '04:00', group: 'L', venue: 'Los Angeles' },
  { home: 'TBD',  away: 'TBD',           date: '2026-06-24', time: '01:00', group: 'L', venue: 'San Francisco' },
  { home: 'Korea PoĹ‚udniowa', away: 'TBD', date: '2026-06-24', time: '01:00', group: 'L', venue: 'Seattle' },
];

const KNOCKOUT_MATCHES = [
  { date: '2026-06-28', time: '20:00', round: 'Runda 32', venue: 'Dallas' },
  { date: '2026-06-28', time: '23:00', round: 'Runda 32', venue: 'Los Angeles' },
  { date: '2026-06-29', time: '20:00', round: 'Runda 32', venue: 'Miami' },
  { date: '2026-06-29', time: '23:00', round: 'Runda 32', venue: 'New York' },
  { date: '2026-06-30', time: '20:00', round: 'Runda 32', venue: 'Houston' },
  { date: '2026-06-30', time: '23:00', round: 'Runda 32', venue: 'Atlanta' },
  { date: '2026-07-01', time: '20:00', round: 'Runda 32', venue: 'Seattle' },
  { date: '2026-07-01', time: '23:00', round: 'Runda 32', venue: 'Kansas City' },
  { date: '2026-07-02', time: '20:00', round: 'Runda 32', venue: 'San Francisco' },
  { date: '2026-07-02', time: '23:00', round: 'Runda 32', venue: 'Dallas' },
  { date: '2026-07-03', time: '20:00', round: 'Runda 32', venue: 'Los Angeles' },
  { date: '2026-07-03', time: '23:00', round: 'Runda 32', venue: 'Miami' },
  { date: '2026-07-04', time: '20:00', round: 'Runda 32', venue: 'New York' },
  { date: '2026-07-04', time: '23:00', round: 'Runda 32', venue: 'Houston' },
  { date: '2026-07-05', time: '20:00', round: 'Runda 32', venue: 'Atlanta' },
  { date: '2026-07-05', time: '23:00', round: 'Runda 32', venue: 'Seattle' },
  { date: '2026-07-07', time: '20:00', round: '1/8 FinaĹ‚u', venue: 'Dallas' },
  { date: '2026-07-07', time: '23:00', round: '1/8 FinaĹ‚u', venue: 'Los Angeles' },
  { date: '2026-07-08', time: '20:00', round: '1/8 FinaĹ‚u', venue: 'Miami' },
  { date: '2026-07-08', time: '23:00', round: '1/8 FinaĹ‚u', venue: 'New York' },
  { date: '2026-07-09', time: '20:00', round: '1/8 FinaĹ‚u', venue: 'Houston' },
  { date: '2026-07-09', time: '23:00', round: '1/8 FinaĹ‚u', venue: 'Atlanta' },
  { date: '2026-07-10', time: '20:00', round: '1/8 FinaĹ‚u', venue: 'Seattle' },
  { date: '2026-07-10', time: '23:00', round: '1/8 FinaĹ‚u', venue: 'Kansas City' },
  { date: '2026-07-13', time: '20:00', round: 'Ä†wierÄ‡finaĹ‚', venue: 'Dallas' },
  { date: '2026-07-13', time: '23:00', round: 'Ä†wierÄ‡finaĹ‚', venue: 'Los Angeles' },
  { date: '2026-07-14', time: '20:00', round: 'Ä†wierÄ‡finaĹ‚', venue: 'Miami' },
  { date: '2026-07-14', time: '23:00', round: 'Ä†wierÄ‡finaĹ‚', venue: 'New York' },
  { date: '2026-07-17', time: '22:00', round: 'PĂłĹ‚finaĹ‚', venue: 'Atlanta' },
  { date: '2026-07-18', time: '22:00', round: 'PĂłĹ‚finaĹ‚', venue: 'Dallas' },
  { date: '2026-07-21', time: '21:00', round: 'Mecz o 3. miejsce', venue: 'Miami' },
  { date: '2026-07-22', time: '21:00', round: 'FinaĹ‚', venue: 'MetLife Stadium, New York' },
];

async function seed() {
  await initSchema();
  const count = await db('matches').count('id as c').first();
  if (count.c > 0) {
    console.log('Mecze juĹĽ zaĹ‚adowane. UsuĹ„ data/wc2026.db aby wykonaÄ‡ ponownie.');
    await db.destroy();
    return;
  }

  let order = 1;
  for (const m of GROUP_MATCHES) {
    await db('matches').insert({
      home_team: m.home, away_team: m.away,
      home_flag: flag(m.home), away_flag: flag(m.away),
      match_date: m.date, match_time: m.time,
      group_name: `Grupa ${m.group}`, round: 'Faza grupowa',
      venue: m.venue, sort_order: order++,
    });
  }

  for (const m of KNOCKOUT_MATCHES) {
    await db('matches').insert({
      home_team: 'TBD', away_team: 'TBD',
      home_flag: null, away_flag: null,
      match_date: m.date, match_time: m.time,
      group_name: null, round: m.round,
      venue: m.venue, sort_order: order++,
    });
  }

  const total = await db('matches').count('id as c').first();
  console.log(`âś“ ZaĹ‚adowano ${total.c} meczĂłw.`);
  await db.destroy();
}

seed().catch(e => { console.error(e); process.exit(1); });
