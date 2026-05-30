const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Brak tokenu' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Nieprawidłowy token' });
  }
}

// Opcjonalne auth – jeśli token jest, dekoduje; jeśli nie ma, przepuszcza dalej
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header) {
    const token = header.split(' ')[1];
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch {}
  }
  next();
}

function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (!req.user.is_admin) return res.status(403).json({ error: 'Brak uprawnień administratora' });
    next();
  });
}

module.exports = { auth, optionalAuth, adminAuth };
