import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
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

const ROUNDS = ['Faza grupowa', 'Runda 32', '1/8 Finału', 'Ćwierćfinał', 'Półfinał', 'Mecz o 3. miejsce', 'Finał'];

function formatDate(dateStr) {
  const dt = new Date(dateStr + 'T12:00:00');
  return dt.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatDayBtn(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return '📅 Dziś';
  const dt = new Date(dateStr + 'T12:00:00');
  return dt.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' });
}

function ChampionWidget() {
  const [pred, setPred] = useState(null);
  const [team, setTeam] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState('');
  const [allChampPreds, setAllChampPreds] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    api.get('/predictions/champion').then(r => {
      if (r.data) { setPred(r.data); setTeam(r.data.team); }
    }).catch(() => {});
    api.get('/predictions/champion/all').then(r => {
      setAllChampPreds(r.data);
    }).catch(() => {});
  }, [user]);

  const save = async () => {
    if (!team) return;
    setError(''); setSaving(true);
    try {
      await api.post('/predictions/champion', { team });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Błąd zapisu';
      if (msg.includes('zablokowane')) setLocked(true);
      setError(msg);
    } finally { setSaving(false); }
  };

  const isLocked = locked || (pred?.points > 0) || allChampPreds !== null;

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
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/50">Twój typ:</span>
            <span className="font-bold text-wc-gold text-lg">{pred?.team || '—'}</span>
            {pred?.points === 5 ? (
              <span className="badge bg-yellow-400 text-black text-xs ml-1">+5 pkt!</span>
            ) : pred?.team ? (
              <span className="text-white/30 text-xs ml-1">🔒 zablokowane</span>
            ) : null}
          </div>
          {allChampPreds && allChampPreds.length > 0 && (
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs text-white/30 mb-2">Typy wszystkich graczy</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {allChampPreds.map(p => (
                  <div key={p.username} className="flex items-center gap-1.5 text-sm">
                    <span className="text-white/50 text-xs">{p.username}:</span>
                    <span className={`font-bold ${p.points === 5 ? 'text-yellow-400' : 'text-white/80'}`}>
                      {p.team || '—'}
                    </span>
                    {p.points === 5 && <span className="text-yellow-400 text-xs">+5</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-white/50 mb-1">Wybierz drużynę</label>
            <select className="input" value={team} onChange={e => setTeam(e.target.value)}>
              <option value="">– wybierz –</option>
              {TEAMS_48.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button className="btn-primary whitespace-nowrap" onClick={save} disabled={saving || !team}>
            {saving ? '…' : saved ? '✓ Zapisano!' : 'Zapisz'}
          </button>
        </div>
      )}
      {error && !locked && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}

export default function BettingPage() {
  const { user } = useAuth();
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeRound, setActiveRound] = useState('Faza grupowa');
  const [activeDate, setActiveDate] = useState(null);
  const hasScrolled = useRef(false);
  const dateCarouselRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/matches');
      setGrouped(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  // All matches flat, filtered by active round
  const roundMatches = useMemo(() => {
    const all = Object.values(grouped).flat();
    return all.filter(m =>
      activeRound === 'Faza grupowa' ? m.round === 'Faza grupowa' : m.round === activeRound
    );
  }, [grouped, activeRound]);

  // Unique sorted dates in this round
  const roundDates = useMemo(() => {
    return [...new Set(roundMatches.map(m => m.match_date))].sort();
  }, [roundMatches]);

  // Set default date when round or data changes
  useEffect(() => {
    if (roundDates.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    if (roundDates.includes(today)) {
      setActiveDate(today);
    } else {
      const upcoming = roundDates.find(d => d >= today);
      setActiveDate(upcoming || roundDates[roundDates.length - 1]);
    }
  }, [activeRound, roundDates.join(',')]);

  // Scroll date carousel to active date button
  useEffect(() => {
    if (!activeDate || !dateCarouselRef.current) return;
    const btn = dateCarouselRef.current.querySelector(`[data-date="${activeDate}"]`);
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeDate]);

  // Matches to display (filtered by date)
  const displayMatches = useMemo(() => {
    if (!activeDate) return roundMatches;
    return roundMatches.filter(m => m.match_date === activeDate);
  }, [roundMatches, activeDate]);

  // Auto-scroll to boundary between settled and upcoming — once on initial load
  useEffect(() => {
    if (loading || hasScrolled.current || displayMatches.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    if (activeDate !== today && activeDate < today) return; // only for today/future
    setTimeout(() => {
      const firstUnfinished = displayMatches.find(m => m.status !== 'finished');
      const target = firstUnfinished || displayMatches[displayMatches.length - 1];
      if (target) {
        document.getElementById(`match-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        hasScrolled.current = true;
      }
    }, 300);
  }, [displayMatches, loading, activeDate]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-wc-gold text-xl animate-pulse">Ładowanie…</div>
    </div>
  );

  return (
    <div>
      {user && <ChampionWidget />}

      {/* Round selector */}
      <div className="flex gap-2 flex-wrap mb-4">
        {ROUNDS.map(r => (
          <button
            key={r}
            onClick={() => { setActiveRound(r); hasScrolled.current = false; }}
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

      {/* Day carousel */}
      {roundDates.length > 1 && (
        <div ref={dateCarouselRef} className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {roundDates.map(d => (
            <button
              key={d}
              data-date={d}
              onClick={() => setActiveDate(d)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors ${
                activeDate === d
                  ? 'bg-wc-gold text-wc-dark'
                  : 'bg-wc-navy border border-white/10 text-white/60 hover:text-white'
              }`}
            >
              {formatDayBtn(d)}
            </button>
          ))}
        </div>
      )}

      {/* Matches */}
      {displayMatches.length === 0 ? (
        <div className="text-center text-white/30 py-12 text-lg">Brak meczów</div>
      ) : (
        <div>
          <h2 className="text-wc-gold font-black text-lg mb-3 capitalize flex items-center gap-2">
            <span className="text-2xl">📅</span>
            {activeDate ? formatDate(activeDate) : ''}
          </h2>
          <div className="space-y-3">
            {displayMatches.map(m => (
              <div key={m.id} id={`match-${m.id}`}>
                <MatchCard match={m} onUpdate={load} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
