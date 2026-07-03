const axios = require('axios');
const { db, initSchema } = require('../db/database');
const { calculatePoints } = require('../db/scoring');

const API_KEY = process.env.FOOTBALL_API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

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

const STAGE_TO_ROUND = {
  'ROUND_OF_32': 'Runda 32',
  'LAST_32': 'Runda 32',
  'ROUND_OF_16': '1/8 Finału',
  'LAST_16': '1/8 Finału',
  'QUARTER_FINALS': 'Ćwierćfinał',
  'SEMI_FINALS': 'Półfinał',
  'FINAL': 'Finał',
  'THIRD_PLACE': 'Mecz o 3. miejsce',
};

function toPlName(engName) { return EN_TO_PL[engName] || engName; }
function toFlag(plName) { const c = FLAG_MAP[plName]; return c ? `${FLAG_BASE}/${c}.png` : null; }

function matchDbRow(dbMatches, homeEng, awayEng) {
  const homePl = toPlName(homeEng);
  const awayPl = toPlName(awayEng);
  return dbMatches.find(m => m.home_team === homePl && m.away_team === awayPl)
    || dbMatches.find(m => m.home_team === awayPl && m.away_team === homePl);
}

async function fetchAllMatches() {
  const resp = await axios.get(`${BASE_URL}/competitions/WC/matches`, {
    headers: { 'X-Auth-Token': API_KEY },
    params: { season: 2026 },
  });
  return resp.data.matches || [];
}

async function applyFinishedMatch(dbRow, hs, as_, pen, penHome, penAway) {
  await db('matches').where({ id: dbRow.id }).update({
    home_score: hs, away_score: as_,
    ended_with_penalties: pen ? 1 : 0,
    home_penalties: penHome ?? null,
    away_penalties: penAway ?? null,
    status: 'finished',
    live_home: null, live_away: null, live_minute: null,
  });
  const updatedMatch = await db('matches').where({ id: dbRow.id }).first();
  const predictions = await db('predictions').where({ match_id: dbRow.id });
  for (const pred of predictions) {
    const { points } = calculatePoints(updatedMatch, pred);
    await db('predictions').where({ id: pred.id }).update({ points });
  }
}

// 1. Aktualizuje wyniki zakończonych meczów i przelicza punkty
async function syncFinishedMatches(apiMatches, dbMatches) {
  const finished = apiMatches.filter(m => m.status === 'FINISHED');
  let updated = 0;

  for (const m of finished) {
    const isKnockout = m.stage !== 'GROUP_STAGE';
    const hasExtraTime = m.score.extraTime?.home != null;
    const hs = (isKnockout && hasExtraTime) ? m.score.extraTime.home : m.score.fullTime.home;
    const as_ = (isKnockout && hasExtraTime) ? m.score.extraTime.away : m.score.fullTime.away;
    if (hs === null || hs === undefined) continue;

    const penHome = m.score.penalties?.home ?? null;
    const penAway = m.score.penalties?.away ?? null;
    const pen = penHome !== null || penAway !== null;

    const dbRow = matchDbRow(dbMatches, m.homeTeam.name, m.awayTeam.name);
    if (!dbRow) { console.log(`  [WARN] Nie znaleziono: ${m.homeTeam.name} vs ${m.awayTeam.name}`); continue; }

    // Aktualizuj jeśli jeszcze nie finished LUB jeśli wynik się różni (korekta błędnych danych)
    if (dbRow.status === 'finished' && dbRow.home_score === hs && dbRow.away_score === as_) continue;

    await applyFinishedMatch(dbRow, hs, as_, pen, penHome, penAway);
    console.log(`  ✓ ${toPlName(m.homeTeam.name)} ${hs}:${as_} ${toPlName(m.awayTeam.name)}${pen ? ' (k)' : ''}`);
    updated++;
  }
  return updated;
}

// 2. Uzupełnia drużyny TBD w fazie pucharowej
async function syncKnockoutTeams(apiMatches, dbMatches) {
  const knockout = apiMatches.filter(m =>
    m.stage !== 'GROUP_STAGE' &&
    m.homeTeam?.name && m.awayTeam?.name &&
    m.homeTeam.name !== 'TBD' && m.awayTeam.name !== 'TBD'
  );

  let updated = 0;
  for (const m of knockout) {
    const homePl = toPlName(m.homeTeam.name);
    const awayPl = toPlName(m.awayTeam.name);

    const expectedRound = STAGE_TO_ROUND[m.stage];

    // Skip if these teams are already filled in any slot
    const alreadyFilled = dbMatches.find(d =>
      d.home_team === homePl && d.away_team === awayPl && d.status !== 'finished'
    );
    if (alreadyFilled) continue;

    // API returns UTC; seed stores CEST (+2h) — convert before matching
    const cestDt = new Date(new Date(m.utcDate).getTime() + 2 * 60 * 60 * 1000);
    const cestDate = cestDt.toISOString().slice(0, 10);
    const cestTime = cestDt.toISOString().slice(11, 16);
    const dbRow = dbMatches.find(d =>
      d.home_team === 'TBD' && d.away_team === 'TBD' &&
      d.match_date === cestDate && d.match_time === cestTime &&
      d.status !== 'finished' &&
      (!expectedRound || d.round === expectedRound)
    );
    if (!dbRow) {
      // slot already filled or date mismatch — skip silently
      continue;
    }
    await db('matches').where({ id: dbRow.id }).update({
      home_team: homePl, away_team: awayPl,
      home_flag: toFlag(homePl), away_flag: toFlag(awayPl),
    });
    console.log(`  ✓ Uzupełniono bracket: ${homePl} vs ${awayPl} (CEST ${cestDate} ${cestTime})`);
    updated++;
  }
  return updated;
}

