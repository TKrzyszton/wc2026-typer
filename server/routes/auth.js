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
  const token = jwt.sign(
    { id: user.id, username: user.username, is_admin: user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, username: user.username, is_admin: !!user.is_admin });
});

module.exports = router;
