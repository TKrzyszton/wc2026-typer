const { db } = require('../db/database');

async function migrateFlags() {
  const matches = await db('matches').whereNotNull('home_flag');
  let updated = 0;
  for (const m of matches) {
    const homeFlag = m.home_flag?.replace('https://flagcdn.com/w40', '/flags');
    const awayFlag = m.away_flag?.replace('https://flagcdn.com/w40', '/flags');
    if (homeFlag !== m.home_flag || awayFlag !== m.away_flag) {
      await db('matches').where({ id: m.id }).update({ home_flag: homeFlag, away_flag: awayFlag });
      updated++;
    }
  }
  if (updated > 0) console.log(`Flagi: zaktualizowano ${updated} meczów na lokalne ścieżki.`);
}

module.exports = migrateFlags();
