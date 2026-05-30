import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import MatchCard from '../components/MatchCard';

const TEAMS_48 = [
  'Argentyna','Australia','Belgia','Brazylia','Chile','Chorwacja','Czechy','Dania',
  'DRK','Ekwador','Egipt','Francja','Ghana','Hiszpania','Honduras','Holandia',
  'Iran','Jamajka','Japonia','Jordania','Kanada','Kamerun','Kolumbia','Korea Południowa',
  'Kostaryka','Mali','Maroko','Meksyk','Niemcy','Nigeria','Nowa Zelandia',
  'Panama','Paragwaj','Peru','Polska','Portugalia','Rumunia','Arabia Saudyjska',
  'Salwador','Senegal','Serbia','Szkocja','Trynidad i Tobago','Tunezja','Turcja',
  'Ukraina','Urugwaj','USA','Uzbekistan','Wenezuela','Węgry','Włochy',
];

function formatDate(dateStr) {
  const dt = new Date(dateStr + 'T12:00:00');
  return dt.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
}

function ChampionWidget() {
  const [pred, setPred] = useState(null);
  const [team, setTeam] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/predictions/champion').then(r => {
      if (r.data) {
        setPred(r.data);
        setTeam(r.data.team);
      }
    }).catch(() => {});
  }, []);

  const save = async () => {
    if (!team) return;
    setError('');
    setSaving(true);
    try {
      await api.post('/predictions/champion', { team });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Błąd zapisu';
      if (msg.includes('zablokowane')) setLocked(true);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const isLocked = locked || (pred?.points > 0);

  return (
    <div className="card border-wc-gold/30 bg-gradient-to-r from-wc-navy to-wc-dark mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🏆</span>
        <div>
          <h2 className="font-black text-wc-gold text-lg">Typ Mistrza Świata</h2>
          <p className="text-xs text-white/40">+5 pkt za trafienie • blokada 5 min przed 1. meczem</p>
        </div>
        {pred?.points === 5 && (
          <span className="ml-auto badge bg-yellow-400 text-black text-base px-3 py-1">🥇 +5 pkt!</span>
        )}
      </div>

      {isLocked ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/50">Twój typ:</span>
          <span className="font-bold text-wc-gold text-lg">{pred?.team || '—'}</span>
          {pred?.points === 0 && pred?.team && (
            <span className="text-white/30 text-xs ml-2">🔒 zablokowane</span>
          )}
        </div>
      ) : (
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-white/50 mb-1">Wybierz drużynę</label>
            <select
              className="input"
              value={team}
              onChange={e => setTeam(e.target.value)}
            >
              <option value="">– wybierz –</option>
              {TEAMS_48.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button
            className="btn-primary whitespace-nowrap"
            onClick={save}
            disabled={saving || !team}
          >
            {saving ? '…' : saved ? '✓ Zapisano!' : 'Zapisz'}
          </button>
        </div>
      )}
      {error && !locked && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}

export default function BettingPage() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeRound, setActiveRound] = useState('Faza grupowa');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/matches');
      setGrouped(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60s
  useEffect(() => {
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const allDates = Object.keys(grouped).sort();

  // Derive rounds from matches
  const rounds = ['Faza grupowa', 'Runda 32', '1/8 Finału', 'Ćwierćfinał', 'Półfinał', 'Mecz o 3. miejsce', 'Finał'];

  const filteredDates = allDates.filter(d =>
    grouped[d].some(m => {
      if (activeRound === 'Faza grupowa') return m.round === 'Faza grupowa';
      return m.round === activeRound;
    })
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-wc-gold text-xl animate-pulse">Ładowanie…</div>
    </div>
  );

  return (
    <div>
      <ChampionWidget />

      {/* Round selector */}
      <div className="flex gap-2 flex-wrap mb-6">
        {rounds.map(r => (
          <button
            key={r}
            onClick={() => setActiveRound(r)}
            className={`text-sm font-semibold px-3 py-1.5 rounded-full transition-colors ${
              activeRound === r
                ? 'bg-wc-gold text-wc-dark'
                : 'bg-wc-navy border border-white/10 text-white/60 hover:text-white'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Matches by day */}
      {filteredDates.length === 0 ? (
        <div className="text-center text-white/30 py-12 text-lg">Brak meczów w tej fazie</div>
      ) : (
        filteredDates.map(date => {
          const dayMatches = grouped[date].filter(m =>
            activeRound === 'Faza grupowa' ? m.round === 'Faza grupowa' : m.round === activeRound
          );
          if (!dayMatches.length) return null;
          return (
            <div key={date} className="mb-8">
              <h2 className="text-wc-gold font-black text-lg mb-3 capitalize flex items-center gap-2">
                <span className="text-2xl">📅</span>
                {formatDate(date)}
              </h2>
              <div className="space-y-3">
                {dayMatches.map(m => (
                  <MatchCard key={m.id} match={m} onUpdate={load} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
