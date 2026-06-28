const { db } = require('../db/database');
const nodemailer = require('nodemailer');

function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NOTIFY_EMAIL_USER,
      pass: process.env.NOTIFY_EMAIL_PASS,
    },
  });
}

async function sendMatchReminders() {
  if (!process.env.NOTIFY_EMAIL_USER || !process.env.NOTIFY_EMAIL_PASS) return;

  const APP_URL = process.env.APP_URL || 'https://typer-ms2026.up.railway.app';
  const FROM = `"MŚ 2026 Typer" <${process.env.NOTIFY_EMAIL_USER}>`;

  const now = new Date();
  const in60 = new Date(now.getTime() + 30 * 60 * 1000);
  const in75 = new Date(now.getTime() + 45 * 60 * 1000);

  const upcoming = await db('matches')
    .where('status', 'scheduled')
    .whereNot('home_team', 'TBD')
    .whereNot('away_team', 'TBD')
    .select('id', 'home_team', 'away_team', 'match_date', 'match_time', 'round');

  const targetMatches = upcoming.filter(m => {
    const kickoff = new Date(`${m.match_date}T${m.match_time}:00+02:00`);
    return kickoff >= in60 && kickoff <= in75;
  });

  if (targetMatches.length === 0) return;

  const transporter = createTransport();

  for (const match of targetMatches) {
    const NOTIFY_WHITELIST = process.env.NOTIFY_WHITELIST
      ? process.env.NOTIFY_WHITELIST.split(',').map(s => s.trim())
      : null;

    let q = db('users as u')
      .where('u.notify_email', 1)
      .whereNotNull('u.email')
      .whereNotIn('u.id', db('predictions').where('match_id', match.id).select('user_id'));
    if (NOTIFY_WHITELIST) q = q.whereIn('u.username', NOTIFY_WHITELIST);
    const usersToNotify = await q.select('u.id', 'u.username', 'u.email');

    const kickoffFormatted = new Date(`${match.match_date}T${match.match_time}:00+02:00`)
      .toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });

    for (const user of usersToNotify) {
      try {
        await transporter.sendMail({
          from: FROM,
          to: user.email,
          subject: `⚽ Nie obstawiłeś: ${match.home_team} vs ${match.away_team}`,
          html: `
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
                Żeby wyłączyć powiadomienia wejdź w zakładkę Powiadomienia w aplikacji.
              </p>
            </div>
          `,
        });
        console.log(`  ✉️  Wysłano reminder do ${user.username} (${user.email}) — ${match.home_team} vs ${match.away_team}`);
      } catch (e) {
        console.error(`  ✉️  Błąd wysyłki do ${user.email}:`, e.message);
      }
    }
  }
}

module.exports = { sendMatchReminders };
