import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const bottomNav = [
  { to: '/dzis',           icon: '🔥', label: 'Dziś' },
  { to: '/typowanie',      icon: '⚽', label: 'Typuj' },
  { to: '/tabela',         icon: '🏆', label: 'Tabela' },
  { to: '/zasady',         icon: '📋', label: 'Zasady' },
  { to: '/powiadomienia',  icon: '🔔', label: 'Powiadom.' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="bg-wc-navy border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <div>
              <div className="font-black text-wc-gold text-base leading-none">TYPER</div>
              <div className="text-xs text-white/50 leading-none">MŚ 2026</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink to="/dzis" className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${isActive ? 'bg-orange-500 text-white' : 'text-orange-400 hover:text-orange-300 hover:bg-white/10'}`}>
              🔥 Dziś
            </NavLink>
            <NavLink to="/typowanie" className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${isActive ? 'bg-wc-gold text-wc-dark' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              Typowanie
            </NavLink>
            <NavLink to="/tabela" className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${isActive ? 'bg-wc-gold text-wc-dark' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              Tabela
            </NavLink>
            <NavLink to="/zasady" className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${isActive ? 'bg-wc-gold text-wc-dark' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              Zasady
            </NavLink>
            <NavLink to="/powiadomienia" className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${isActive ? 'bg-wc-gold text-wc-dark' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              🔔 Powiadomienia
            </NavLink>
            {user?.is_admin && (
              <NavLink to="/admin" className={({ isActive }) =>
                `px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${isActive ? 'bg-red-600 text-white' : 'text-red-400 hover:text-red-300 hover:bg-white/10'}`}>
                Admin
              </NavLink>
            )}
          </nav>

          {/* User area */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-white/60 hidden sm:block">
                  👤 <span className="text-white font-semibold">{user.username}</span>
                </span>
                <button onClick={logout} className="text-xs text-white/40 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10">
                  Wyloguj
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  Zaloguj
                </Link>
                <Link to="/register" className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-wc-gold text-wc-dark hover:brightness-110 transition-all">
                  Rejestracja
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main — extra bottom padding on mobile so content isn't hidden behind bottom nav */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24 sm:pb-6 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d1f3c] border-t-2 border-wc-gold/30 flex shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        {bottomNav.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-semibold transition-colors ${
                isActive ? 'text-wc-gold' : 'text-white/35 hover:text-white'
              }`
            }
          >
            <span className="text-2xl leading-none">{icon}</span>
            <span className="tracking-wide">{label}</span>
          </NavLink>
        ))}
        {user?.is_admin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-semibold transition-colors ${
                isActive ? 'text-red-400' : 'text-white/35 hover:text-white'
              }`
            }
          >
            <span className="text-2xl leading-none">🔧</span>
            <span className="tracking-wide">Admin</span>
          </NavLink>
        )}
      </nav>

      <footer className="hidden sm:block text-center text-white/20 text-xs py-4">
        MŚ 2026 Typer • Użyj z głową 🏆
      </footer>
    </div>
  );
}
