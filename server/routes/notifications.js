const router = require('express').Router();
const { db } = require('../db/database');
const { auth } = require('../middleware/auth');

router.get('/settings', auth, async (req, res) => {
  const user = await db('users').where({ id: req.user.id }).select('email', 'notify_email').first();
  res.json({ email: user.email || null, notify_email: !!user.notify_email });
});

router.post('/settings', auth, async (req, res) => {
  const { email, notify_email } = req.body;
  if (email !== undefined && email !== null && email !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Nieprawidłowy adres email' });
  }
  await db('users').where({ id: req.user.id }).update({
    email: email || null,
    notify_email: notify_email ? 1 : 0,
  });
  res.json({ success: true });
});

module.exports = router;
