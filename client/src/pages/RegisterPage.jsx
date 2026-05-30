import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Hasła nie są identyczne');
    setLoading(true);
    try {
      await register(form.username, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd rejestracji');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⚽</div>
          <h1 className="text-3xl font-black text-wc-gold">TYPER MŚ 2026</h1>
          <p className="text-white/50 text-sm mt-1">Dołącz do zabawy!</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-6 text-center">Rejestracja</h2>
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Login (min. 3 znaki)</label>
              <input
                className="input"
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoComplete="username"
                required minLength={3}
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Hasło (min. 6 znaków)</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="new-password"
                required minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Powtórz hasło</label>
              <input
                className="input"
                type="password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                autoComplete="new-password"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Rejestracja…' : 'Zarejestruj się'}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-white/50 text-sm">
          Masz już konto?{' '}
          <Link to="/login" className="text-wc-gold hover:underline font-semibold">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
