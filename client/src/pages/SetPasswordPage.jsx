import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SetPasswordPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError('Hasła nie są identyczne');
    if (password.length < 6) return setError('Hasło musi mieć min. 6 znaków');
    setLoading(true);
    setError('');
    try {
      await updateUser(password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd, spróbuj ponownie');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-wc-dark px-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-xl font-black text-wc-gold mb-2">Ustaw nowe hasło</h1>
        <p className="text-white/50 text-sm mb-6">
          Administrator zresetował Twoje hasło. Zanim przejdziesz dalej, ustaw nowe.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Login</label>
            <div className="input bg-white/5 text-white/40 cursor-default">{user?.username}</div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Nowe hasło</label>
            <input
              type="password"
              className="input w-full"
              placeholder="min. 6 znaków"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Powtórz hasło</label>
            <input
              type="password"
              className="input w-full"
              placeholder="powtórz hasło"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || !password || !confirm}
          >
            {loading ? 'Zapisywanie…' : 'Ustaw hasło i zaloguj'}
          </button>
        </form>
      </div>
    </div>
  );
}
