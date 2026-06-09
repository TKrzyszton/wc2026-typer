import { useState, useEffect } from 'react';
import api from '../api/client';

const TEAMS_48 = [
  'Argentyna','Australia','Belgia','Brazylia','Chile','Chorwacja','Czechy','Dania',
  'DRK','Ekwador','Egipt','Francja','Ghana','Hiszpania','Honduras','Holandia',
  'Iran','Jamajka','Japonia','Jordania','Kanada','Kamerun','Kolumbia','Korea Południowa',
  'Kostaryka','Mali','Maroko','Meksyk','Niemcy','Nigeria','Nowa Zelandia',
  'Panama','Paragwaj','Peru','Polska','Portugalia','Rumunia','Arabia Saudyjska',
  'Salwador','Senegal','Serbia','Szkocja','Trynidad i Tobago','Tunezja','Turcja',
  'Ukraina','Urugwaj','USA','Uzbekistan','Wenezuela','Węgry','Włochy',
];

function MatchRow({ match, onSaved }) {
  const [homeScore, setHomeScore] = useState(match.home_score ?? '');
  const [awayScore, setAwayScore] = useState(match.away_score ?? '');
  const [pen, setPen] = useState(!!match.ended_with_penalties);
  const [homeTeam, setHomeTeam] = useState(match.home_team);
  const [awayTeam, setAwayTeam] = useState(match.away_team);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const saveResult = async () => {
    setSaving(true); setMsg('');
    try {
      await api.put(`/admin/matches/${match.id}/result`, {
        home_score: parseInt(homeScore),
        away_score: parseInt(awayScore),
        ended_with_penalties: pen,
        status: 'finished',
      });
      setMsg('✓');
      onSaved();
    } catch (e) { setMsg('Błąd: ' + (e.response?.data?.error || e.message)); }
    finally { setSaving(false); }
  };

  const saveTeams = async () => {
    setSaving(true); setMsg('');
    try {
      await api.put(`/admin/matches/${match.id}/teams`, {
        home_team: homeTeam, away_team: awayTeam,
      });
      setMsg('✓ Drużyny zapisane');
      onSaved();
    } catch (e) { setMsg('Błąd'); }
    finally { setSaving(false); }
  };

  const isKnockout = match.round !== 'Faza grupowa';
  const isTBD = match.home_team === 'TBD' || match.away_team === 'TBD';

  return (
    <div className="card text-sm mb-3">
      <div className="flex gap-2 flex-wrap items-center mb-2">
        <span className="text-white/40 text-xs">{match.match_date} {match.match_time}</span>
        <span className="badge bg-wc-navy border border-white/10 text-white/60 text-xs">{match.round}</span>
        {match.status === 'finished' && <span className="badge bg-green-600 text-white text-xs">Zakończony</span>}
      </div>

      {/* Teams editor (knockout TBD) */}
      {isKnockout && (
        <div className="flex gap-2 items-center mb-3 flex-wrap">
          <select className="input flex-1 text-sm py-1" value={homeTeam} onChange={e => setHomeTeam(e.target.value)}>
            <option value="TBD">TBD</option>
            {TEAMS_48.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="text-white/30 font-bold">vs</span>
          <select className="input flex-1 text-sm py-1" value={awayTeam} onChange={e => setAwayTeam(e.target.value)}>
            <option value="TBD">TBD</option>
            {TEAMS_48.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn-secondary text-xs py-1 px-3" onClick={saveTeams} disabled={saving}>
            Zapisz drużyny
          </button>
        </div>
      )}

      {/* Current teams display for group stage */}
      {!isKnockout && (
        <div className="font-bold mb-2 text-center">
          {match.home_team} vs {match.away_team}
        </div>
      )}

      {/* Result entry */}
      <div className="flex gap-3 items-center flex-wrap">
        <input
          type="number" min="0" className="score-input text-sm"
          value={homeScore} onChange={e => setHomeScore(e.target.value)}
          placeholder="0"
        />
        <span className="text-white/30 font-bold">:</span>
        <input
          type="number" min="0" className="score-input text-sm"
          value={awayScore} onChange={e => setAwayScore(e.target.value)}
          placeholder="0"
        />

        {isKnockout && (
          <label className="flex items-center gap-1 text-xs text-purple-300 cursor-pointer">
            <input type="checkbox" checked={pen} onChange={e => setPen(e.target.checked)} className="accent-purple-500" />
            Rzuty karne
          </label>
        )}

        <button className="btn-primary text-xs py-1 px-4" onClick={saveResult} disabled={saving || homeScore === '' || awayScore === ''}>
          {saving ? '…' : 'Zapisz wynik + przelicz'}
        </button>

        {msg && <span className={`text-xs ${msg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{msg}</span>}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [matches, setMatches] = useState([]);
  const [champion, setChampion] = useState('');
  const [filter, setFilter] = useState('all');
  const [champMsg, setChampMsg] = useState('');
  const [users, setUsers] = useState([]);
  const [resetingId, setResetingId] = useState(null);
  const [resetPass, setResetPass] = useState('');
  const [resetMsg, setResetMsg] = useState({});

  const loadMatches = () => {
    api.get('/matches').then(r => {
      const all = Object.values(r.data).flat();
      setMatches(all);
    });
  };

  useEffect(() => {
    loadMatches();
    api.get('/admin/users').then(r => setUsers(r.data));
  }, []);

  const setWorldChampion = async () => {
    if (!champion) return;
    try {
      await api.put('/admin/champion', { team: champion });
      setChampMsg('✓ Mistrz zapisany i punkty przyznane!');
    } catch (e) { setChampMsg('Błąd'); }
  };

  const toggleAdmin = async (userId, current) => {
    await api.put(`/admin/users/${userId}/admin`, { is_admin: !current });
    setUsers(users.map(u => u.id === userId ? { ...u, is_admin: current ? 0 : 1 } : u));
  };

  const startReset = (userId) => {
    setResetingId(userId);
    setResetPass('');
    setResetMsg({});
  };

  const savePassword = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/password`, { password: resetPass });
      setResetMsg({ [userId]: '✓ Hasło zmienione' });
      setResetingId(null);
    } catch (e) {
      setResetMsg({ [userId]: e.response?.data?.error || 'Błąd' });
    }
  };

  const displayMatches = filter === 'all'
    ? matches
    : filter === 'unfinished'
    ? matches.filter(m => m.status !== 'finished' && m.home_team !== 'TBD')
    : matches.filter(m => m.status === 'finished');

  return (
    <div>
      <h1 className="text-2xl font-black mb-6 flex items-center gap-2 text-red-400">
        ⚙️ Panel Administratora
      </h1>

      {/* World champion */}
      <div className="card mb-6 border-yellow-400/20">
        <h2 className="font-bold text-wc-gold mb-3 flex items-center gap-2">🏆 Ustaw Mistrza Świata</h2>
        <div className="flex gap-3 flex-wrap">
          <select className="input flex-1" value={champion} onChange={e => setChampion(e.target.value)}>
            <option value="">– wybierz mistrza –</option>
            {TEAMS_48.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn-primary" onClick={setWorldChampion} disabled={!champion}>
            Zatwierdź i przyznaj punkty
          </button>
        </div>
        {champMsg && <p className="text-green-400 text-sm mt-2">{champMsg}</p>}
      </div>

      {/* Matches */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <h2 className="font-bold text-lg mr-auto">Wyniki meczów</h2>
        {['all', 'unfinished', 'finished'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full font-semibold ${
              filter === f ? 'bg-wc-gold text-wc-dark' : 'bg-wc-navy border border-white/10 text-white/60'
            }`}
          >
            {{ all: 'Wszystkie', unfinished: 'Do wpisania', finished: 'Zakończone' }[f]}
          </button>
        ))}
      </div>

      <div>
        {displayMatches.map(m => (
          <MatchRow key={m.id} match={m} onSaved={loadMatches} />
        ))}
      </div>

      {/* Users */}
      <h2 className="font-bold text-lg mt-8 mb-4">Użytkownicy</h2>
      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/40 border-b border-white/10">
              <th className="text-left py-2 px-2">Login</th>
              <th className="text-left py-2 px-2">Zarejestrowany</th>
              <th className="text-center py-2 px-2">Admin</th>
              <th className="text-center py-2 px-2">Hasło</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="py-2 px-2 font-semibold">{u.username}</td>
                <td className="py-2 px-2 text-white/40 text-xs">{u.created_at?.slice(0, 10)}</td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={() => toggleAdmin(u.id, u.is_admin)}
                    className={`text-xs px-2 py-0.5 rounded font-bold ${
                      u.is_admin ? 'bg-red-600 text-white' : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {u.is_admin ? 'Admin' : 'User'}
                  </button>
                </td>
                <td className="py-2 px-2 text-center">
                  {resetingId === u.id ? (
                    <div className="flex gap-1 items-center justify-center">
                      <input
                        type="password"
                        className="input text-xs py-0.5 px-2 w-28"
                        placeholder="nowe hasło"
                        value={resetPass}
                        onChange={e => setResetPass(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && savePassword(u.id)}
                        autoFocus
                      />
                      <button
                        onClick={() => savePassword(u.id)}
                        disabled={resetPass.length < 6}
                        className="text-xs px-2 py-0.5 rounded font-bold bg-green-700 text-white disabled:opacity-40"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setResetingId(null)}
                        className="text-xs px-2 py-0.5 rounded font-bold bg-white/10 text-white/40"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => startReset(u.id)}
                        className="text-xs px-2 py-0.5 rounded font-bold bg-blue-700/60 text-blue-200 hover:bg-blue-600"
                      >
                        Resetuj
                      </button>
                      {resetMsg[u.id] && (
                        <span className="text-xs text-green-400">{resetMsg[u.id]}</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
