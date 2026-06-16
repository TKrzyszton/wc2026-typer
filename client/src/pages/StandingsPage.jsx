import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function StandingsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/standings')
      .then(r => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-wc-gold text-xl animate-pulse">Ładowanie…</div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
        <span>🏆</span> Tabela wyników
      </h1>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/40 border-b border-white/10 text-xs">
              <th className="text-center py-3 px-2 w-8">#</th>
              <th className="text-left py-3 px-2">Gracz</th>
              <th className="text-center py-3 px-1 w-10" title="Liczba rozliczonych meczów">⚽</th>
              <th className="text-center py-3 px-1 w-10 hidden sm:table-cell" title="Punkty za mistrza">🏆</th>
              <th className="text-center py-3 px-2 w-14 font-bold text-white/60">Pkt</th>
              <th className="text-center py-3 px-1 w-10 hidden sm:table-cell" title="Trafione dokładne wyniki">3★</th>
              <th className="text-center py-3 px-1 w-10 hidden sm:table-cell" title="Trafiona różnica bramek">2★</th>
              <th className="text-center py-3 px-1 w-10 hidden sm:table-cell" title="Trafiony zwycięzca">1★</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isMe = row.username === user?.username;
              return (
                <tr
                  key={row.id}
                  className={`border-b border-white/5 transition-colors ${
                    isMe ? 'bg-wc-gold/10' : 'hover:bg-white/5'
                  }`}
                >
                  <td className="py-3 px-2 text-center font-bold text-white/50 text-base">
                    {MEDALS[i] || i + 1}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`font-bold ${isMe ? 'text-wc-gold' : ''}`}>
                      {row.username}
                    </span>
                    {isMe && <span className="text-xs text-white/30 ml-1">(ty)</span>}
                  </td>
                  <td className="py-3 px-1 text-center text-blue-300">{row.played_count}</td>
                  <td className="py-3 px-1 text-center text-yellow-300 hidden sm:table-cell">{row.champion_points}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={`font-black text-base ${isMe ? 'text-wc-gold' : 'text-white'}`}>
                      {row.total_points}
                    </span>
                  </td>
                  <td className="py-3 px-1 text-center text-green-400 hidden sm:table-cell">{row.exact_3}</td>
                  <td className="py-3 px-1 text-center text-blue-400 hidden sm:table-cell">{row.exact_2}</td>
                  <td className="py-3 px-1 text-center text-yellow-400 hidden sm:table-cell">{row.exact_1}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-white/30">
                  Brak danych – gra się jeszcze nie zaczęła!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-white/50">
        <div className="card py-2">
          <span className="font-bold text-green-400">3 pkt</span> – dokładny wynik
        </div>
        <div className="card py-2">
          <span className="font-bold text-blue-400">2 pkt</span> – różnica bramek
        </div>
        <div className="card py-2">
          <span className="font-bold text-yellow-400">1 pkt</span> – zwycięzca
        </div>
        <div className="card py-2">
          <span className="font-bold text-yellow-300">5 pkt</span> – mistrz świata 🏆
        </div>
        <div className="card py-2">
          <span className="font-bold text-purple-400">5 pkt</span> – rzuty karne 🎯
        </div>
        <div className="card py-2">
          <span className="font-bold text-red-400">0 pkt</span> – pudło
        </div>
      </div>
    </div>
  );
}
