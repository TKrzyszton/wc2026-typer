import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import MatchCard from '../components/MatchCard';

export default function TodayPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/matches');
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const all = Object.values(data).flat();
      const upcoming = all.filter(m => {
        const dt = new Date(`${m.match_date}T${m.match_time}:00+02:00`);
        return dt >= new Date(now.getTime() - 2 * 60 * 60 * 1000) && dt <= in24h;
      });
      upcoming.sort((a, b) => {
        const da = new Date(`${a.match_date}T${a.match_time}:00+02:00`);
        const db = new Date(`${b.match_date}T${b.match_time}:00+02:00`);
        return da - db;
      });
      setMatches(upcoming);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-wc-gold text-xl animate-pulse">Ładowanie…</div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
        <span>🔥</span> Obstaw dziś
      </h1>
      <p className="text-white/40 text-sm mb-6">Mecze w ciągu najbliższych 24h</p>

      {matches.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">😴</div>
          <p className="text-white/40 text-lg">Brak meczów w ciągu najbliższych 24h</p>
          <p className="text-white/20 text-sm mt-1">Wróć później lub sprawdź zakładkę Typowanie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(m => (
            <MatchCard key={m.id} match={m} onUpdate={load} />
          ))}
        </div>
      )}
    </div>
  );
}
