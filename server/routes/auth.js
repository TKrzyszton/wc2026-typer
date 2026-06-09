const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Login i hasło są wymagane' });
    if (username.length < 3) return res.status(400).json({ error: 'Login musi mieć min. 3 znaki' });
    if (password.length < 6) return res.status(400).json({ error: 'Hasło musi mieć min. 6 znaków' });

    const hash = await bcrypt.hash(password, 10);
    const [id] = await db('users').insert({ username: username.trim(), password_hash: hash });
    const token = jwt.sign({ id, username: username.trim(), is_admin: 0 }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: username.trim(), is_admin: false });
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Ten login jest już zajęty' });
    throw e;
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db('users').where(db.raw('LOWER(username) = LOWER(?)', [username?.trim() || ''])).first();
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
  }
  const mustChangePassword = !!user.password_reset_required;
  const token = jwt.sign(
    { id: user.id, username: user.username, is_admin: user.is_admin, mustChangePassword },
    process.env.JWT_SECRET,
    { expiresIn: mustChangePassword ? '1h' : '7d' }
  );
  res.json({ token, username: user.username, is_admin: !!user.is_admin, mustChangePassword });
});

router.post('/change-password', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Brak tokenu' });
  let payload;
  try {
    payload = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Nieprawidłowy token' });
  }
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Hasło musi mieć min. 6 znaków' });

  const hash = await bcrypt.hash(password, 10);
  await db('users').where({ id: payload.id }).update({ password_hash: hash, password_reset_required: 0 });

  const token = jwt.sign(
    { id: payload.id, username: payload.username, is_admin: payload.is_admin, mustChangePassword: false },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, username: payload.username, is_admin: !!payload.is_admin, mustChangePassword: false });
});

module.exports = router;
