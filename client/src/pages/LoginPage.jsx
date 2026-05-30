import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd logowania');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⚽</div>
          <h1 className="text-3xl font-black text-wc-gold">TYPER MŚ 2026</h1>
          <p className="text-white/50 text-sm mt-1">Mistrzostwa Świata w Piłce Nożnej</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-6 text-center">Zaloguj się</h2>
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Login</label>
              <input
                className="input"
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Hasło</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Logowanie…' : 'Zaloguj'}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-white/50 text-sm">
          Nie masz konta?{' '}
          <Link to="/register" className="text-wc-gold hover:underline font-semibold">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
}
