import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-wc-navy border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <div>
              <div className="font-black text-wc-gold text-lg leading-none">TYPER</div>
              <div className="text-xs text-white/50 leading-none">MŚ 2026</div>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink
              to="/typowanie"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  isActive ? 'bg-wc-gold text-wc-dark' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              Typowanie
            </NavLink>
            <NavLink
              to="/tabela"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  isActive ? 'bg-wc-gold text-wc-dark' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              Tabela
            </NavLink>
            <NavLink
              to="/zasady"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  isActive ? 'bg-wc-gold text-wc-dark' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              Zasady
            </NavLink>
            {user?.is_admin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    isActive ? 'bg-red-600 text-white' : 'text-red-400 hover:text-red-300 hover:bg-white/10'
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-white/60 hidden sm:block">
                  👤 <span className="text-white font-semibold">{user.username}</span>
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-white/50 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
                >
                  Wyloguj
                </button>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="text-sm font-semibold px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  Zaloguj
                </Link>
                <Link to="/register"
                  className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-wc-gold text-wc-dark hover:brightness-110 transition-all">
                  Rejestracja
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="text-center text-white/20 text-xs py-4">
        MŚ 2026 Typer • Użyj z głową 🏆
      </footer>
    </div>
  );
}