// Stan w pamięci — resetuje się przy restarcie serwera (akceptowalne)
const liveState = {}; // matchId → { done: Set, htRetries: number, ftRetries: number }

function getLiveState(matchId) {
  if (!liveState[matchId]) liveState[matchId] = { done: new Set(), htRetries: 0, ftRetries: 0 };
  return liveState[matchId];
}

let apiFetchBlocked = false; // globalny flag — limit wyczerpany na dziś

async function apiFetchLive(homeTeamPl, awayTeamPl) {
  const LIVE_KEY = process.env.APISPORTS_KEY;
  if (!LIVE_KEY || apiFetchBlocked) return null;
  try {
    const resp = await axios.get('https://v3.football.api-sports.io/fixtures?live=all', {
      headers: { 'x-apisports-key': LIVE_KEY },
    });

    if (resp.data.errors?.requests) {
      console.error('  [live-phase] ⚠️  Dzienny limit api-football wyczerpany — wyłączam sync minuty do restartu serwera');
      apiFetchBlocked = true;
      return null;
    }

    const fixtures = (resp.data.response || []).filter(f => f.league.id === 1);
    return fixtures.find(f => {
      const h = toPlName(f.teams.home.name);
      const a = toPlName(f.teams.away.name);
      return (h === homeTeamPl && a === awayTeamPl) || (h === awayTeamPl && a === homeTeamPl);
    }) || null;
  } catch (e) {
    if (e.response?.status === 429) {
      console.error('  [live-phase] ⚠️  Rate limit api-football (429) — wyłączam sync minuty do restartu serwera');
      apiFetchBlocked = true;
    }
    return null;
  }
}

async function manageLivePhase(dbMatch) {
  const { id: matchId, home_team, away_team, match_date, match_time } = dbMatch;
  const state = getLiveState(matchId);
  const { done } = state;

  const kickoff = new Date(`${match_date}T${match_time}:00+02:00`).getTime();
  const now = Date.now();
  const elapsed = now - kickoff; // ms od kickoffu

  let phase = dbMatch.live_phase || 'first_half';
  let phaseSince = Number(dbMatch.live_phase_since) || kickoff;

  async function enterHT(approximate = false) {
    phase = 'half_time';
    phaseSince = now;
    await db('matches').where({ id: matchId }).update({
      live_phase: 'half_time', live_phase_since: now,
      live_minute: 45, live_minute_at: now,
      live_approximate: approximate ? 1 : 0,
    });
    console.log(`  [live] ${home_team} vs ${away_team} → PRZERWA${approximate ? ' (orientacyjnie)' : ''}`);
  }

  async function enterP2(fixture, approximate = false) {
    phase = 'second_half';
    phaseSince = now;
    const updates = {
      live_phase: 'second_half', live_phase_since: now,
      live_approximate: approximate ? 1 : 0,
    };
    if (fixture?.fixture.status.elapsed > 45) {
      updates.live_minute = fixture.fixture.status.elapsed;
      updates.live_minute_at = now;
      done.add('p2_sync');
    }
    await db('matches').where({ id: matchId }).update(updates);
    console.log(`  [live] ${home_team} vs ${away_team} → II połowa${approximate ? ' (orientacyjnie)' : ''}`);
  }

  // === TRYB ORIENTACYJNY (limit api-football wyczerpany) ===
  if (apiFetchBlocked) {
    if (!dbMatch.live_approximate) {
      await db('matches').where({ id: matchId }).update({ live_approximate: 1 });
    }
    if (phase === 'first_half' && elapsed >= 50 * 60000 && !done.has('ht_done')) {
      await enterHT(true); done.add('ht_done');
    }
    if (phase === 'half_time' && now - phaseSince >= 15 * 60000 && !done.has('p2_start')) {
      await enterP2(null, true); done.add('p2_start');
    }
    if (phase === 'second_half' && now - phaseSince >= 50 * 60000 && !done.has('ft_done')) {
      await db('matches').where({ id: matchId }).update({ live_phase: 'done' });
      done.add('ft_done');
    }
    return;
  }

  // === PIERWSZA POŁOWA ===
  if (phase === 'first_half') {
    // +5 min: zsynchronizuj minutę
    if (elapsed >= 5 * 60000 && !done.has('p1_sync')) {
      done.add('p1_sync');
      const f = await apiFetchLive(home_team, away_team);
      if (f?.fixture.status.elapsed) {
        await db('matches').where({ id: matchId }).update({
          live_minute: f.fixture.status.elapsed, live_minute_at: now,
        });
      }
    }

    // +50 min: sprawdź HT, co minutę do max 5 retries
    if (elapsed >= 50 * 60000 && !done.has('ht_done')) {
      if (!done.has('ht_check')) done.add('ht_check');
      else state.htRetries++;

      const f = await apiFetchLive(home_team, away_team);
      const s = f?.fixture.status.short;

      if (s === 'HT') {
        await enterHT(); done.add('ht_done');
      } else if (s === '2H' || s === 'ET') {
        await enterP2(f); done.add('ht_done');
      } else if (s === 'FT' || s === 'AET' || s === 'PEN') {
        await db('matches').where({ id: matchId }).update({ live_phase: 'done' }); done.add('ht_done');
      } else if (state.htRetries >= 5) {
        await enterHT(true); done.add('ht_done'); // wymuś po 5 retries
      }
    }
  }

  // === PRZERWA ===
  if (phase === 'half_time') {
    if (now - phaseSince >= 15 * 60000 && !done.has('p2_start')) {
      done.add('p2_start');
      await enterP2(null);
    }
  }

  // === DRUGA POŁOWA ===
  if (phase === 'second_half') {
    const p2elapsed = now - phaseSince;

    // +5 min: zsynchronizuj minutę
    if (p2elapsed >= 5 * 60000 && !done.has('p2_sync')) {
      done.add('p2_sync');
      const f = await apiFetchLive(home_team, away_team);
      if (f?.fixture.status.elapsed) {
        await db('matches').where({ id: matchId }).update({
          live_minute: f.fixture.status.elapsed, live_minute_at: now,
        });
      }
    }

    // +50 min: sprawdź FT, co minutę do max 5 retries
    if (p2elapsed >= 50 * 60000 && !done.has('ft_done')) {
      if (!done.has('ft_check')) done.add('ft_check');
      else state.ftRetries++;

      const f = await apiFetchLive(home_team, away_team);
      const s = f?.fixture.status.short;

      if (!f || s === 'FT' || s === 'AET' || s === 'PEN') {
        await db('matches').where({ id: matchId }).update({ live_phase: 'done' }); done.add('ft_done');
      } else if (state.ftRetries >= 5) {
        await db('matches').where({ id: matchId }).update({ live_phase: 'done' }); done.add('ft_done');
      }
    }
  }
}

