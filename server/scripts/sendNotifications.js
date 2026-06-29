const { db } = require('../db/database');
const axios = require('axios');
const webpush = require('web-push');

async function sendPushNotifications(usersToNotify, match, kickoffFormatted, APP_URL, whitelist) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
  webpush.setVapidDetails(
    `mailto:${process.env.NOTIFY_FROM_EMAIL || 'admin@typer.pl'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  const filtered = whitelist ? usersToNotify.filter(u => whitelist.includes(u.username)) : usersToNotify;
  for (const user of filtered) {
    const subs = await db('push_subscriptions').where({ user_id: user.id });
    for (const row of subs) {
      try {
        const result = await webpush.sendNotification(JSON.parse(row.subscription), JSON.stringify({
          title: `⚽ Nie obstawiłeś meczu!`,
          body: `${match.home_team} vs ${match.away_team} — dziś o ${kickoffFormatted}`,
          url: `${APP_URL}/typowanie`,
        }), {
          urgency: 'high',
          TTL: 3600,
        });
        console.log(`  🔔 Push do ${user.username} — status: ${result.statusCode}`);
      } catch (e) {
        if (e.statusCode === 410) {
          console.log(`  🔔 Subskrypcja wygasła dla ${user.username} — usuwam`);
          await db('push_subscriptions').where({ id: row.id }).delete();
        } else {
          console.error(`  🔔 Błąd push do ${user.username}: status=${e.statusCode} body=${JSON.stringify(e.body)} msg=${e.message}`);
        }
      }
    }
  }
}

async function sendMatchReminders({ windowMinFrom = 60, windowMinTo = 75 } = {}) {
  const hasEmail = !!process.env.BREVO_API_KEY;
  const hasPush = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  if (!hasEmail && !hasPush) return;

  const APP_URL = process.env.APP_URL || 'https://typer-ms2026.up.railway.app';
  const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'jagertyper@gmail.com';
  const FROM_NAME = 'MŚ 2026 Typer';

  const now = new Date();
  const windowStart = new Date(now.getTime() + windowMinFrom * 60 * 1000);
  const windowEnd = new Date(now.getTime() + windowMinTo * 60 * 1000);

  const upcoming = await db('matches')
    .where('status', 'scheduled')
    .whereNot('home_team', 'TBD')
    .whereNot('away_team', 'TBD')
    .select('id', 'home_team', 'away_team', 'match_date', 'match_time', 'round');

  const targetMatches = upcoming.filter(m => {
    const kickoff = new Date(`${m.match_date}T${m.match_time}:00+02:00`);
    return kickoff >= windowStart && kickoff <= windowEnd;
  });

  console.log(`  ✉️  [notifications] window: ${windowMinFrom}-${windowMinTo} min | targetMatches: ${targetMatches.length} | upcoming: ${upcoming.length}`);
  if (targetMatches.length === 0) return;

  const NOTIFY_WHITELIST = process.env.NOTIFY_WHITELIST
    ? process.env.NOTIFY_WHITELIST.split(',').map(s => s.trim())
    : null;

  for (const match of targetMatches) {
    const notPredicted = db('predictions').where('match_id', match.id).select('user_id');

    // Push — wszyscy userzy z subskrypcją push, bez wymogu email
    let pushQ = db('users as u')
      .whereNotIn('u.id', notPredicted);
    if (NOTIFY_WHITELIST) pushQ = pushQ.whereIn('u.username', NOTIFY_WHITELIST);
    const pushUsers = await pushQ.select('u.id', 'u.username');

    // Email — tylko userzy z notify_email=1 i ustawionym emailem
    let emailQ = db('users as u')
      .where('u.notify_email', 1)
      .whereNotNull('u.email')
      .whereNotIn('u.id', notPredicted);
    if (NOTIFY_WHITELIST) emailQ = emailQ.whereIn('u.username', NOTIFY_WHITELIST);
    const emailUsers = await emailQ.select('u.id', 'u.username', 'u.email');

    const kickoffFormatted = new Date(`${match.match_date}T${match.match_time}:00+02:00`)
      .toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });

    await sendPushNotifications(pushUsers, match, kickoffFormatted, APP_URL, NOTIFY_WHITELIST);

    for (const user of emailUsers) {
      try {
        await axios.post('https://api.brevo.com/v3/smtp/email', {
          sender: { name: FROM_NAME, email: FROM_EMAIL },
          to: [{ email: user.email }],
          subject: `⚽ Nie obstawiłeś: ${match.home_team} vs ${match.away_team}`,
          htmlContent: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h2 style="color:#d4af37;margin:0 0 8px;">⚽ MŚ 2026 Typer</h2>
              <p style="color:#666;margin:0 0 24px;font-size:14px;">Przypomnienie o nieobstawionym meczu</p>
              <div style="background:#0d1f3c;border-radius:12px;padding:20px;margin-bottom:20px;">
                <p style="color:#fff;font-size:20px;font-weight:bold;margin:0 0 4px;text-align:center;">
                  ${match.home_team} vs ${match.away_team}
                </p>
                <p style="color:#d4af37;text-align:center;margin:0;font-size:14px;">
                  ${match.round} • dziś o ${kickoffFormatted}
                </p>
              </div>
              <p style="color:#444;font-size:14px;margin:0 0 20px;">
                Hej ${user.username}, za godzinę zaczyna się mecz a Ty nie masz jeszcze swojego typu!
              </p>
              <a href="${APP_URL}/typowanie"
                 style="display:block;background:#d4af37;color:#0d1f3c;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:bold;text-align:center;font-size:15px;">
                Obstaw teraz
              </a>
              <p style="color:#aaa;font-size:12px;margin:20px 0 0;text-align:center;">
                Żeby wyłączyć powiadomienia wejdź w zakładkę Alerty w aplikacji.
              </p>
            </div>
          `,
        }, {
          headers: { 'api-key': process.env.BREVO_API_KEY },
        });
        console.log(`  ✉️  Wysłano reminder do ${user.username} (${user.email}) — ${match.home_team} vs ${match.away_team}`);
      } catch (e) {
        console.error(`  ✉️  Błąd wysyłki do ${user.email}:`, e.response?.data || e.message);
      }
    }
  }
}

module.exports = { sendMatchReminders };
