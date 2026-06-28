const knex = require('knex');
const path = require('path');
const fs = require('fs');

// Na Railway volume jest montowany pod DATA_DIR (np. /data).
// Lokalnie używamy server/data/
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = knex({
  client: 'sqlite3',
  connection: { filename: path.join(dataDir, 'wc2026.db') },
  useNullAsDefault: true,
  pool: { min: 1, max: 1 },
});

async function initSchema() {
  await db.raw('PRAGMA foreign_keys = ON');

  const hasUsers = await db.schema.hasTable('users');
  if (!hasUsers) {
    await db.schema.createTable('users', t => {
      t.increments('id');
      t.string('username').notNullable().unique();
      t.string('password_hash').notNullable();
      t.integer('is_admin').defaultTo(0);
      t.integer('password_reset_required').defaultTo(0);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  } else {
    const hasResetCol = await db.schema.hasColumn('users', 'password_reset_required');
    if (!hasResetCol) {
      await db.schema.table('users', t => t.integer('password_reset_required').defaultTo(0));
    }
    const hasEmailCol = await db.schema.hasColumn('users', 'email');
    if (!hasEmailCol) {
      await db.schema.table('users', t => {
        t.string('email');
        t.integer('notify_email').defaultTo(0);
      });
    }
  }

  const hasMatches = await db.schema.hasTable('matches');
  if (!hasMatches) {
    await db.schema.createTable('matches', t => {
      t.increments('id');
      t.string('home_team').notNullable();
      t.string('away_team').notNullable();
      t.string('home_flag');
      t.string('away_flag');
      t.string('match_date').notNullable();
      t.string('match_time').notNullable();
      t.string('group_name');
      t.string('round').notNullable();
      t.string('venue');
      t.string('status').defaultTo('scheduled');
      t.integer('home_score');
      t.integer('away_score');
      t.integer('ended_with_penalties').defaultTo(0);
      t.integer('sort_order').defaultTo(0);
    });
  }

  const hasLiveCols = await db.schema.hasColumn('matches', 'live_home');
  if (!hasLiveCols) {
    await db.schema.table('matches', t => {
      t.integer('live_home');
      t.integer('live_away');
      t.integer('live_minute');
      t.string('live_phase');
      t.bigint('live_phase_since');
    });
  } else {
    const hasMinuteCol = await db.schema.hasColumn('matches', 'live_minute');
    if (!hasMinuteCol) await db.schema.table('matches', t => t.integer('live_minute'));
    const hasPhaseCol = await db.schema.hasColumn('matches', 'live_phase');
    if (!hasPhaseCol) {
      await db.schema.table('matches', t => {
        t.string('live_phase');
        t.bigint('live_phase_since');
        t.bigint('live_minute_at');
        t.integer('live_approximate').defaultTo(0);
      });
    } else {
      const hasApproxCol = await db.schema.hasColumn('matches', 'live_approximate');
      if (!hasApproxCol) {
        await db.schema.table('matches', t => t.integer('live_approximate').defaultTo(0));
      }
    }
  }

  const hasPred = await db.schema.hasTable('predictions');
  if (!hasPred) {
    await db.schema.createTable('predictions', t => {
      t.increments('id');
      t.integer('user_id').notNullable().references('id').inTable('users');
      t.integer('match_id').notNullable().references('id').inTable('matches');
      t.integer('home_score');
      t.integer('away_score');
      t.integer('predict_penalties').defaultTo(0);
      t.integer('points');
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.timestamp('updated_at').defaultTo(db.fn.now());
      t.unique(['user_id', 'match_id']);
    });
  }

  const hasChamp = await db.schema.hasTable('champion_predictions');
  if (!hasChamp) {
    await db.schema.createTable('champion_predictions', t => {
      t.increments('id');
      t.integer('user_id').notNullable().unique().references('id').inTable('users');
      t.string('team').notNullable();
      t.integer('points').defaultTo(0);
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.timestamp('updated_at').defaultTo(db.fn.now());
    });
  }
}

module.exports = { db, initSchema };