async function syncLiveMatches(apiMatches, dbMatches) {
  const live = apiMatches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED');
  const liveIds = new Set();
  let updated = 0;

  for (const m of live) {
    const hs = m.score.fullTime.home;
    const as_ = m.score.fullTime.away;
    if (hs === null || as_ === null) continue;

    const dbRow = matchDbRow(dbMatches, m.homeTeam.name, m.awayTeam.name);
    if (!dbRow || dbRow.status === 'finished') continue;

    liveIds.add(dbRow.id);

    if (dbRow.status !== 'in_play' || dbRow.live_home !== hs || dbRow.live_away !== as_) {
      await db('matches').where({ id: dbRow.id }).update({
        status: 'in_play', live_home: hs, live_away: as_,
      });
      updated++;
    }

    // Zarządzaj fazą meczu (minuta, HT, koniec) — max 6 req/mecz do api-football
    await manageLivePhase(dbRow);
  }

  // Mecze które zniknęły z live → reset do scheduled (finished sync je zaraz złapie)
  const stale = dbMatches.filter(m => m.status === 'in_play' && !liveIds.has(m.id));
  for (const m of stale) {
    await db('matches').where({ id: m.id }).update({
      status: 'scheduled', live_home: null, live_away: null,
    });
  }

  return live.length;
}

async function sync() {
  if (!API_KEY) { console.error('Brak FOOTBALL_API_KEY'); return; }

  try {
    const [apiMatches, dbMatches] = await Promise.all([
      fetchAllMatches(),
      db('matches').select('*'),
    ]);

    const liveCount = await syncLiveMatches(apiMatches, dbMatches);
    const r1 = await syncFinishedMatches(apiMatches, dbMatches);
    const r2 = await syncKnockoutTeams(apiMatches, dbMatches);

    const time = new Date().toLocaleTimeString('pl-PL');
    if (liveCount > 0) console.log(`[${time}] 🔴 Na żywo: ${liveCount} meczów, wyniki: ${r1} zaktualizowanych`);
    else if (r1 > 0 || r2 > 0) console.log(`[${time}] Wyniki: ${r1} zaktualizowanych, bracket: ${r2} uzupełnionych.`);

  } catch (e) {
    if (e.response?.status === 429) {
      console.error('  [WARN] Rate limit API (429)');
    } else {
      console.error('  [ERROR]', e.message);
    }
  }
}

module.exports = { sync };

if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
  initSchema().then(() => sync()).then(() => db.destroy());
}
