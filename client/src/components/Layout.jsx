import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  const navCls = ({ isActive }, active, base = 'text-white/70') =>
    `block px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
      isActive ? active : `${base} hover:text-white hover:bg-white/10`
    }`;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="bg-wc-navy border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={close}>
            <span className="text-2xl">⚽</span>
            <div>
              <div className="font-black text-wc-gold text-lg leading-none">TYPER</div>
              <div className="text-xs text-white/50 leading-none">MŚ 2026</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink to="/dzis" className={p => navCls(p, 'bg-orange-500 text-white', 'text-orange-400')}>
              🔥 Dziś
            </NavLink>
            <NavLink to="/typowanie" className={p => navCls(p, 'bg-wc-gold text-wc-dark')}>
              Typowanie
            </NavLink>
            <NavLink to="/tabela" className={p => navCls(p, 'bg-wc-gold text-wc-dark')}>
              Tabela
            </NavLink>
            <NavLink to="/zasady" className={p => navCls(p, 'bg-wc-gold text-wc-dark')}>
              Zasady
            </NavLink>
            {user?.is_admin && (
              <NavLink to="/admin" className={p => navCls(p, 'bg-red-600 text-white', 'text-red-400')}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {/* Desktop user */}
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-sm text-white/60">
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
                  <Link to="/login" className="text-sm font-semibold px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                    Zaloguj
                  </Link>
                  <Link to="/register" className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-wc-gold text-wc-dark hover:brightness-110 transition-all">
                    Rejestracja
                  </Link>
                </>
              )}
            </div>

            {/* Hamburger */}
            <button
              className="sm:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
            >
              <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden border-t border-white/10 bg-wc-navy px-4 py-3 space-y-1">
            <NavLink to="/dzis" onClick={close} className={p => navCls(p, 'bg-orange-500 text-white', 'text-orange-400')}>
              🔥 Dziś
            </NavLink>
            <NavLink to="/typowanie" onClick={close} className={p => navCls(p, 'bg-wc-gold text-wc-dark')}>
              ⚽ Typowanie
            </NavLink>
            <NavLink to="/tabela" onClick={close} className={p => navCls(p, 'bg-wc-gold text-wc-dark')}>
              🏆 Tabela
            </NavLink>
            <NavLink to="/zasady" onClick={close} className={p => navCls(p, 'bg-wc-gold text-wc-dark')}>
              📋 Zasady
            </NavLink>
            {user?.is_admin && (
              <NavLink to="/admin" onClick={close} className={p => navCls(p, 'bg-red-600 text-white', 'text-red-400')}>
                🔧 Admin
              </NavLink>
            )}
            <div className="pt-2 border-t border-white/10 mt-2">
              {user ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">
                    👤 <span className="text-white font-semibold">{user.username}</span>
                  </span>
                  <button onClick={() => { logout(); close(); }} className="text-sm text-white/50 hover:text-white px-3 py-1.5 rounded hover:bg-white/10">
                    Wyloguj
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" onClick={close} className="flex-1 text-center text-sm font-semibold px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
                    Zaloguj
                  </Link>
                  <Link to="/register" onClick={close} className="flex-1 text-center text-sm font-semibold px-3 py-2 rounded-lg bg-wc-gold text-wc-dark">
                    Rejestracja
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 overflow-x-hidden">
        <Outlet />
      </main>

      <footer className="text-center text-white/20 text-xs py-4">
        MŚ 2026 Typer • Użyj z głową 🏆
      </footer>
    </div>
  );
}
