import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const POINTS_COLORS = {
  5: 'bg-purple-500 text-white',
  3: 'bg-green-500 text-white',
  2: 'bg-blue-500 text-white',
  1: 'bg-yellow-500 text-black',
  0: 'bg-red-500/70 text-white',
};

function formatTime(dateStr, timeStr) {
  // Parsuj jako CEST, wyświetl w strefie użytkownika — dla polskiego użytkownika wyjdzie identycznie
  const dt = new Date(`${dateStr}T${timeStr}:00+02:00`);
  return dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
}

// +02:00 = CEST (czas polski letni) — turniej czerwiec–lipiec
function isLocked(dateStr, timeStr) {
  const dt = new Date(`${dateStr}T${timeStr}:00+02:00`);
  return Date.now() >= dt.getTime() - 5 * 60 * 1000;
}

// Kolor obramowania karty na podstawie zdobytych punktów
const CARD_COLORS = {
  5: 'border-green-500/60 bg-green-500/5',
  3: 'border-green-500/60 bg-green-500/5',
  2: 'border-blue-500/60 bg-blue-500/5',
  1: 'border-yellow-500/60 bg-yellow-500/5',
  0: 'border-red-500/60 bg-red-500/5',
};

export default function MatchCard({ match, onUpdate }) {
  const { user } = useAuth();
  const locked = isLocked(match.match_date, match.match_time);
  const finished = match.status === 'finished';
  const isKnockout = match.round !== 'Faza grupowa';
  const isTBD = match.home_team === 'TBD' || match.away_team === 'TBD';

  const cardColor = finished && match.pred_points !== null && match.pred_points !== undefined
    ? CARD_COLORS[match.pred_points] ?? ''
    : '';

  const [home, setHome] = useState(
    match.pred_home !== null && match.pred_home !== undefined ? String(match.pred_home) : ''
  );
  const [away, setAway] = useState(
    match.pred_away !== null && match.pred_away !== undefined ? String(match.pred_away) : ''
  );
  const [penalties, setPenalties] = useState(!!match.predict_penalties);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [allPreds, setAllPreds] = useState(null);
  const awayRef = useRef(null);

  const hasPrediction = penalties || (home !== '' && away !== '');

  useEffect(() => {
    if (!user || !locked) return;
    api.get(`/predictions/match/${match.id}/all`)
      .then(r => setAllPreds(r.data))
      .catch(() => {});
  }, [locked, match.id, user]);

  const save = async () => {
    setError('');
    setSaving(true);
    try {
      await api.post(`/predictions/match/${match.id}`, {
        home_score: penalties ? null : parseInt(home),
        away_score: penalties ? null : parseInt(away),
        predict_penalties: penalties,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd zapisu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`card transition-all ${cardColor} ${locked && !finished ? 'opacity-70' : ''}`}>
      {/* Round label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/40 font-medium">
          {match.group_name ? `${match.group_name} • ` : ''}{match.round}
        </span>
        <span className="text-xs text-white/40">{match.venue}</span>
      </div>

      {/* Teams and scores */}
      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className={`font-bold text-sm sm:text-base ${isTBD ? 'text-white/30' : ''}`}>
            {match.home_team}
          </span>
          {match.home_flag && (
            <img src={match.home_flag} alt="" className="h-5 w-7 object-cover rounded-sm" />
          )}
        </div>

        {/* Score / time */}
        <div className="flex flex-col items-center min-w-[80px]">
          {finished ? (
            <div className="flex items-center gap-1 text-xl font-black">
              <span className="text-wc-gold">{match.home_score}</span>
              <span className="text-white/40">:</span>
              <span className="text-wc-gold">{match.away_score}</span>
              {match.ended_with_penalties ? (
                <span className="text-xs text-purple-400 ml-1">(k)</span>
              ) : null}
            </div>
          ) : (
            <div className="text-wc-gold font-bold text-lg">
              {formatTime(match.match_date, match.match_time)}
            </div>
          )}
          {locked && !finished && (
            <span className="text-xs text-red-400 font-semibold">🔒 Zablokowane</span>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex items-center gap-2">
          {match.away_flag && (
            <img src={match.away_flag} alt="" className="h-5 w-7 object-cover rounded-sm" />
          )}
          <span className={`font-bold text-sm sm:text-base ${isTBD ? 'text-white/30' : ''}`}>
            {match.away_team}
          </span>
        </div>
      </div>

      {/* Prediction area – show for all non-group matches (even TBD), and for group matches with known teams */}
      {(!isTBD || isKnockout) && (
        <div className="mt-4 pt-3 border-t border-white/10">
          {/* Niezalogowany – zachęta do logowania */}
          {!user ? (
            <div className="text-center">
              <Link to="/login" className="text-sm text-wc-gold hover:underline font-semibold">
                Zaloguj się
              </Link>
              <span className="text-sm text-white/30"> aby typować</span>
            </div>
          ) : finished ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-white/50">Twój typ:</span>
                {match.pred_points !== null && match.pred_points !== undefined ? (
                  <>
                    {penalties ? (
                      <span className="font-bold text-purple-400">Rzuty karne</span>
                    ) : home !== '' ? (
                      <span className="font-bold">{home} : {away}</span>
                    ) : (
                      <span className="text-white/30">brak</span>
                    )}
                    <span className={`badge ${POINTS_COLORS[match.pred_points]}`}>
                      +{match.pred_points} pkt
                    </span>
                  </>
                ) : (
                  <span className="text-white/30 text-sm">brak typu</span>
                )}
              </div>
              {allPreds && allPreds.length > 0 && (
                <div className="border-t border-white/10 pt-2">
                  <p className="text-xs text-white/30 text-center mb-2">Typy graczy</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
                    {allPreds.map(p => (
                      <div key={p.username} className="flex items-center gap-1.5 text-xs">
                        <span className="text-white/50">{p.username}:</span>
                        {p.predict_penalties ? (
                          <span className="text-purple-400 font-semibold">🎯 k</span>
                        ) : (
                          <span className={`font-semibold ${p.points !== null && p.points !== undefined ? (POINTS_COLORS[p.points] ? '' : '') : ''}`}>
                            {p.home_score}:{p.away_score}
                          </span>
                        )}
                        {p.points !== null && p.points !== undefined && (
                          <span className={`badge text-xs py-0 ${POINTS_COLORS[p.points]}`}>+{p.points}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : locked ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 text-sm">
                <span className="text-white/50">Twój typ:</span>
                {penalties ? (
                  <span className="font-bold text-purple-400">🎯 Rzuty karne</span>
                ) : hasPrediction ? (
                  <span className="font-bold text-wc-gold">{home} : {away}</span>
                ) : (
                  <span className="text-white/30 italic">brak</span>
                )}
              </div>
              {allPreds && allPreds.length > 0 && (
                <div className="border-t border-white/10 pt-2">
                  <p className="text-xs text-white/30 text-center mb-2">Typy graczy</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
                    {allPreds.map(p => (
                      <div key={p.username} className="flex items-center gap-1.5 text-xs">
                        <span className="text-white/50">{p.username}:</span>
                        {p.predict_penalties ? (
                          <span className="text-purple-400 font-semibold">🎯 k</span>
                        ) : (
                          <span className="font-semibold text-white/80">{p.home_score}:{p.away_score}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Score inputs */}
              {!penalties && (
                <div className="flex items-center justify-center gap-3">
                  <input
                    className="score-input"
                    type="number" min="0" max="30"
                    value={home}
                    onChange={e => {
                      setHome(e.target.value);
                      if (e.target.value !== '' && home === '') awayRef.current?.focus();
                    }}
                    placeholder="–"
                  />
                  <span className="text-white/40 font-bold">:</span>
                  <input
                    ref={awayRef}
                    className="score-input"
                    type="number" min="0" max="30"
                    value={away}
                    onChange={e => setAway(e.target.value)}
                    placeholder="–"
                  />
                </div>
              )}

              {/* Penalty option – knockout rounds only */}
              {isKnockout && (
                <label className="flex items-center justify-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={penalties}
                    onChange={e => setPenalties(e.target.checked)}
                    className="w-4 h-4 accent-purple-500"
                  />
                  <span className="text-sm text-purple-300 font-medium">
                    🎯 Typ: Rzuty karne (+5 pkt jeśli trafisz)
                  </span>
                </label>
              )}

              {error && <p className="text-red-400 text-xs text-center">{error}</p>}

              <div className="flex flex-col items-center gap-1.5">
                <button
                  className="btn-primary text-sm py-1.5 px-6"
                  onClick={save}
                  disabled={saving || (!penalties && (home === '' || away === ''))}
                >
                  {saving ? '…' : saved ? '✓ Zapisano!' : 'Zapisz typ'}
                </button>
                {hasPrediction && (
                  <span className="text-xs text-white/40">
                    Twój ostatni zapisany typ:{' '}
                    {penalties ? (
                      <span className="text-purple-400 font-semibold">Rzuty karne</span>
                    ) : (
                      <span className="text-wc-gold font-semibold">{home}:{away}</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
